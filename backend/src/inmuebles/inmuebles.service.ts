import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import {
  ClienteGestionEstado,
  getDefaultClienteGestionEstado,
  isClienteGestionEstadoForTipo,
} from '../clientes/cliente-gestion-estado';
import { Cliente } from '../clientes/interfaces/cliente.interface';
import { SupabaseService } from '../supabase/supabase.service';
import { CreateInmuebleDto } from './dto/create-inmueble.dto';
import { UpdateInmuebleDto } from './dto/update-inmueble.dto';
import { normalizePropietariosContactos } from './inmueble-propietarios.util';
import { InmuebleClienteLinkRow } from './interfaces/inmueble-cliente-link.interface';
import {
  ClientesByTipoPageQuery,
  ClientesByTipoPageResult,
} from './interfaces/clientes-by-tipo-page.interface';
import { getClienteEntradaSortKey } from './cliente-entrada-sort.util';
import { Inmueble } from './interfaces/inmueble.interface';

import { normalizeInmuebleSplitFields } from './inmueble-split-fields';
const SELECT_FIELDS =
  'id, ref, fecha_entrada_inmueble, imagen_real, direccion_piso_real, foto_espejo, espejo_direccion, barrio_distrito, distrito_ciudad, precio, precio_espejo, hab, banos, metros, larga_estancia_temporada, propietario_id, propietarios_contactos, nombre_propi, telf, ficha_del_piso_real, link_idealista, link_espejo, link_idealista_espejo, fecha_visitas, fecha_visitas_entrada, observaciones, requisitos_propietario, amueblado, captador, alquilado_por, captador_alquilado_por, status, activo, alquilado_codigo, vendido_codigo, row_color, tipo_operacion, created_at, updated_at';

const SELECT_DETAIL =
  `${SELECT_FIELDS}, cliente_inmuebles(cliente_id, gestion_estado, fecha_ultima_gestion, clientes(id, nombre, email, telefono, ciudad, estado, origen, estado_contacto, ref_cliente, fecha_contacto, fecha_ultima_gestion, presupuesto_maximo, banos, notas, created_at, updated_at, cliente_workers(worker_id, workers(id, nombre, rol))))` as const;

const CLIENTE_GLOBAL_FIELDS = `
  id,
  nombre,
  email,
  telefono,
  ciudad,
  barrio,
  distrito,
  tipo_nomina,
  tipo_cliente,
  estado,
  origen,
  estado_contacto,
  ref_cliente,
  fecha_contacto,
  fecha_entrada_inmueble,
  fecha_ultima_gestion,
  presupuesto_maximo,
  banos,
  notas,
  tipo_operacion,
  created_at,
  updated_at
`;

const CLIENTE_INMUEBLE_LINK_SELECT = `
  cliente_id,
  inmueble_id,
  gestion_estado,
  fecha_ultima_gestion,
  clientes(${CLIENTE_GLOBAL_FIELDS}),
  inmuebles!inner(id, ref, direccion_piso_real, barrio_distrito, tipo_operacion)
`;

const CLIENTE_UNLINKED_SELECT = `
  ${CLIENTE_GLOBAL_FIELDS},
  cliente_inmuebles(inmueble_id)
`;

const LINK_INDEX_SELECT = `
  cliente_id,
  inmueble_id,
  clientes!inner(fecha_contacto),
  inmuebles!inner(tipo_operacion)
`;

const UNLINKED_INDEX_SELECT = `
  id,
  fecha_contacto,
  cliente_inmuebles(inmueble_id)
`;

const MAX_CLIENTES_BY_TIPO_LIMIT = 10_000;

interface ClientesByTipoIndexItem {
  row_key: string;
  cliente_id: string;
  inmueble_id: string | null;
  sort_key: number;
}

const CLIENTE_SELECT = `
  id,
  nombre,
  email,
  telefono,
  ciudad,
  estado,
  origen,
  estado_contacto,
  descripcion,
  ref_cliente,
  mensaje,
  fecha_contacto,
  fecha_ultima_gestion,
  presupuesto_maximo,
  banos,
  notas,
  tipo_operacion,
  created_at,
  updated_at,
  cliente_inmuebles(inmueble_id, gestion_estado, fecha_ultima_gestion),
  cliente_workers(worker_id, workers(id, nombre, rol))
`;

