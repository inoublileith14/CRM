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
import { Inmueble } from './interfaces/inmueble.interface';

const SELECT_FIELDS =
  'id, ref, fecha_entrada_inmueble, imagen_real, direccion_piso_real, foto_espejo, espejo_direccion, barrio_distrito, precio, precio_espejo, hab, banos, metros, larga_estancia_temporada, propietario_id, propietarios_contactos, nombre_propi, telf, ficha_del_piso_real, link_idealista_espejo, fecha_visitas_entrada, observaciones, amueblado, captador_alquilado_por, status, row_color, tipo_operacion, created_at, updated_at';

const SELECT_DETAIL =
  `${SELECT_FIELDS}, cliente_inmuebles(cliente_id, gestion_estado, fecha_ultima_gestion, clientes(id, nombre, email, telefono, ciudad, estado, origen, estado_contacto, ref_cliente, fecha_contacto, fecha_ultima_gestion, presupuesto_maximo, banos, notas, created_at, updated_at, cliente_workers(worker_id, workers(id, nombre, rol))))` as const;

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
    if (error) throw new Error(error.message);
    const chunk = data ?? [];
    all.push(...chunk);
    if (chunk.length < pageSize) break;
  }
  return all;
}

@Injectable()
export class InmueblesService {
  private readonly logger = new Logger(InmueblesService.name);

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
    const { data, error } = await this.supabase
      .getAdmin()
      .from('inmuebles')
      .select(SELECT_DETAIL)
      .eq('tipo_operacion', tipoOperacion)
      .order('created_at', { ascending: false });

    if (error) {
      if (this.isMissingClienteInmuebles(error.message)) {
        return [];
      }
      this.logger.error(
        `Error al listar clientes por tipo ${tipoOperacion}: ${error.message}`,
      );
      throw new InternalServerErrorException(
        'No se pudieron cargar los clientes',
      );
    }

    const rows: InmuebleClienteLinkRow[] = [];
    const linkedClienteIds = new Set<string>();

    for (const inmuebleRow of data ?? []) {
      const inmueble = this.mapWithClientes(
        inmuebleRow as unknown as Record<string, unknown>,
      );
      const label =
        inmueble.direccion_piso_real ||
        inmueble.barrio_distrito ||
        'Inmueble sin dirección';

      for (const cliente of inmueble.clientes ?? []) {
        linkedClienteIds.add(cliente.id);
        rows.push({
          row_key: `${inmueble.id}-${cliente.id}`,
          inmueble_id: inmueble.id,
          inmueble_label: label,
          inmueble_ref: inmueble.ref,
          cliente,
        });
      }
    }

    // Also include "unlinked" clientes (tipo_operacion matches, no cliente_inmuebles rows)
    let rawClientes: Record<string, unknown>[] = [];
    try {
      rawClientes = await fetchAll<Record<string, unknown>>((from, to) =>
        this.supabase
          .getAdmin()
          .from('clientes')
          .select(CLIENTE_SELECT)
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
      const cliente = this.mapCliente(row as unknown as Record<string, unknown>);
      const hasLinks = (cliente.inmueble_ids?.length ?? 0) > 0;
      if (linkedClienteIds.has(cliente.id) || hasLinks) continue;

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
    const payload = {
      ...dto,
      ...ownerFields,
    };

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
      .update({
        ...dto,
        ...ownerFields,
        updated_at: new Date().toISOString(),
      })
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
    const { data, error } = await this.supabase
      .getAdmin()
      .from('cliente_inmuebles')
      .update({
        gestion_estado: gestionEstado,
        fecha_ultima_gestion: now,
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
