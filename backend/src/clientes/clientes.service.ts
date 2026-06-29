import {
  BadRequestException,
  ConflictException,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import {
  buildClienteDuplicateKey,
  clienteContactDateKey,
  normalizeClienteTelefono,
} from './cliente-duplicate.util';
import { getDefaultClienteGestionEstado } from './cliente-gestion-estado';
import { BulkAssignInmuebleDto } from './dto/bulk-assign-inmueble.dto';
import { BulkAssignWorkerDto } from './dto/bulk-assign-worker.dto';
import {
  BulkImportClienteItemDto,
  BulkImportClientesDto,
} from './dto/bulk-import-clientes.dto';
import { enrichClienteImportRow } from './enrich-import-cliente.util';
import { findInmuebleIdByClienteRef } from './match-inmueble-ref.util';
import { CreateClienteDto } from './dto/create-cliente.dto';
import { UpdateClienteDto } from './dto/update-cliente.dto';
import { Cliente } from './interfaces/cliente.interface';

const SELECT_FIELDS = `
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
  descripcion,
  ref_cliente,
  mensaje,
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

const RELATIONS_SELECT = `
  ${SELECT_FIELDS},
  cliente_inmuebles(inmueble_id, inmuebles(*)),
  cliente_workers(worker_id, workers(*))
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
export class ClientesService {
  private readonly logger = new Logger(ClientesService.name);

  constructor(private supabase: SupabaseService) {}

  async findAll(): Promise<Cliente[]> {
    try {
      const data = await fetchAll<Record<string, unknown>>((from, to) =>
        this.supabase
          .getAdmin()
          .from('clientes')
          .select(RELATIONS_SELECT)
          .order('nombre', { ascending: true })
          .range(from, to),
      );
      return (data ?? []).map((row) => this.mapCliente(row));
    } catch (e) {
      const message = e instanceof Error ? e.message : String(e);
      this.logger.error(`Error al listar clientes: ${message}`);
      throw new InternalServerErrorException('No se pudieron cargar los clientes');
    }
  }

  async findOne(id: string): Promise<Cliente> {
    const { data, error } = await this.supabase
      .getAdmin()
      .from('clientes')
      .select(RELATIONS_SELECT)
      .eq('id', id)
      .maybeSingle();

    if (error) {
      this.logger.error(`Error al buscar cliente ${id}: ${error.message}`);
      throw new InternalServerErrorException('No se pudo cargar el cliente');
    }

    if (!data) {
      throw new NotFoundException('Cliente no encontrado');
    }

    return this.mapCliente(data);
  }

  async create(dto: CreateClienteDto): Promise<Cliente> {
    const { inmueble_ids, worker_ids, ...clienteData } = dto;

    const duplicate = await this.findDuplicateByPhoneDateAndInmuebles(
      clienteData.telefono,
      clienteData.fecha_contacto,
      inmueble_ids ?? [],
    );
    if (duplicate) {
      throw new ConflictException({
        message:
          'Ya existe un cliente con el mismo teléfono, fecha de contacto e inmueble',
        code: 'CLIENTE_DUPLICATE',
      });
    }

    const { data, error } = await this.supabase
      .getAdmin()
      .from('clientes')
      .insert({
        ...clienteData,
        estado: clienteData.estado ?? 'activo',
      })
      .select(SELECT_FIELDS)
      .single();

    if (error) {
      this.logger.error(`Error al crear cliente: ${error.message}`);
      throw new InternalServerErrorException('No se pudo crear el cliente');
    }

    await this.syncRelations(data.id, inmueble_ids ?? [], worker_ids ?? []);
    return this.findOne(data.id);
  }

  async update(id: string, dto: UpdateClienteDto): Promise<Cliente> {
    await this.findOne(id);

    const { inmueble_ids, worker_ids, ...clienteData } = dto;

    const { error } = await this.supabase
      .getAdmin()
      .from('clientes')
      .update({ ...clienteData, updated_at: new Date().toISOString() })
      .eq('id', id);

    if (error) {
      this.logger.error(`Error al actualizar cliente ${id}: ${error.message}`);
      throw new InternalServerErrorException(
        'No se pudo actualizar el cliente',
      );
    }

    if (inmueble_ids !== undefined || worker_ids !== undefined) {
      const current = await this.findOne(id);
      await this.syncRelations(
        id,
        inmueble_ids ?? current.inmueble_ids ?? [],
        worker_ids ?? current.worker_ids ?? [],
      );
    }

    return this.findOne(id);
  }

  async bulkAssignWorker(
    dto: BulkAssignWorkerDto,
  ): Promise<{ assigned: number }> {
    const { worker_id: workerId, assignments } = dto;

    if (!workerId) {
      throw new BadRequestException('worker_id es obligatorio');
    }

    if (!assignments?.length) {
      throw new BadRequestException('Debes indicar al menos una asignación');
    }

    const admin = this.supabase.getAdmin();

    const { data: worker, error: workerError } = await admin
      .from('workers')
      .select('id')
      .eq('id', workerId)
      .maybeSingle();

    if (workerError) {
      this.logger.error(
        `Error al validar trabajador ${workerId}: ${workerError.message}`,
      );
      throw new InternalServerErrorException(
        'No se pudo validar el trabajador',
      );
    }

    if (!worker) {
      throw new NotFoundException('Trabajador no encontrado');
    }

    const inmuebleIdsByCliente = new Map<string, Set<string>>();
    for (const { cliente_id, inmueble_id } of assignments) {
      if (!cliente_id || !inmueble_id) {
        throw new BadRequestException(
          'Cada asignación requiere cliente_id e inmueble_id',
        );
      }
      if (!inmuebleIdsByCliente.has(cliente_id)) {
        inmuebleIdsByCliente.set(cliente_id, new Set());
      }
      inmuebleIdsByCliente.get(cliente_id)!.add(inmueble_id);
    }

    const clienteIds = [...inmuebleIdsByCliente.keys()];
    const allInmuebleIds = [
      ...new Set(
        [...inmuebleIdsByCliente.values()].flatMap((ids) => [...ids]),
      ),
    ];

    const { data: existingClientes, error: clientesError } = await admin
      .from('clientes')
      .select('id')
      .in('id', clienteIds);

    if (clientesError) {
      this.logger.error(
        `Error al validar clientes: ${clientesError.message}`,
      );
      throw new InternalServerErrorException(
        'No se pudieron validar los clientes',
      );
    }

    const foundClienteIds = new Set(
      (existingClientes ?? []).map((row) => row.id as string),
    );
    const missingClienteIds = clienteIds.filter((id) => !foundClienteIds.has(id));
    if (missingClienteIds.length > 0) {
      throw new NotFoundException(
        `Cliente(s) no encontrado(s): ${missingClienteIds.join(', ')}`,
      );
    }

    const { data: existingInmuebleLinks, error: linksError } = await admin
      .from('cliente_inmuebles')
      .select('cliente_id, inmueble_id, gestion_estado')
      .in('cliente_id', clienteIds);

    if (linksError) {
      this.logger.error(
        `Error al leer relaciones cliente-inmueble: ${linksError.message}`,
      );
      throw new InternalServerErrorException(
        'No se pudieron leer las relaciones de inmuebles',
      );
    }

    const gestionByClienteInmueble = new Map<string, string | null>();
    for (const link of existingInmuebleLinks ?? []) {
      gestionByClienteInmueble.set(
        `${link.cliente_id as string}:${link.inmueble_id as string}`,
        (link.gestion_estado as string | null) ?? null,
      );
    }

    const { data: inmuebles, error: inmueblesError } = await admin
      .from('inmuebles')
      .select('id, tipo_operacion')
      .in('id', allInmuebleIds);

    if (inmueblesError) {
      this.logger.error(
        `Error al leer inmuebles: ${inmueblesError.message}`,
      );
      throw new InternalServerErrorException(
        'No se pudieron validar los inmuebles',
      );
    }

    const tipoByInmueble = new Map(
      (inmuebles ?? []).map((row) => [
        row.id as string,
        row.tipo_operacion as string,
      ]),
    );

    const missingInmuebleIds = allInmuebleIds.filter(
      (id) => !tipoByInmueble.has(id),
    );
    if (missingInmuebleIds.length > 0) {
      throw new NotFoundException(
        `Inmueble(s) no encontrado(s): ${missingInmuebleIds.join(', ')}`,
      );
    }

    const { error: delWorkerError } = await admin
      .from('cliente_workers')
      .delete()
      .in('cliente_id', clienteIds);

    if (delWorkerError) {
      this.logger.error(
        `Error al limpiar trabajadores: ${delWorkerError.message}`,
      );
      throw new InternalServerErrorException(
        'No se pudieron actualizar los trabajadores',
      );
    }

    const { error: delInmError } = await admin
      .from('cliente_inmuebles')
      .delete()
      .in('cliente_id', clienteIds);

    if (delInmError) {
      this.logger.error(
        `Error al limpiar inmuebles: ${delInmError.message}`,
      );
      throw new InternalServerErrorException(
        'No se pudieron actualizar los inmuebles',
      );
    }

    const workerRows = clienteIds.map((cliente_id) => ({
      cliente_id,
      worker_id: workerId,
    }));

    const { error: insWorkerError } = await admin
      .from('cliente_workers')
      .insert(workerRows);

    if (insWorkerError) {
      this.logger.error(
        `Error al asignar trabajador: ${insWorkerError.message}`,
      );
      throw new InternalServerErrorException(
        'No se pudieron asignar los trabajadores',
      );
    }

    const inmuebleRows = [...inmuebleIdsByCliente.entries()].flatMap(
      ([cliente_id, inmuebleIds]) =>
        [...inmuebleIds].map((inmueble_id) => {
          const tipo = tipoByInmueble.get(inmueble_id);
          const defaultGestion = getDefaultClienteGestionEstado(
            tipo === 'venta' ? 'venta' : 'alquiler',
          );

          return {
            cliente_id,
            inmueble_id,
            gestion_estado:
              gestionByClienteInmueble.get(`${cliente_id}:${inmueble_id}`) ??
              defaultGestion,
          };
        }),
    );

    const { error: insInmError } = await admin
      .from('cliente_inmuebles')
      .insert(inmuebleRows);

    if (insInmError) {
      this.logger.error(
        `Error al vincular inmuebles: ${insInmError.message}`,
      );
      throw new InternalServerErrorException(
        'No se pudieron vincular los inmuebles',
      );
    }

    const now = new Date().toISOString();
    const { error: touchError } = await admin
      .from('clientes')
      .update({ updated_at: now })
      .in('id', clienteIds);

    if (touchError) {
      this.logger.warn(
        `Asignación OK pero no se actualizó updated_at: ${touchError.message}`,
      );
    }

    return { assigned: assignments.length };
  }

  async bulkUnassignWorker(
    dto: { cliente_ids: string[] },
  ): Promise<{ unassigned: number }> {
    const clienteIds = [...new Set((dto.cliente_ids ?? []).filter(Boolean))];
    if (clienteIds.length === 0) {
      throw new BadRequestException('Debes indicar al menos un cliente');
    }

    const admin = this.supabase.getAdmin();

    const { data: existingClientes, error: clientesError } = await admin
      .from('clientes')
      .select('id')
      .in('id', clienteIds);

    if (clientesError) {
      this.logger.error(
        `Error al validar clientes: ${clientesError.message}`,
      );
      throw new InternalServerErrorException(
        'No se pudieron validar los clientes',
      );
    }

    const foundClienteIds = new Set(
      (existingClientes ?? []).map((row) => row.id as string),
    );
    const missingClienteIds = clienteIds.filter((id) => !foundClienteIds.has(id));
    if (missingClienteIds.length > 0) {
      throw new NotFoundException(
        `Cliente(s) no encontrado(s): ${missingClienteIds.join(', ')}`,
      );
    }

    const { error: delWorkerError } = await admin
      .from('cliente_workers')
      .delete()
      .in('cliente_id', clienteIds);

    if (delWorkerError) {
      this.logger.error(
        `Error al quitar trabajadores: ${delWorkerError.message}`,
      );
      throw new InternalServerErrorException(
        'No se pudieron quitar los trabajadores',
      );
    }

    const now = new Date().toISOString();
    const { error: touchError } = await admin
      .from('clientes')
      .update({ updated_at: now })
      .in('id', clienteIds);

    if (touchError) {
      this.logger.warn(
        `Desasignación OK pero no se actualizó updated_at: ${touchError.message}`,
      );
    }

    return { unassigned: clienteIds.length };
  }

  async bulkAssignInmueble(
    dto: BulkAssignInmuebleDto,
  ): Promise<{ assigned: number; skipped: number }> {
    const { inmueble_id: inmuebleId, cliente_ids: rawClienteIds } = dto;

    if (!inmuebleId) {
      throw new BadRequestException('inmueble_id es obligatorio');
    }

    const clienteIds = [...new Set((rawClienteIds ?? []).filter(Boolean))];
    if (clienteIds.length === 0) {
      throw new BadRequestException('Debes indicar al menos un cliente');
    }

    const admin = this.supabase.getAdmin();

    const { data: inmueble, error: inmuebleError } = await admin
      .from('inmuebles')
      .select('id, tipo_operacion, ref')
      .eq('id', inmuebleId)
      .maybeSingle();

    if (inmuebleError) {
      this.logger.error(
        `Error al validar inmueble ${inmuebleId}: ${inmuebleError.message}`,
      );
      throw new InternalServerErrorException('No se pudo validar el inmueble');
    }

    if (!inmueble) {
      throw new NotFoundException('Inmueble no encontrado');
    }

    const inmuebleRef = (inmueble.ref as string | null)?.trim();
    if (!inmuebleRef) {
      throw new BadRequestException(
        'El inmueble no tiene referencia y no se puede asignar',
      );
    }

    const { data: existingClientes, error: clientesError } = await admin
      .from('clientes')
      .select('id')
      .in('id', clienteIds);

    if (clientesError) {
      this.logger.error(
        `Error al validar clientes: ${clientesError.message}`,
      );
      throw new InternalServerErrorException(
        'No se pudieron validar los clientes',
      );
    }

    const foundClienteIds = new Set(
      (existingClientes ?? []).map((row) => row.id as string),
    );
    const missingClienteIds = clienteIds.filter((id) => !foundClienteIds.has(id));
    if (missingClienteIds.length > 0) {
      throw new NotFoundException(
        `Cliente(s) no encontrado(s): ${missingClienteIds.join(', ')}`,
      );
    }

    const { data: existingLinks, error: linksError } = await admin
      .from('cliente_inmuebles')
      .select('cliente_id')
      .eq('inmueble_id', inmuebleId)
      .in('cliente_id', clienteIds);

    if (linksError) {
      this.logger.error(
        `Error al leer relaciones cliente-inmueble: ${linksError.message}`,
      );
      throw new InternalServerErrorException(
        'No se pudieron leer las relaciones de inmuebles',
      );
    }

    const alreadyLinked = new Set(
      (existingLinks ?? []).map((row) => row.cliente_id as string),
    );
    const toAssign = clienteIds.filter((id) => !alreadyLinked.has(id));

    const defaultGestion = getDefaultClienteGestionEstado(
      inmueble.tipo_operacion === 'venta' ? 'venta' : 'alquiler',
    );

    if (toAssign.length > 0) {
      const { error: insError } = await admin.from('cliente_inmuebles').insert(
        toAssign.map((cliente_id) => ({
          cliente_id,
          inmueble_id: inmuebleId,
          gestion_estado: defaultGestion,
        })),
      );

      if (insError) {
        this.logger.error(
          `Error al vincular clientes al inmueble: ${insError.message}`,
        );
        throw new InternalServerErrorException(
          'No se pudieron vincular los clientes al inmueble',
        );
      }
    }

    const now = new Date().toISOString();
    const { error: refError } = await admin
      .from('clientes')
      .update({ ref_cliente: inmuebleRef, updated_at: now })
      .in('id', clienteIds);

    if (refError) {
      this.logger.error(
        `Error al actualizar referencia de clientes: ${refError.message}`,
      );
      throw new InternalServerErrorException(
        'No se pudo actualizar la referencia de los clientes',
      );
    }

    return {
      assigned: toAssign.length,
      skipped: clienteIds.length - toAssign.length,
    };
  }

  async bulkImport(
    dto: BulkImportClientesDto,
  ): Promise<{ created: number; skipped: number; failed: number }> {
    const { clientes, options } = dto;
    const skipDuplicates = options?.skip_duplicates !== false;
    const fixedInmuebleId = options?.inmueble_id?.trim() || null;
    const fixedWorkerId = options?.worker_id?.trim() || null;
    const fixedTipo = options?.tipo_operacion ?? null;

    if (!clientes?.length) {
      throw new BadRequestException('Debes indicar al menos un cliente');
    }

    const admin = this.supabase.getAdmin();
    let fixedInmuebleTipo: 'alquiler' | 'venta' = 'alquiler';

    if (fixedInmuebleId) {
      const { data: inmueble, error: inmuebleError } = await admin
        .from('inmuebles')
        .select('id, tipo_operacion')
        .eq('id', fixedInmuebleId)
        .maybeSingle();

      if (inmuebleError) {
        this.logger.error(
          `Error al validar inmueble ${fixedInmuebleId}: ${inmuebleError.message}`,
        );
        throw new InternalServerErrorException('No se pudo validar el inmueble');
      }

      if (!inmueble) {
        throw new NotFoundException('Inmueble no encontrado');
      }

      fixedInmuebleTipo =
        inmueble.tipo_operacion === 'venta' ? 'venta' : 'alquiler';
    }

    if (fixedWorkerId) {
      const { data: worker, error: workerError } = await admin
        .from('workers')
        .select('id')
        .eq('id', fixedWorkerId)
        .maybeSingle();

      if (workerError) {
        this.logger.error(
          `Error al validar trabajador ${fixedWorkerId}: ${workerError.message}`,
        );
        throw new InternalServerErrorException(
          'No se pudo validar el trabajador',
        );
      }

      if (!worker) {
        throw new NotFoundException('Trabajador no encontrado');
      }
    }

    let inmueblesForMatch: Array<{
      id: string;
      ref: string | null;
      tipo_operacion: string | null;
    }> = [];

    if (!fixedInmuebleId && fixedTipo) {
      const { data: inmueblesMatchData, error: inmueblesMatchError } =
        await admin
          .from('inmuebles')
          .select('id, ref, tipo_operacion')
          .eq('tipo_operacion', fixedTipo);

      if (inmueblesMatchError) {
        this.logger.error(
          `Error al cargar inmuebles para importación: ${inmueblesMatchError.message}`,
        );
        throw new InternalServerErrorException(
          'No se pudieron cargar los inmuebles para vincular clientes',
        );
      }

      inmueblesForMatch = inmueblesMatchData ?? [];
    }

    type PreparedImportRow = {
      clienteData: Record<string, unknown>;
      inmuebleIds: string[];
      workerIds: string[];
      duplicateKeys: string[];
    };

    const prepared: PreparedImportRow[] = [];
    const allInmuebleIds = new Set<string>();

    for (const rawClient of clientes) {
      const raw = enrichClienteImportRow(rawClient);
      const nombre = raw.nombre?.trim();
      if (!nombre) continue;

      const matchedInmuebleId =
        !fixedInmuebleId && fixedTipo
          ? findInmuebleIdByClienteRef(
              raw.ref_cliente,
              inmueblesForMatch,
              fixedTipo,
            )
          : null;

      const inmuebleIds = fixedInmuebleId
        ? [fixedInmuebleId]
        : matchedInmuebleId
          ? [matchedInmuebleId]
          : [...new Set((raw.inmueble_ids ?? []).filter(Boolean))];
      const workerIds = fixedInmuebleId
        ? []
        : fixedWorkerId
          ? [fixedWorkerId]
          : [...new Set((raw.worker_ids ?? []).filter(Boolean))];

      for (const inmuebleId of inmuebleIds) {
        allInmuebleIds.add(inmuebleId);
      }

      const duplicateKeys = [
        ...new Set(
          inmuebleIds
            .map((inmuebleId) =>
              buildClienteDuplicateKey(
                raw.telefono,
                raw.fecha_contacto,
                inmuebleId,
              ),
            )
            .filter((key): key is string => key != null),
        ),
      ];

      prepared.push({
        clienteData: this.buildClienteInsertPayload(raw, fixedTipo),
        inmuebleIds,
        workerIds,
        duplicateKeys,
      });
    }

    const existingKeys = new Set<string>();
    if (skipDuplicates && allInmuebleIds.size > 0) {
      const { data: links, error: linksError } = await admin
        .from('cliente_inmuebles')
        .select(
          'inmueble_id, clientes!inner(telefono, fecha_contacto)',
        )
        .in('inmueble_id', [...allInmuebleIds]);

      if (linksError) {
        this.logger.error(
          `Error al buscar duplicados en importación: ${linksError.message}`,
        );
        throw new InternalServerErrorException(
          'No se pudieron validar duplicados',
        );
      }

      for (const link of links ?? []) {
        const rawCliente = link.clientes;
        const cliente = (
          Array.isArray(rawCliente) ? rawCliente[0] : rawCliente
        ) as
          | {
              telefono: string | null;
              fecha_contacto: string | null;
            }
          | null
          | undefined;

        const key = buildClienteDuplicateKey(
          cliente?.telefono,
          cliente?.fecha_contacto,
          link.inmueble_id as string,
        );
        if (key) existingKeys.add(key);
      }
    }

    const seenInBatch = new Set<string>();
    const toCreate: PreparedImportRow[] = [];
    let skipped = 0;

    for (const row of prepared) {
      if (skipDuplicates && row.duplicateKeys.length > 0) {
        const duplicate = row.duplicateKeys.some(
          (key) => existingKeys.has(key) || seenInBatch.has(key),
        );
        if (duplicate) {
          skipped++;
          continue;
        }
        for (const key of row.duplicateKeys) {
          seenInBatch.add(key);
          existingKeys.add(key);
        }
      }

      toCreate.push(row);
    }

    if (toCreate.length === 0) {
      return { created: 0, skipped, failed: 0 };
    }

    const tipoByInmueble = new Map<string, string>();
    if (allInmuebleIds.size > 0) {
      const { data: inmuebles, error: inmueblesError } = await admin
        .from('inmuebles')
        .select('id, tipo_operacion')
        .in('id', [...allInmuebleIds]);

      if (inmueblesError) {
        this.logger.error(
          `Error al leer inmuebles para importación: ${inmueblesError.message}`,
        );
        throw new InternalServerErrorException(
          'No se pudieron validar los inmuebles',
        );
      }

      for (const inmueble of inmuebles ?? []) {
        tipoByInmueble.set(
          inmueble.id as string,
          inmueble.tipo_operacion as string,
        );
      }
    }

    if (fixedInmuebleId) {
      tipoByInmueble.set(fixedInmuebleId, fixedInmuebleTipo);
    }

    const INSERT_CHUNK = 200;
    let created = 0;
    let failed = 0;

    for (let index = 0; index < toCreate.length; index += INSERT_CHUNK) {
      const chunk = toCreate.slice(index, index + INSERT_CHUNK);

      const { data: inserted, error: insertError } = await admin
        .from('clientes')
        .insert(chunk.map((row) => row.clienteData))
        .select('id');

      if (insertError) {
        this.logger.error(
          `Error en importación masiva de clientes: ${insertError.message}`,
        );
        failed += chunk.length;
        continue;
      }

      const insertedRows = inserted ?? [];
      if (insertedRows.length !== chunk.length) {
        failed += chunk.length - insertedRows.length;
      }

      const inmuebleRows: Array<{
        cliente_id: string;
        inmueble_id: string;
        gestion_estado: string;
      }> = [];
      const workerRows: Array<{ cliente_id: string; worker_id: string }> = [];

      for (let rowIndex = 0; rowIndex < insertedRows.length; rowIndex++) {
        const clienteId = insertedRows[rowIndex].id as string;
        const row = chunk[rowIndex];

        for (const inmuebleId of row.inmuebleIds) {
          const tipo = tipoByInmueble.get(inmuebleId);
          inmuebleRows.push({
            cliente_id: clienteId,
            inmueble_id: inmuebleId,
            gestion_estado: getDefaultClienteGestionEstado(
              tipo === 'venta' ? 'venta' : 'alquiler',
            ),
          });
        }

        for (const workerId of row.workerIds) {
          workerRows.push({
            cliente_id: clienteId,
            worker_id: workerId,
          });
        }
      }

      if (inmuebleRows.length > 0) {
        const { error: inmuebleError } = await admin
          .from('cliente_inmuebles')
          .insert(inmuebleRows);

        if (inmuebleError) {
          this.logger.error(
            `Error al vincular inmuebles en importación: ${inmuebleError.message}`,
          );
          throw new InternalServerErrorException(
            'Clientes creados pero falló el vínculo con inmuebles',
          );
        }
      }

      if (workerRows.length > 0) {
        const { error: workerError } = await admin
          .from('cliente_workers')
          .insert(workerRows);

        if (workerError) {
          this.logger.error(
            `Error al vincular trabajadores en importación: ${workerError.message}`,
          );
          throw new InternalServerErrorException(
            'Clientes creados pero falló el vínculo con trabajadores',
          );
        }
      }

      created += insertedRows.length;
    }

    return { created, skipped, failed };
  }

  async remove(id: string): Promise<{ mensaje: string }> {
    await this.findOne(id);

    const { error } = await this.supabase
      .getAdmin()
      .from('clientes')
      .delete()
      .eq('id', id);

    if (error) {
      this.logger.error(`Error al eliminar cliente ${id}: ${error.message}`);
      throw new InternalServerErrorException('No se pudo eliminar el cliente');
    }

    return { mensaje: 'Cliente eliminado correctamente' };
  }

  async bulkRemove(dto: { cliente_ids: string[] }): Promise<{ deleted: number }> {
    const clienteIds = [...new Set((dto.cliente_ids ?? []).filter(Boolean))];
    if (clienteIds.length === 0) {
      throw new BadRequestException('Debes indicar al menos un cliente');
    }

    const admin = this.supabase.getAdmin();
    const chunkSize = 500;
    let deleted = 0;

    for (let i = 0; i < clienteIds.length; i += chunkSize) {
      const chunk = clienteIds.slice(i, i + chunkSize);
      const { error, count } = await admin
        .from('clientes')
        .delete({ count: 'exact' })
        .in('id', chunk);

      if (error) {
        this.logger.error(
          `Error al eliminar clientes en bloque: ${error.message}`,
        );
        throw new InternalServerErrorException(
          'No se pudieron eliminar los clientes seleccionados',
        );
      }

      deleted += count ?? chunk.length;
    }

    return { deleted };
  }

  private async syncRelations(
    clienteId: string,
    inmuebleIds: string[],
    workerIds: string[],
  ): Promise<void> {
    const admin = this.supabase.getAdmin();

    const { data: existingInmuebleLinks } = await admin
      .from('cliente_inmuebles')
      .select('inmueble_id, gestion_estado')
      .eq('cliente_id', clienteId);

    const gestionByInmueble = new Map(
      (existingInmuebleLinks ?? []).map((link) => [
        link.inmueble_id as string,
        link.gestion_estado as string | null,
      ]),
    );

    const { error: delInmError } = await admin
      .from('cliente_inmuebles')
      .delete()
      .eq('cliente_id', clienteId);

    if (delInmError) {
      this.logger.error(
        `Error al limpiar inmuebles del cliente: ${delInmError.message}`,
      );
      throw new InternalServerErrorException(
        'No se pudieron actualizar los inmuebles del cliente',
      );
    }

    const { error: delWorkerError } = await admin
      .from('cliente_workers')
      .delete()
      .eq('cliente_id', clienteId);

    if (delWorkerError) {
      this.logger.error(
        `Error al limpiar workers del cliente: ${delWorkerError.message}`,
      );
      throw new InternalServerErrorException(
        'No se pudieron actualizar los trabajadores del cliente',
      );
    }

    if (inmuebleIds.length > 0) {
      const { data: inmuebles } = await admin
        .from('inmuebles')
        .select('id, tipo_operacion')
        .in('id', inmuebleIds);

      const tipoByInmueble = new Map(
        (inmuebles ?? []).map((row) => [
          row.id as string,
          row.tipo_operacion as string,
        ]),
      );

      const { error: insInmError } = await admin
        .from('cliente_inmuebles')
        .insert(
          inmuebleIds.map((inmueble_id) => {
            const tipo = tipoByInmueble.get(inmueble_id);
            const defaultGestion = getDefaultClienteGestionEstado(
              tipo === 'venta' ? 'venta' : 'alquiler',
            );

            return {
              cliente_id: clienteId,
              inmueble_id,
              gestion_estado:
                gestionByInmueble.get(inmueble_id) ?? defaultGestion,
            };
          }),
        );

      if (insInmError) {
        this.logger.error(
          `Error al vincular inmuebles: ${insInmError.message}`,
        );
        throw new InternalServerErrorException(
          'No se pudieron vincular los inmuebles',
        );
      }
    }

    if (workerIds.length > 0) {
      const { error: insWorkerError } = await admin
        .from('cliente_workers')
        .insert(
          workerIds.map((worker_id) => ({
            cliente_id: clienteId,
            worker_id,
          })),
        );

      if (insWorkerError) {
        this.logger.error(
          `Error al vincular workers: ${insWorkerError.message}`,
        );
        throw new InternalServerErrorException(
          'No se pudieron vincular los trabajadores',
        );
      }
    }
  }

  /**
   * Duplicate only when phone + visit/contact day + at least one shared inmueble
   * already exist on another cliente row.
   */
  private async findDuplicateByPhoneDateAndInmuebles(
    telefono: string | null | undefined,
    fechaContacto: string | null | undefined,
    inmuebleIds: string[],
  ): Promise<{ id: string } | null> {
    const phone = normalizeClienteTelefono(telefono);
    if (!phone || !fechaContacto || inmuebleIds.length === 0) return null;

    const dateKey = clienteContactDateKey(fechaContacto);
    if (!dateKey) return null;

    const uniqueInmuebleIds = [...new Set(inmuebleIds.filter(Boolean))];
    if (uniqueInmuebleIds.length === 0) return null;

    const { data, error } = await this.supabase
      .getAdmin()
      .from('cliente_inmuebles')
      .select('cliente_id, inmueble_id, clientes!inner(id, telefono, fecha_contacto)')
      .in('inmueble_id', uniqueInmuebleIds);

    if (error) {
      this.logger.error(
        `Error al buscar duplicado de cliente: ${error.message}`,
      );
      return null;
    }

    for (const row of data ?? []) {
      const rawCliente = row.clientes;
      const cliente = (
        Array.isArray(rawCliente) ? rawCliente[0] : rawCliente
      ) as
        | {
            id: string;
            telefono: string | null;
            fecha_contacto: string | null;
          }
        | null
        | undefined;
      if (!cliente?.fecha_contacto) continue;
      if (normalizeClienteTelefono(cliente.telefono) !== phone) continue;

      if (clienteContactDateKey(cliente.fecha_contacto) !== dateKey) continue;

      return { id: cliente.id };
    }

    return null;
  }

  private buildClienteInsertPayload(
    raw: BulkImportClienteItemDto,
    fixedTipo: 'alquiler' | 'venta' | null,
  ): Record<string, unknown> {
    return {
      nombre: raw.nombre.trim(),
      email: raw.email ?? null,
      telefono: raw.telefono ?? null,
      ciudad: raw.ciudad ?? null,
      barrio: raw.barrio ?? null,
      distrito: raw.distrito ?? null,
      tipo_nomina: raw.tipo_nomina ?? null,
      tipo_cliente: raw.tipo_cliente ?? null,
      estado: raw.estado ?? 'pendiente',
      origen: raw.origen ?? null,
      estado_contacto: raw.estado_contacto ?? null,
      descripcion: raw.descripcion ?? null,
      ref_cliente: raw.ref_cliente ?? null,
      mensaje: raw.mensaje ?? null,
      fecha_contacto: raw.fecha_contacto ?? null,
      fecha_ultima_gestion: raw.fecha_ultima_gestion ?? null,
      presupuesto_maximo: raw.presupuesto_maximo ?? null,
      banos: raw.banos ?? null,
      notas: raw.notas ?? null,
      tipo_operacion: fixedTipo ?? raw.tipo_operacion ?? null,
    };
  }

  private mapCliente(row: Record<string, unknown>): Cliente {
    const clienteInmuebles = (row.cliente_inmuebles ?? []) as Array<{
      inmueble_id: string;
      inmuebles: Cliente['inmuebles'] extends (infer U)[] | undefined
        ? U
        : never;
    }>;
    const clienteWorkers = (row.cliente_workers ?? []) as Array<{
      worker_id: string;
      workers: Cliente['workers'] extends (infer U)[] | undefined ? U : never;
    }>;

    const inmuebles = clienteInmuebles
      .map((r) => r.inmuebles)
      .filter(Boolean) as Cliente['inmuebles'];
    const workers = clienteWorkers
      .map((r) => r.workers)
      .filter(Boolean) as Cliente['workers'];

    const {
      cliente_inmuebles: _ci,
      cliente_workers: _cw,
      ...rest
    } = row;

    return {
      ...(rest as unknown as Cliente),
      inmueble_ids: clienteInmuebles.map((r) => r.inmueble_id),
      worker_ids: clienteWorkers.map((r) => r.worker_id),
      inmuebles_count: inmuebles?.length ?? 0,
      workers_count: workers?.length ?? 0,
      inmuebles,
      workers,
    };
  }
}