async function fetchAll<T>(
  // Supabase returns a Postgrest builder that is Promise-like (thenable)
  queryFactory: (
    from: number,
    to: number,
  ) => PromiseLike<{ data: T[] | null; error: { message: string } | null }>,
  pageSize = 1000,
): Promise<T[]> {
  const all: T[] = [];
  for (let from = 0; ; from += pageSize) {
    const to = from + pageSize - 1;
    const { data, error } = await queryFactory(from, to);
    if (error) {
      throw new Error(error.message || JSON.stringify(error));
    }
    const chunk = data ?? [];
    all.push(...chunk);
    if (chunk.length < pageSize) break;
  }
  return all;
}

function chunkArray<T>(items: T[], size: number): T[][] {
  if (size <= 0) return [items];
  const chunks: T[][] = [];
  for (let i = 0; i < items.length; i += size) {
    chunks.push(items.slice(i, i + size));
  }
  return chunks;
}

/** Above this many linked rows, avoid huge `.in()` filters (URL limits). */
const HYDRATE_LINKED_IN_BATCH_SIZE = 80;
const HYDRATE_UNLINKED_IN_BATCH_SIZE = 200;

@Injectable()
export class InmueblesService {
  private readonly logger = new Logger(InmueblesService.name);
  private readonly clientesByTipoIndexCache = new Map<
    string,
    { expiresAt: number; items: ClientesByTipoIndexItem[] }
  >();
  private static readonly INDEX_CACHE_TTL_MS = 60_000;

  constructor(private supabase: SupabaseService) {}

  async findAll(filters?: {
    tipo_operacion?: string;
    propietario_id?: string;
  }): Promise<Inmueble[]> {
    let query = this.supabase
      .getAdmin()
      .from('inmuebles')
      .select(SELECT_FIELDS)
      .order('created_at', { ascending: false });

    if (filters?.tipo_operacion) {
      query = query.eq('tipo_operacion', filters.tipo_operacion);
    }

    if (filters?.propietario_id) {
      query = query.eq('propietario_id', filters.propietario_id);
    }

    const { data, error } = await query;

    if (error) {
      this.logger.error(`Error al listar inmuebles: ${error.message}`);
      throw new InternalServerErrorException('No se pudieron cargar los inmuebles');
    }

    return data ?? [];
  }

  async findClientesByTipoOperacion(
    tipoOperacion: 'alquiler' | 'venta',
  ): Promise<InmuebleClienteLinkRow[]> {
    const defaultGestion = getDefaultClienteGestionEstado(tipoOperacion);
    const rows: InmuebleClienteLinkRow[] = [];

    let linkedLinks: Record<string, unknown>[] = [];
    try {
      linkedLinks = await fetchAll<Record<string, unknown>>((from, to) =>
        this.supabase
          .getAdmin()
          .from('cliente_inmuebles')
          .select(CLIENTE_INMUEBLE_LINK_SELECT)
          .eq('inmuebles.tipo_operacion', tipoOperacion)
          .range(from, to),
      );
    } catch (e) {
      const message = e instanceof Error ? e.message : String(e);
      if (this.isMissingClienteInmuebles(message)) {
        return [];
      }
      this.logger.error(
        `Error al listar clientes vinculados por tipo ${tipoOperacion}: ${message}`,
      );
      throw new InternalServerErrorException(
        'No se pudieron cargar los clientes',
      );
    }

    const linkedClienteIds = new Set<string>();

    for (const linkRow of linkedLinks) {
      const mapped = this.mapLinkedClienteRow(linkRow, defaultGestion);
      if (!mapped) continue;
      linkedClienteIds.add(mapped.cliente.id);
      rows.push(mapped);
    }

    let rawClientes: Record<string, unknown>[] = [];
    try {
      rawClientes = await fetchAll<Record<string, unknown>>((from, to) =>
        this.supabase
          .getAdmin()
          .from('clientes')
          .select(CLIENTE_UNLINKED_SELECT)
          .eq('tipo_operacion', tipoOperacion)
          .range(from, to),
      );
    } catch (e) {
      const message = e instanceof Error ? e.message : String(e);
      this.logger.error(
        `Error al listar clientes sin inmueble (${tipoOperacion}): ${message}`,
      );
      throw new InternalServerErrorException('No se pudieron cargar los clientes');
    }

    for (const row of rawClientes ?? []) {
      const clienteInmuebles = (row.cliente_inmuebles ?? []) as Array<{
        inmueble_id: string;
      }>;
      if (linkedClienteIds.has(row.id as string) || clienteInmuebles.length > 0) {
        continue;
      }

      const { cliente_inmuebles: _ci, ...rest } = row;
      const cliente = {
        ...(rest as unknown as Cliente),
        inmueble_ids: [],
        worker_ids: [],
        inmuebles_count: 0,
        workers_count: 0,
        workers: [],
        gestion_estado: null,
      };

      rows.push({
        row_key: `unlinked-${cliente.id}`,
        inmueble_id: null,
        inmueble_label: '—',
        inmueble_ref: null,
        cliente,
      });
    }

    return rows;
  }

  async findClientesByTipoOperacionPaginated(
    tipoOperacion: 'alquiler' | 'venta',
    query: ClientesByTipoPageQuery,
  ): Promise<ClientesByTipoPageResult> {
    const page = Math.max(1, query.page);
    const limit = Math.min(
      Math.max(1, query.limit),
      MAX_CLIENTES_BY_TIPO_LIMIT,
    );
    const sortDir =
      query.sort === 'fecha_entrada' && query.dir === 'asc' ? 'asc' : 'desc';

    const index = await this.buildClientesByTipoIndex(tipoOperacion);
    const sorted = [...index].sort((a, b) => {
      if (a.sort_key !== b.sort_key) {
        return sortDir === 'asc'
          ? a.sort_key - b.sort_key
          : b.sort_key - a.sort_key;
      }
      return a.row_key.localeCompare(b.row_key);
    });

    const total = sorted.length;
    const offset = (page - 1) * limit;
    const slice = sorted.slice(offset, offset + limit);
    const defaultGestion = getDefaultClienteGestionEstado(tipoOperacion);
    const rows = await this.hydrateClientesByTipoPage(
      slice,
      tipoOperacion,
      defaultGestion,
    );

    return { rows, total, page, limit };
  }

  private async buildClientesByTipoIndex(
    tipoOperacion: 'alquiler' | 'venta',
  ): Promise<ClientesByTipoIndexItem[]> {
    const cacheKey = tipoOperacion;
    const cached = this.clientesByTipoIndexCache.get(cacheKey);
    if (cached && cached.expiresAt > Date.now()) {
      return cached.items;
    }

    const items: ClientesByTipoIndexItem[] = [];
    const linkedClienteIds = new Set<string>();

    let linkedIndex: Record<string, unknown>[] = [];
    try {
      linkedIndex = await fetchAll<Record<string, unknown>>((from, to) =>
        this.supabase
          .getAdmin()
          .from('cliente_inmuebles')
          .select(LINK_INDEX_SELECT)
          .eq('inmuebles.tipo_operacion', tipoOperacion)
          .range(from, to),
      );
    } catch (e) {
      const message = e instanceof Error ? e.message : String(e);
      if (this.isMissingClienteInmuebles(message)) {
        return [];
      }
      this.logger.error(
        `Error al indexar clientes vinculados (${tipoOperacion}): ${message}`,
      );
      throw new InternalServerErrorException(
        'No se pudieron cargar los clientes',
      );
    }

    for (const linkRow of linkedIndex) {
      const inmuebleId = linkRow.inmueble_id as string | undefined;
      const clienteId = linkRow.cliente_id as string | undefined;
      const clienteRaw = linkRow.clientes as
        | { fecha_contacto?: string | null }
        | null;
      if (!inmuebleId || !clienteId) continue;

      linkedClienteIds.add(clienteId);
      items.push({
        row_key: `${inmuebleId}-${clienteId}`,
        cliente_id: clienteId,
        inmueble_id: inmuebleId,
        sort_key: getClienteEntradaSortKey(clienteRaw?.fecha_contacto ?? null),
      });
    }

    let rawClientes: Record<string, unknown>[] = [];
    try {
      rawClientes = await fetchAll<Record<string, unknown>>((from, to) =>
        this.supabase
          .getAdmin()
          .from('clientes')
          .select(UNLINKED_INDEX_SELECT)
          .eq('tipo_operacion', tipoOperacion)
          .range(from, to),
      );
    } catch (e) {
      const message = e instanceof Error ? e.message : String(e);
      this.logger.error(
        `Error al indexar clientes sin inmueble (${tipoOperacion}): ${message}`,
      );
      throw new InternalServerErrorException('No se pudieron cargar los clientes');
    }

    for (const row of rawClientes) {
      const clienteId = row.id as string;
      const clienteInmuebles = (row.cliente_inmuebles ?? []) as Array<{
        inmueble_id: string;
      }>;
      if (linkedClienteIds.has(clienteId) || clienteInmuebles.length > 0) {
        continue;
      }

      items.push({
        row_key: `unlinked-${clienteId}`,
        cliente_id: clienteId,
        inmueble_id: null,
        sort_key: getClienteEntradaSortKey(
          row.fecha_contacto as string | null | undefined,
        ),
      });
    }

    this.clientesByTipoIndexCache.set(cacheKey, {
      items,
      expiresAt: Date.now() + InmueblesService.INDEX_CACHE_TTL_MS,
    });

    return items;
  }

  private async hydrateClientesByTipoPage(
    slice: ClientesByTipoIndexItem[],
    tipoOperacion: 'alquiler' | 'venta',
    defaultGestion: ClienteGestionEstado,
  ): Promise<InmuebleClienteLinkRow[]> {
    if (slice.length === 0) return [];

    const linkedItems = slice.filter((item) => item.inmueble_id);
    const unlinkedIds = slice
      .filter((item) => !item.inmueble_id)
      .map((item) => item.cliente_id);

    const rowByKey = new Map<string, InmuebleClienteLinkRow>();

    if (linkedItems.length > 0) {
      const pairKeys = new Set(
        linkedItems.map((item) => `${item.inmueble_id}:${item.cliente_id}`),
      );

      let linkedRows: Record<string, unknown>[] = [];
      try {
        linkedRows = await this.fetchLinkedRowsForHydration(
          tipoOperacion,
          linkedItems,
          pairKeys,
        );
      } catch (e) {
        const message = e instanceof Error ? e.message : String(e);
        this.logger.error(
          `Error al hidratar clientes vinculados (${tipoOperacion}): ${message || '(sin detalle)'}`,
        );
        throw new InternalServerErrorException(
          'No se pudieron cargar los clientes',
        );
      }

      for (const linkRow of linkedRows) {
        const inmuebleId = linkRow.inmueble_id as string | undefined;
        const clienteId = linkRow.cliente_id as string | undefined;
        if (!inmuebleId || !clienteId) continue;
        if (!pairKeys.has(`${inmuebleId}:${clienteId}`)) continue;

        const mapped = this.mapLinkedClienteRow(linkRow, defaultGestion);
        if (mapped) rowByKey.set(mapped.row_key, mapped);
      }
    }

    if (unlinkedIds.length > 0) {
      let unlinkedRows: Record<string, unknown>[] = [];
      try {
        unlinkedRows = await this.fetchClientesByIds(unlinkedIds);
      } catch (e) {
        const message = e instanceof Error ? e.message : String(e);
        this.logger.error(
          `Error al hidratar clientes sin inmueble (${tipoOperacion}): ${message || '(sin detalle)'}`,
        );
        throw new InternalServerErrorException(
          'No se pudieron cargar los clientes',
        );
      }

      for (const row of unlinkedRows) {
        const cliente = {
          ...(row as unknown as Cliente),
          inmueble_ids: [],
          worker_ids: [],
          inmuebles_count: 0,
          workers_count: 0,
          workers: [],
          gestion_estado: null,
        };
        rowByKey.set(`unlinked-${cliente.id}`, {
          row_key: `unlinked-${cliente.id}`,
          inmueble_id: null,
          inmueble_label: '—',
          inmueble_ref: null,
          cliente,
        });
      }
    }

    return slice
      .map((item) => rowByKey.get(item.row_key))
      .filter((row): row is InmuebleClienteLinkRow => row != null);
  }

  private async fetchLinkedRowsForHydration(
    tipoOperacion: 'alquiler' | 'venta',
    linkedItems: ClientesByTipoIndexItem[],
    pairKeys: Set<string>,
  ): Promise<Record<string, unknown>[]> {
    const linkedRows: Record<string, unknown>[] = [];
    const seen = new Set<string>();

    for (const batch of chunkArray(linkedItems, HYDRATE_LINKED_IN_BATCH_SIZE)) {
      const clienteIds = [...new Set(batch.map((item) => item.cliente_id))];
      const inmuebleIds = [
        ...new Set(batch.map((item) => item.inmueble_id as string)),
      ];

      const batchRows = await fetchAll<Record<string, unknown>>((from, to) =>
        this.supabase
          .getAdmin()
          .from('cliente_inmuebles')
          .select(CLIENTE_INMUEBLE_LINK_SELECT)
          .eq('inmuebles.tipo_operacion', tipoOperacion)
          .in('cliente_id', clienteIds)
          .in('inmueble_id', inmuebleIds)
          .range(from, to),
      );

      for (const linkRow of batchRows) {
        const inmuebleId = linkRow.inmueble_id as string | undefined;
        const clienteId = linkRow.cliente_id as string | undefined;
        if (!inmuebleId || !clienteId) continue;
        const key = `${inmuebleId}:${clienteId}`;
        if (!pairKeys.has(key) || seen.has(key)) continue;
        seen.add(key);
        linkedRows.push(linkRow);
      }
    }

    return linkedRows;
  }

  private async fetchClientesByIds(
    ids: string[],
  ): Promise<Record<string, unknown>[]> {
    const rows: Record<string, unknown>[] = [];

    for (const batch of chunkArray(ids, HYDRATE_UNLINKED_IN_BATCH_SIZE)) {
      const { data, error } = await this.supabase
        .getAdmin()
        .from('clientes')
        .select(CLIENTE_GLOBAL_FIELDS)
        .in('id', batch);

      if (error) {
        throw new Error(error.message || JSON.stringify(error));
      }

      rows.push(...((data as Record<string, unknown>[] | null) ?? []));
    }

    return rows;
  }

  private mapLinkedClienteRow(
    linkRow: Record<string, unknown>,
    defaultGestion: ClienteGestionEstado,
  ): InmuebleClienteLinkRow | null {
    const inmueble = linkRow.inmuebles as
      | {
          id: string;
          ref: string | null;
          direccion_piso_real: string | null;
          barrio_distrito: string | null;
        }
      | null;
    const clienteRaw = linkRow.clientes as Record<string, unknown> | null;
    if (!inmueble?.id || !clienteRaw?.id) return null;

    const cliente = {
      ...(clienteRaw as unknown as Cliente),
      fecha_ultima_gestion:
        (clienteRaw.fecha_ultima_gestion as string | null) ??
        (linkRow.fecha_ultima_gestion as string | null) ??
        null,
      gestion_estado:
        (linkRow.gestion_estado as ClienteGestionEstado | null) ?? defaultGestion,
      inmueble_ids: [inmueble.id],
      worker_ids: [],
      inmuebles_count: 1,
      workers_count: 0,
      workers: [],
    } as Cliente;

    const label =
      inmueble.direccion_piso_real ||
      inmueble.barrio_distrito ||
      'Inmueble sin dirección';

    return {
      row_key: `${inmueble.id}-${cliente.id}`,
      inmueble_id: inmueble.id,
      inmueble_label: label,
      inmueble_ref: inmueble.ref,
      cliente,
    };
  }

  private mapCliente(row: Record<string, unknown>): Cliente {
    const clienteInmuebles = (row.cliente_inmuebles ?? []) as Array<{
      inmueble_id: string;
      gestion_estado?: string | null;
      fecha_ultima_gestion?: string | null;
    }>;
    const clienteWorkers = (row.cliente_workers ?? []) as Array<{
      worker_id: string;
      workers: { id: string; nombre: string; rol: string } | null;
    }>;

    const workers = (clienteWorkers
      .map((r) => r.workers)
      .filter(Boolean) ?? []) as NonNullable<Cliente['workers']>;

    const { cliente_inmuebles: _ci, cliente_workers: _cw, ...rest } = row;

    return {
      ...(rest as unknown as Cliente),
      inmueble_ids: clienteInmuebles.map((r) => r.inmueble_id),
      worker_ids: clienteWorkers.map((r) => r.worker_id),
      inmuebles_count: clienteInmuebles.length,
      workers_count: workers.length,
      workers,
      gestion_estado: null,
    };
  }

  async findOne(id: string): Promise<Inmueble> {
    const { data, error } = await this.supabase
      .getAdmin()
      .from('inmuebles')
      .select(SELECT_DETAIL)
      .eq('id', id)
      .maybeSingle();

    if (error) {
      if (this.isMissingClienteInmuebles(error.message)) {
        return this.findOneWithoutClientes(id);
      }
      this.logger.error(`Error al buscar inmueble ${id}: ${error.message}`);
      throw new InternalServerErrorException('No se pudo cargar el inmueble');
    }

    if (!data) {
      throw new NotFoundException('Inmueble no encontrado');
    }

    return this.mapWithClientes(data as unknown as Record<string, unknown>);
  }

  private async findOneWithoutClientes(id: string): Promise<Inmueble> {
    const { data, error } = await this.supabase
      .getAdmin()
      .from('inmuebles')
      .select(SELECT_FIELDS)
      .eq('id', id)
      .maybeSingle();

    if (error) {
      this.logger.error(`Error al buscar inmueble ${id}: ${error.message}`);
      throw new InternalServerErrorException('No se pudo cargar el inmueble');
    }

    if (!data) {
      throw new NotFoundException('Inmueble no encontrado');
    }

    return { ...data, clientes: [], clientes_count: 0 };
  }

  private isMissingClienteInmuebles(message: string): boolean {
    return (
      message.includes('cliente_inmuebles') &&
      (message.includes('does not exist') ||
        message.includes('Could not find') ||
        message.includes('schema cache'))
    );
  }

  async create(dto: CreateInmuebleDto): Promise<Inmueble> {
    const ownerFields = normalizePropietariosContactos(dto);
    const today = new Date();
    const pad = (value: number) => String(value).padStart(2, '0');
    const fechaEntradaDefault = `${today.getFullYear()}-${pad(today.getMonth() + 1)}-${pad(today.getDate())}`;
    const payload = normalizeInmuebleSplitFields({
      ...dto,
      ...ownerFields,
      fecha_entrada_inmueble:
        dto.fecha_entrada_inmueble?.trim() || fechaEntradaDefault,
    });

    const { data, error } = await this.supabase
      .getAdmin()
      .from('inmuebles')
      .insert(payload)
      .select(SELECT_FIELDS)
      .single();

    if (error) {
      this.logger.error(`Error al crear inmueble: ${error.message}`);
      throw new InternalServerErrorException('No se pudo crear el inmueble');
    }

    return data;
  }

  async update(id: string, dto: UpdateInmuebleDto): Promise<Inmueble> {
    await this.findOne(id);

    const ownerFields =
      dto.propietarios_contactos !== undefined ||
      dto.nombre_propi !== undefined ||
      dto.telf !== undefined
        ? normalizePropietariosContactos(dto)
        : {};

    const { data, error } = await this.supabase
      .getAdmin()
      .from('inmuebles')
      .update(
        normalizeInmuebleSplitFields({
          ...dto,
          ...ownerFields,
          updated_at: new Date().toISOString(),
        }),
      )
      .eq('id', id)
      .select(SELECT_FIELDS)
      .single();

    if (error) {
      this.logger.error(`Error al actualizar inmueble ${id}: ${error.message}`);
      throw new InternalServerErrorException('No se pudo actualizar el inmueble');
    }

    return data;
  }

  async updateClienteGestionEstado(
    inmuebleId: string,
    clienteId: string,
    gestionEstado: string,
    fechaUltimaGestion?: string,
  ): Promise<{
    gestion_estado: ClienteGestionEstado;
    fecha_ultima_gestion: string;
  }> {
    const inmueble = await this.findOne(inmuebleId);
    const tipo = inmueble.tipo_operacion;

    if (tipo !== 'alquiler' && tipo !== 'venta') {
      throw new BadRequestException('Tipo de inmueble no válido');
    }

    if (!isClienteGestionEstadoForTipo(gestionEstado, tipo)) {
      throw new BadRequestException('Estado de gestión no válido');
    }

    const linked = inmueble.clientes?.some((c) => c.id === clienteId);
    if (!linked) {
      throw new NotFoundException(
        'El cliente no está vinculado a este inmueble',
      );
    }

    const now = new Date().toISOString();
    const resolvedFechaUltimaGestion =
      fechaUltimaGestion && !Number.isNaN(Date.parse(fechaUltimaGestion))
        ? new Date(fechaUltimaGestion).toISOString()
        : now;
    const { data, error } = await this.supabase
      .getAdmin()
      .from('cliente_inmuebles')
      .update({
        gestion_estado: gestionEstado,
        fecha_ultima_gestion: resolvedFechaUltimaGestion,
      })
      .eq('inmueble_id', inmuebleId)
      .eq('cliente_id', clienteId)
      .select('gestion_estado, fecha_ultima_gestion')
      .maybeSingle();

    if (error) {
      this.logger.error(
        `Error al actualizar gestión cliente ${clienteId} en inmueble ${inmuebleId}: ${error.message}`,
      );
      throw new InternalServerErrorException(
        'No se pudo actualizar el estado de gestión',
      );
    }

    if (!data) {
      throw new NotFoundException(
        'No se encontró la relación cliente–inmueble',
      );
    }

    await this.supabase
      .getAdmin()
      .from('clientes')
      .update({
        fecha_ultima_gestion: now,
        updated_at: now,
      })
      .eq('id', clienteId);

    return {
      gestion_estado:
        (data.gestion_estado as ClienteGestionEstado) ??
        getDefaultClienteGestionEstado(tipo),
      fecha_ultima_gestion:
        (data.fecha_ultima_gestion as string | null) ?? now,
    };
  }

  async updateClienteFechaUltimaGestion(
    inmuebleId: string,
    clienteId: string,
    fechaUltimaGestion: string | null,
  ): Promise<{ fecha_ultima_gestion: string | null }> {
    const inmueble = await this.findOne(inmuebleId);
    const linked = inmueble.clientes?.some((c) => c.id === clienteId);
    if (!linked) {
      throw new NotFoundException(
        'El cliente no está vinculado a este inmueble',
      );
    }

    const { data, error } = await this.supabase
      .getAdmin()
      .from('cliente_inmuebles')
      .update({ fecha_ultima_gestion: fechaUltimaGestion })
      .eq('inmueble_id', inmuebleId)
      .eq('cliente_id', clienteId)
      .select('fecha_ultima_gestion')
      .maybeSingle();

    if (error) {
      this.logger.error(
        `Error al actualizar fecha última gestión cliente ${clienteId} en inmueble ${inmuebleId}: ${error.message}`,
      );
      throw new InternalServerErrorException(
        'No se pudo actualizar la fecha de última gestión',
      );
    }

    if (!data) {
      throw new NotFoundException(
        'No se encontró la relación cliente–inmueble',
      );
    }

    return {
      fecha_ultima_gestion:
        (data.fecha_ultima_gestion as string | null) ?? null,
    };
  }

  async remove(id: string): Promise<{ mensaje: string }> {
    await this.findOne(id);

    const { error } = await this.supabase
      .getAdmin()
      .from('inmuebles')
      .delete()
      .eq('id', id);

    if (error) {
      this.logger.error(`Error al eliminar inmueble ${id}: ${error.message}`);
      throw new InternalServerErrorException('No se pudo eliminar el inmueble');
    }

    return { mensaje: 'Inmueble eliminado correctamente' };
  }

  private mapWithClientes(row: Record<string, unknown>): Inmueble {
    const clienteInmuebles = row.cliente_inmuebles as
      | {
          cliente_id: string;
          gestion_estado?: string | null;
          fecha_ultima_gestion?: string | null;
          clientes: Cliente | null;
        }[]
      | undefined;
    const { cliente_inmuebles: _omit, ...rest } = row;
    const tipoOperacion = (rest as { tipo_operacion?: 'alquiler' | 'venta' })
      .tipo_operacion;
    const defaultGestion =
      tipoOperacion === 'alquiler' || tipoOperacion === 'venta'
        ? getDefaultClienteGestionEstado(tipoOperacion)
        : 'no_gestionando';

    const clientes = (clienteInmuebles ?? [])
      .map((link) => {
        const cliente = link.clientes as
          | (Cliente & {
              cliente_workers?: Array<{
                worker_id: string;
                workers: { id: string; nombre: string; rol: string } | null;
              }>;
            })
          | null;
        if (!cliente) return null;

        const clienteWorkers = cliente.cliente_workers ?? [];
        const workers = clienteWorkers
          .map((cw) => cw.workers)
          .filter(
            (worker): worker is { id: string; nombre: string; rol: string } =>
              worker != null,
          );

        const { cliente_workers: _cw, ...rest } = cliente;

        return {
          ...rest,
          gestion_estado: link.gestion_estado ?? defaultGestion,
          fecha_ultima_gestion:
            (rest as Cliente).fecha_ultima_gestion ??
            link.fecha_ultima_gestion ??
            null,
          worker_ids: clienteWorkers.map((cw) => cw.worker_id),
          workers,
          workers_count: workers.length,
        } as Cliente;
      })
      .filter((cliente): cliente is Cliente => cliente != null);

    return {
      ...(rest as unknown as Inmueble),
      clientes_count: clientes.length,
      clientes,
    };
  }
}
