"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var ClientesService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ClientesService = void 0;
const common_1 = require("@nestjs/common");
const supabase_service_1 = require("../supabase/supabase.service");
const cliente_duplicate_util_1 = require("./cliente-duplicate.util");
const cliente_gestion_estado_1 = require("./cliente-gestion-estado");
const cliente_entrada_prevista_1 = require("./cliente-entrada-prevista");
const enrich_import_cliente_util_1 = require("./enrich-import-cliente.util");
const match_inmueble_ref_util_1 = require("./match-inmueble-ref.util");
const cliente_zonas_util_1 = require("./cliente-zonas.util");
const cliente_telefonos_util_1 = require("./cliente-telefonos.util");
const SELECT_FIELDS = `
  id,
  nombre,
  email,
  telefono,
  telefonos_extra,
  ciudad,
  barrio,
  distrito,
  tipo_nomina,
  tipo_ingreso,
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
  cliente_workers(worker_id, workers(*)),
  cliente_perfiles(id, cliente_id, orden, nombre, telefono, tipo_nomina, tipo_ingreso, ingreso_monto, banos, pais, notas, created_at, updated_at)
`;
const PERFIL_SELECT = `
  id,
  cliente_id,
  orden,
  nombre,
  telefono,
  tipo_nomina,
  tipo_ingreso,
  ingreso_monto,
  banos,
  pais,
  notas,
  created_at,
  updated_at
`;
async function fetchAll(queryFactory, pageSize = 1000) {
    const all = [];
    for (let from = 0;; from += pageSize) {
        const to = from + pageSize - 1;
        const { data, error } = await queryFactory(from, to);
        if (error)
            throw new Error(error.message);
        const chunk = data ?? [];
        all.push(...chunk);
        if (chunk.length < pageSize)
            break;
    }
    return all;
}
let ClientesService = ClientesService_1 = class ClientesService {
    supabase;
    logger = new common_1.Logger(ClientesService_1.name);
    constructor(supabase) {
        this.supabase = supabase;
    }
    async findAll() {
        try {
            const data = await fetchAll((from, to) => this.supabase
                .getAdmin()
                .from('clientes')
                .select(RELATIONS_SELECT)
                .order('nombre', { ascending: true })
                .range(from, to));
            return (data ?? []).map((row) => this.mapCliente(row));
        }
        catch (e) {
            const message = e instanceof Error ? e.message : String(e);
            this.logger.error(`Error al listar clientes: ${message}`);
            throw new common_1.InternalServerErrorException('No se pudieron cargar los clientes');
        }
    }
    async findOne(id) {
        const { data, error } = await this.supabase
            .getAdmin()
            .from('clientes')
            .select(RELATIONS_SELECT)
            .eq('id', id)
            .maybeSingle();
        if (error) {
            this.logger.error(`Error al buscar cliente ${id}: ${error.message}`);
            throw new common_1.InternalServerErrorException('No se pudo cargar el cliente');
        }
        if (!data) {
            throw new common_1.NotFoundException('Cliente no encontrado');
        }
        return this.mapCliente(data);
    }
    async create(dto) {
        const { inmueble_ids, worker_ids, ...clienteData } = dto;
        const payload = this.buildClienteWritePayload(clienteData);
        const duplicate = await this.findDuplicateByPhoneDateAndInmuebles(payload.telefono, payload.fecha_contacto, inmueble_ids ?? []);
        if (duplicate) {
            throw new common_1.ConflictException({
                message: 'Ya existe un cliente con el mismo teléfono, fecha de contacto e inmueble',
                code: 'CLIENTE_DUPLICATE',
            });
        }
        const { data, error } = await this.supabase
            .getAdmin()
            .from('clientes')
            .insert({
            ...payload,
            estado: payload.estado ?? 'activo',
        })
            .select(SELECT_FIELDS)
            .single();
        if (error) {
            this.logger.error(`Error al crear cliente: ${error.message}`);
            throw new common_1.InternalServerErrorException('No se pudo crear el cliente');
        }
        await this.syncRelations(data.id, inmueble_ids ?? [], worker_ids ?? []);
        return this.findOne(data.id);
    }
    async update(id, dto) {
        await this.findOne(id);
        const { inmueble_ids, worker_ids, ...clienteData } = dto;
        const payload = this.buildClienteWritePayload(clienteData);
        const { error } = await this.supabase
            .getAdmin()
            .from('clientes')
            .update({ ...payload, updated_at: new Date().toISOString() })
            .eq('id', id);
        if (error) {
            this.logger.error(`Error al actualizar cliente ${id}: ${error.message}`);
            throw new common_1.InternalServerErrorException('No se pudo actualizar el cliente');
        }
        if (inmueble_ids !== undefined || worker_ids !== undefined) {
            const current = await this.findOne(id);
            await this.syncRelations(id, inmueble_ids ?? current.inmueble_ids ?? [], worker_ids ?? current.worker_ids ?? []);
        }
        return this.findOne(id);
    }
    async createPerfil(clienteId, dto) {
        await this.findOne(clienteId);
        const admin = this.supabase.getAdmin();
        const { data: existing, error: listError } = await admin
            .from('cliente_perfiles')
            .select('orden')
            .eq('cliente_id', clienteId)
            .order('orden', { ascending: true });
        if (listError) {
            this.logger.error(`Error al listar perfiles de ${clienteId}: ${listError.message}`);
            throw new common_1.InternalServerErrorException('No se pudieron cargar los perfiles del cliente');
        }
        const usedOrders = new Set((existing ?? []).map((row) => row.orden));
        let orden = dto.orden ?? 1;
        if (usedOrders.has(orden)) {
            orden =
                [...usedOrders].reduce((max, value) => Math.max(max, value), 0) + 1;
        }
        const { data, error } = await admin
            .from('cliente_perfiles')
            .insert({
            cliente_id: clienteId,
            orden,
            nombre: dto.nombre ?? null,
            telefono: dto.telefono ?? null,
            tipo_nomina: dto.tipo_nomina ?? null,
            tipo_ingreso: dto.tipo_ingreso ?? null,
            ingreso_monto: dto.ingreso_monto ?? null,
            banos: dto.banos ?? null,
            pais: dto.pais ?? null,
            notas: dto.notas ?? null,
        })
            .select(PERFIL_SELECT)
            .single();
        if (error) {
            this.logger.error(`Error al crear perfil de ${clienteId}: ${error.message}`);
            throw new common_1.InternalServerErrorException('No se pudo crear el perfil del cliente');
        }
        return this.mapPerfil(data);
    }
    async updatePerfil(clienteId, perfilId, dto) {
        await this.findOne(clienteId);
        const { data: current, error: findError } = await this.supabase
            .getAdmin()
            .from('cliente_perfiles')
            .select(PERFIL_SELECT)
            .eq('id', perfilId)
            .eq('cliente_id', clienteId)
            .maybeSingle();
        if (findError) {
            this.logger.error(`Error al buscar perfil ${perfilId}: ${findError.message}`);
            throw new common_1.InternalServerErrorException('No se pudo cargar el perfil del cliente');
        }
        if (!current) {
            throw new common_1.NotFoundException('Perfil no encontrado');
        }
        const { data, error } = await this.supabase
            .getAdmin()
            .from('cliente_perfiles')
            .update({
            ...dto,
            updated_at: new Date().toISOString(),
        })
            .eq('id', perfilId)
            .eq('cliente_id', clienteId)
            .select(PERFIL_SELECT)
            .single();
        if (error) {
            this.logger.error(`Error al actualizar perfil ${perfilId}: ${error.message}`);
            throw new common_1.InternalServerErrorException('No se pudo actualizar el perfil del cliente');
        }
        return this.mapPerfil(data);
    }
    async removePerfil(clienteId, perfilId) {
        await this.findOne(clienteId);
        const { error } = await this.supabase
            .getAdmin()
            .from('cliente_perfiles')
            .delete()
            .eq('id', perfilId)
            .eq('cliente_id', clienteId);
        if (error) {
            this.logger.error(`Error al eliminar perfil ${perfilId}: ${error.message}`);
            throw new common_1.InternalServerErrorException('No se pudo eliminar el perfil del cliente');
        }
    }
    async bulkAssignWorker(dto) {
        const { worker_id: workerId, assignments } = dto;
        if (!workerId) {
            throw new common_1.BadRequestException('worker_id es obligatorio');
        }
        if (!assignments?.length) {
            throw new common_1.BadRequestException('Debes indicar al menos una asignación');
        }
        const admin = this.supabase.getAdmin();
        const { data: worker, error: workerError } = await admin
            .from('workers')
            .select('id')
            .eq('id', workerId)
            .maybeSingle();
        if (workerError) {
            this.logger.error(`Error al validar trabajador ${workerId}: ${workerError.message}`);
            throw new common_1.InternalServerErrorException('No se pudo validar el trabajador');
        }
        if (!worker) {
            throw new common_1.NotFoundException('Trabajador no encontrado');
        }
        const inmuebleIdsByCliente = new Map();
        for (const { cliente_id, inmueble_id } of assignments) {
            if (!cliente_id || !inmueble_id) {
                throw new common_1.BadRequestException('Cada asignación requiere cliente_id e inmueble_id');
            }
            if (!inmuebleIdsByCliente.has(cliente_id)) {
                inmuebleIdsByCliente.set(cliente_id, new Set());
            }
            inmuebleIdsByCliente.get(cliente_id).add(inmueble_id);
        }
        const clienteIds = [...inmuebleIdsByCliente.keys()];
        const allInmuebleIds = [
            ...new Set([...inmuebleIdsByCliente.values()].flatMap((ids) => [...ids])),
        ];
        const { data: existingClientes, error: clientesError } = await admin
            .from('clientes')
            .select('id')
            .in('id', clienteIds);
        if (clientesError) {
            this.logger.error(`Error al validar clientes: ${clientesError.message}`);
            throw new common_1.InternalServerErrorException('No se pudieron validar los clientes');
        }
        const foundClienteIds = new Set((existingClientes ?? []).map((row) => row.id));
        const missingClienteIds = clienteIds.filter((id) => !foundClienteIds.has(id));
        if (missingClienteIds.length > 0) {
            throw new common_1.NotFoundException(`Cliente(s) no encontrado(s): ${missingClienteIds.join(', ')}`);
        }
        const { data: existingInmuebleLinks, error: linksError } = await admin
            .from('cliente_inmuebles')
            .select('cliente_id, inmueble_id, gestion_estado')
            .in('cliente_id', clienteIds);
        if (linksError) {
            this.logger.error(`Error al leer relaciones cliente-inmueble: ${linksError.message}`);
            throw new common_1.InternalServerErrorException('No se pudieron leer las relaciones de inmuebles');
        }
        const gestionByClienteInmueble = new Map();
        for (const link of existingInmuebleLinks ?? []) {
            gestionByClienteInmueble.set(`${link.cliente_id}:${link.inmueble_id}`, link.gestion_estado ?? null);
        }
        const { data: inmuebles, error: inmueblesError } = await admin
            .from('inmuebles')
            .select('id, tipo_operacion')
            .in('id', allInmuebleIds);
        if (inmueblesError) {
            this.logger.error(`Error al leer inmuebles: ${inmueblesError.message}`);
            throw new common_1.InternalServerErrorException('No se pudieron validar los inmuebles');
        }
        const tipoByInmueble = new Map((inmuebles ?? []).map((row) => [
            row.id,
            row.tipo_operacion,
        ]));
        const missingInmuebleIds = allInmuebleIds.filter((id) => !tipoByInmueble.has(id));
        if (missingInmuebleIds.length > 0) {
            throw new common_1.NotFoundException(`Inmueble(s) no encontrado(s): ${missingInmuebleIds.join(', ')}`);
        }
        const { error: delWorkerError } = await admin
            .from('cliente_workers')
            .delete()
            .in('cliente_id', clienteIds);
        if (delWorkerError) {
            this.logger.error(`Error al limpiar trabajadores: ${delWorkerError.message}`);
            throw new common_1.InternalServerErrorException('No se pudieron actualizar los trabajadores');
        }
        const { error: delInmError } = await admin
            .from('cliente_inmuebles')
            .delete()
            .in('cliente_id', clienteIds);
        if (delInmError) {
            this.logger.error(`Error al limpiar inmuebles: ${delInmError.message}`);
            throw new common_1.InternalServerErrorException('No se pudieron actualizar los inmuebles');
        }
        const workerRows = clienteIds.map((cliente_id) => ({
            cliente_id,
            worker_id: workerId,
        }));
        const { error: insWorkerError } = await admin
            .from('cliente_workers')
            .insert(workerRows);
        if (insWorkerError) {
            this.logger.error(`Error al asignar trabajador: ${insWorkerError.message}`);
            throw new common_1.InternalServerErrorException('No se pudieron asignar los trabajadores');
        }
        const inmuebleRows = [...inmuebleIdsByCliente.entries()].flatMap(([cliente_id, inmuebleIds]) => [...inmuebleIds].map((inmueble_id) => {
            const tipo = tipoByInmueble.get(inmueble_id);
            const defaultGestion = (0, cliente_gestion_estado_1.getDefaultClienteGestionEstado)(tipo === 'venta' ? 'venta' : 'alquiler');
            return {
                cliente_id,
                inmueble_id,
                gestion_estado: gestionByClienteInmueble.get(`${cliente_id}:${inmueble_id}`) ??
                    defaultGestion,
            };
        }));
        const { error: insInmError } = await admin
            .from('cliente_inmuebles')
            .insert(inmuebleRows);
        if (insInmError) {
            this.logger.error(`Error al vincular inmuebles: ${insInmError.message}`);
            throw new common_1.InternalServerErrorException('No se pudieron vincular los inmuebles');
        }
        const now = new Date().toISOString();
        const { error: touchError } = await admin
            .from('clientes')
            .update({ updated_at: now })
            .in('id', clienteIds);
        if (touchError) {
            this.logger.warn(`Asignación OK pero no se actualizó updated_at: ${touchError.message}`);
        }
        return { assigned: assignments.length };
    }
    async bulkUnassignWorker(dto) {
        const clienteIds = [...new Set((dto.cliente_ids ?? []).filter(Boolean))];
        if (clienteIds.length === 0) {
            throw new common_1.BadRequestException('Debes indicar al menos un cliente');
        }
        const admin = this.supabase.getAdmin();
        const { data: existingClientes, error: clientesError } = await admin
            .from('clientes')
            .select('id')
            .in('id', clienteIds);
        if (clientesError) {
            this.logger.error(`Error al validar clientes: ${clientesError.message}`);
            throw new common_1.InternalServerErrorException('No se pudieron validar los clientes');
        }
        const foundClienteIds = new Set((existingClientes ?? []).map((row) => row.id));
        const missingClienteIds = clienteIds.filter((id) => !foundClienteIds.has(id));
        if (missingClienteIds.length > 0) {
            throw new common_1.NotFoundException(`Cliente(s) no encontrado(s): ${missingClienteIds.join(', ')}`);
        }
        const { error: delWorkerError } = await admin
            .from('cliente_workers')
            .delete()
            .in('cliente_id', clienteIds);
        if (delWorkerError) {
            this.logger.error(`Error al quitar trabajadores: ${delWorkerError.message}`);
            throw new common_1.InternalServerErrorException('No se pudieron quitar los trabajadores');
        }
        const now = new Date().toISOString();
        const { error: touchError } = await admin
            .from('clientes')
            .update({ updated_at: now })
            .in('id', clienteIds);
        if (touchError) {
            this.logger.warn(`Desasignación OK pero no se actualizó updated_at: ${touchError.message}`);
        }
        return { unassigned: clienteIds.length };
    }
    async bulkAssignInmueble(dto) {
        const { inmueble_id: inmuebleId, cliente_ids: rawClienteIds } = dto;
        if (!inmuebleId) {
            throw new common_1.BadRequestException('inmueble_id es obligatorio');
        }
        const requestedClienteIds = [
            ...new Set((rawClienteIds ?? []).filter(Boolean)),
        ];
        if (requestedClienteIds.length === 0) {
            throw new common_1.BadRequestException('Debes indicar al menos un cliente');
        }
        const admin = this.supabase.getAdmin();
        const { data: inmueble, error: inmuebleError } = await admin
            .from('inmuebles')
            .select('id, tipo_operacion, ref')
            .eq('id', inmuebleId)
            .maybeSingle();
        if (inmuebleError) {
            this.logger.error(`Error al validar inmueble ${inmuebleId}: ${inmuebleError.message}`);
            throw new common_1.InternalServerErrorException('No se pudo validar el inmueble');
        }
        if (!inmueble) {
            throw new common_1.NotFoundException('Inmueble no encontrado');
        }
        const inmuebleRef = inmueble.ref?.trim();
        if (!inmuebleRef) {
            throw new common_1.BadRequestException('El inmueble no tiene referencia y no se puede asignar');
        }
        const { data: existingClientes, error: clientesError } = await admin
            .from('clientes')
            .select('id, telefono')
            .in('id', requestedClienteIds);
        if (clientesError) {
            this.logger.error(`Error al validar clientes: ${clientesError.message}`);
            throw new common_1.InternalServerErrorException('No se pudieron validar los clientes');
        }
        const clienteRows = (existingClientes ?? []).map((row) => ({
            id: row.id,
            telefono: row.telefono,
        }));
        const foundClienteIds = new Set(clienteRows.map((row) => row.id));
        const missingClienteIds = requestedClienteIds.filter((id) => !foundClienteIds.has(id));
        if (missingClienteIds.length > 0) {
            throw new common_1.NotFoundException(`Cliente(s) no encontrado(s): ${missingClienteIds.join(', ')}`);
        }
        const { data: existingLinks, error: linksError } = await admin
            .from('cliente_inmuebles')
            .select('cliente_id')
            .eq('inmueble_id', inmuebleId)
            .in('cliente_id', requestedClienteIds);
        if (linksError) {
            this.logger.error(`Error al leer relaciones cliente-inmueble: ${linksError.message}`);
            throw new common_1.InternalServerErrorException('No se pudieron leer las relaciones de inmuebles');
        }
        const preferLinkedClienteIds = (existingLinks ?? []).map((row) => row.cliente_id);
        const clienteIds = (0, cliente_duplicate_util_1.pickUniqueClienteIdsByTelefono)(clienteRows, {
            preferClienteIds: preferLinkedClienteIds,
        });
        const phoneDuplicatesSkipped = requestedClienteIds.length - clienteIds.length;
        const alreadyLinked = new Set(preferLinkedClienteIds);
        const toAssign = clienteIds.filter((id) => !alreadyLinked.has(id));
        const defaultGestion = (0, cliente_gestion_estado_1.getDefaultClienteGestionEstado)(inmueble.tipo_operacion === 'venta' ? 'venta' : 'alquiler');
        if (toAssign.length > 0) {
            const { error: insError } = await admin.from('cliente_inmuebles').insert(toAssign.map((cliente_id) => ({
                cliente_id,
                inmueble_id: inmuebleId,
                gestion_estado: defaultGestion,
            })));
            if (insError) {
                this.logger.error(`Error al vincular clientes al inmueble: ${insError.message}`);
                throw new common_1.InternalServerErrorException('No se pudieron vincular los clientes al inmueble');
            }
        }
        const now = new Date().toISOString();
        const { error: refError } = await admin
            .from('clientes')
            .update({ ref_cliente: inmuebleRef, updated_at: now })
            .in('id', clienteIds);
        if (refError) {
            this.logger.error(`Error al actualizar referencia de clientes: ${refError.message}`);
            throw new common_1.InternalServerErrorException('No se pudo actualizar la referencia de los clientes');
        }
        return {
            assigned: toAssign.length,
            skipped: clienteIds.length - toAssign.length,
            phone_duplicates_skipped: phoneDuplicatesSkipped,
        };
    }
    async bulkImport(dto) {
        const { clientes, options } = dto;
        const skipDuplicates = options?.skip_duplicates !== false;
        const fixedInmuebleId = options?.inmueble_id?.trim() || null;
        const fixedWorkerId = options?.worker_id?.trim() || null;
        const fixedTipo = options?.tipo_operacion ?? null;
        if (!clientes?.length) {
            throw new common_1.BadRequestException('Debes indicar al menos un cliente');
        }
        const admin = this.supabase.getAdmin();
        let fixedInmuebleTipo = 'alquiler';
        if (fixedInmuebleId) {
            const { data: inmueble, error: inmuebleError } = await admin
                .from('inmuebles')
                .select('id, tipo_operacion')
                .eq('id', fixedInmuebleId)
                .maybeSingle();
            if (inmuebleError) {
                this.logger.error(`Error al validar inmueble ${fixedInmuebleId}: ${inmuebleError.message}`);
                throw new common_1.InternalServerErrorException('No se pudo validar el inmueble');
            }
            if (!inmueble) {
                throw new common_1.NotFoundException('Inmueble no encontrado');
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
                this.logger.error(`Error al validar trabajador ${fixedWorkerId}: ${workerError.message}`);
                throw new common_1.InternalServerErrorException('No se pudo validar el trabajador');
            }
            if (!worker) {
                throw new common_1.NotFoundException('Trabajador no encontrado');
            }
        }
        let inmueblesForMatch = [];
        if (!fixedInmuebleId && fixedTipo) {
            const { data: inmueblesMatchData, error: inmueblesMatchError } = await admin
                .from('inmuebles')
                .select('id, ref, tipo_operacion')
                .eq('tipo_operacion', fixedTipo);
            if (inmueblesMatchError) {
                this.logger.error(`Error al cargar inmuebles para importación: ${inmueblesMatchError.message}`);
                throw new common_1.InternalServerErrorException('No se pudieron cargar los inmuebles para vincular clientes');
            }
            inmueblesForMatch = inmueblesMatchData ?? [];
        }
        const prepared = [];
        const allInmuebleIds = new Set();
        for (const rawClient of clientes) {
            const raw = (0, enrich_import_cliente_util_1.enrichClienteImportRow)(rawClient);
            const nombre = raw.nombre?.trim();
            if (!nombre)
                continue;
            const matchedInmuebleId = !fixedInmuebleId && fixedTipo
                ? (0, match_inmueble_ref_util_1.findInmuebleIdByClienteRef)(raw.ref_cliente, inmueblesForMatch, fixedTipo)
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
                ...new Set(inmuebleIds
                    .map((inmuebleId) => (0, cliente_duplicate_util_1.buildClienteDuplicateKey)(raw.telefono, raw.fecha_contacto, inmuebleId))
                    .filter((key) => key != null)),
            ];
            prepared.push({
                clienteData: this.buildClienteInsertPayload(raw, fixedTipo),
                inmuebleIds,
                workerIds,
                duplicateKeys,
            });
        }
        const existingKeys = new Set();
        if (skipDuplicates && allInmuebleIds.size > 0) {
            const { data: links, error: linksError } = await admin
                .from('cliente_inmuebles')
                .select('inmueble_id, clientes!inner(telefono, fecha_contacto)')
                .in('inmueble_id', [...allInmuebleIds]);
            if (linksError) {
                this.logger.error(`Error al buscar duplicados en importación: ${linksError.message}`);
                throw new common_1.InternalServerErrorException('No se pudieron validar duplicados');
            }
            for (const link of links ?? []) {
                const rawCliente = link.clientes;
                const cliente = (Array.isArray(rawCliente) ? rawCliente[0] : rawCliente);
                const key = (0, cliente_duplicate_util_1.buildClienteDuplicateKey)(cliente?.telefono, cliente?.fecha_contacto, link.inmueble_id);
                if (key)
                    existingKeys.add(key);
            }
        }
        const seenInBatch = new Set();
        const toCreate = [];
        let skipped = 0;
        for (const row of prepared) {
            if (skipDuplicates && row.duplicateKeys.length > 0) {
                const duplicate = row.duplicateKeys.some((key) => existingKeys.has(key) || seenInBatch.has(key));
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
        const tipoByInmueble = new Map();
        if (allInmuebleIds.size > 0) {
            const { data: inmuebles, error: inmueblesError } = await admin
                .from('inmuebles')
                .select('id, tipo_operacion')
                .in('id', [...allInmuebleIds]);
            if (inmueblesError) {
                this.logger.error(`Error al leer inmuebles para importación: ${inmueblesError.message}`);
                throw new common_1.InternalServerErrorException('No se pudieron validar los inmuebles');
            }
            for (const inmueble of inmuebles ?? []) {
                tipoByInmueble.set(inmueble.id, inmueble.tipo_operacion);
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
                this.logger.error(`Error en importación masiva de clientes: ${insertError.message}`);
                failed += chunk.length;
                continue;
            }
            const insertedRows = inserted ?? [];
            if (insertedRows.length !== chunk.length) {
                failed += chunk.length - insertedRows.length;
            }
            const inmuebleRows = [];
            const workerRows = [];
            for (let rowIndex = 0; rowIndex < insertedRows.length; rowIndex++) {
                const clienteId = insertedRows[rowIndex].id;
                const row = chunk[rowIndex];
                for (const inmuebleId of row.inmuebleIds) {
                    const tipo = tipoByInmueble.get(inmuebleId);
                    inmuebleRows.push({
                        cliente_id: clienteId,
                        inmueble_id: inmuebleId,
                        gestion_estado: (0, cliente_gestion_estado_1.getDefaultClienteGestionEstado)(tipo === 'venta' ? 'venta' : 'alquiler'),
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
                    this.logger.error(`Error al vincular inmuebles en importación: ${inmuebleError.message}`);
                    throw new common_1.InternalServerErrorException('Clientes creados pero falló el vínculo con inmuebles');
                }
            }
            if (workerRows.length > 0) {
                const { error: workerError } = await admin
                    .from('cliente_workers')
                    .insert(workerRows);
                if (workerError) {
                    this.logger.error(`Error al vincular trabajadores en importación: ${workerError.message}`);
                    throw new common_1.InternalServerErrorException('Clientes creados pero falló el vínculo con trabajadores');
                }
            }
            created += insertedRows.length;
        }
        return { created, skipped, failed };
    }
    async remove(id) {
        await this.findOne(id);
        const { error } = await this.supabase
            .getAdmin()
            .from('clientes')
            .delete()
            .eq('id', id);
        if (error) {
            this.logger.error(`Error al eliminar cliente ${id}: ${error.message}`);
            throw new common_1.InternalServerErrorException('No se pudo eliminar el cliente');
        }
        return { mensaje: 'Cliente eliminado correctamente' };
    }
    async bulkRemove(dto) {
        const clienteIds = [...new Set((dto.cliente_ids ?? []).filter(Boolean))];
        if (clienteIds.length === 0) {
            throw new common_1.BadRequestException('Debes indicar al menos un cliente');
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
                this.logger.error(`Error al eliminar clientes en bloque: ${error.message}`);
                throw new common_1.InternalServerErrorException('No se pudieron eliminar los clientes seleccionados');
            }
            deleted += count ?? chunk.length;
        }
        return { deleted };
    }
    async syncRelations(clienteId, inmuebleIds, workerIds) {
        const admin = this.supabase.getAdmin();
        const { data: existingInmuebleLinks } = await admin
            .from('cliente_inmuebles')
            .select('inmueble_id, gestion_estado')
            .eq('cliente_id', clienteId);
        const gestionByInmueble = new Map((existingInmuebleLinks ?? []).map((link) => [
            link.inmueble_id,
            link.gestion_estado,
        ]));
        const { error: delInmError } = await admin
            .from('cliente_inmuebles')
            .delete()
            .eq('cliente_id', clienteId);
        if (delInmError) {
            this.logger.error(`Error al limpiar inmuebles del cliente: ${delInmError.message}`);
            throw new common_1.InternalServerErrorException('No se pudieron actualizar los inmuebles del cliente');
        }
        const { error: delWorkerError } = await admin
            .from('cliente_workers')
            .delete()
            .eq('cliente_id', clienteId);
        if (delWorkerError) {
            this.logger.error(`Error al limpiar workers del cliente: ${delWorkerError.message}`);
            throw new common_1.InternalServerErrorException('No se pudieron actualizar los trabajadores del cliente');
        }
        if (inmuebleIds.length > 0) {
            const { data: inmuebles } = await admin
                .from('inmuebles')
                .select('id, tipo_operacion')
                .in('id', inmuebleIds);
            const tipoByInmueble = new Map((inmuebles ?? []).map((row) => [
                row.id,
                row.tipo_operacion,
            ]));
            const { error: insInmError } = await admin
                .from('cliente_inmuebles')
                .insert(inmuebleIds.map((inmueble_id) => {
                const tipo = tipoByInmueble.get(inmueble_id);
                const defaultGestion = (0, cliente_gestion_estado_1.getDefaultClienteGestionEstado)(tipo === 'venta' ? 'venta' : 'alquiler');
                return {
                    cliente_id: clienteId,
                    inmueble_id,
                    gestion_estado: gestionByInmueble.get(inmueble_id) ?? defaultGestion,
                };
            }));
            if (insInmError) {
                this.logger.error(`Error al vincular inmuebles: ${insInmError.message}`);
                throw new common_1.InternalServerErrorException('No se pudieron vincular los inmuebles');
            }
        }
        if (workerIds.length > 0) {
            const { error: insWorkerError } = await admin
                .from('cliente_workers')
                .insert(workerIds.map((worker_id) => ({
                cliente_id: clienteId,
                worker_id,
            })));
            if (insWorkerError) {
                this.logger.error(`Error al vincular workers: ${insWorkerError.message}`);
                throw new common_1.InternalServerErrorException('No se pudieron vincular los trabajadores');
            }
        }
    }
    async findDuplicateByPhoneDateAndInmuebles(telefono, fechaContacto, inmuebleIds) {
        const phone = (0, cliente_duplicate_util_1.normalizeClienteTelefono)(telefono);
        if (!phone || !fechaContacto || inmuebleIds.length === 0)
            return null;
        const dateKey = (0, cliente_duplicate_util_1.clienteContactDateKey)(fechaContacto);
        if (!dateKey)
            return null;
        const uniqueInmuebleIds = [...new Set(inmuebleIds.filter(Boolean))];
        if (uniqueInmuebleIds.length === 0)
            return null;
        const { data, error } = await this.supabase
            .getAdmin()
            .from('cliente_inmuebles')
            .select('cliente_id, inmueble_id, clientes!inner(id, telefono, fecha_contacto)')
            .in('inmueble_id', uniqueInmuebleIds);
        if (error) {
            this.logger.error(`Error al buscar duplicado de cliente: ${error.message}`);
            return null;
        }
        for (const row of data ?? []) {
            const rawCliente = row.clientes;
            const cliente = (Array.isArray(rawCliente) ? rawCliente[0] : rawCliente);
            if (!cliente?.fecha_contacto)
                continue;
            if ((0, cliente_duplicate_util_1.normalizeClienteTelefono)(cliente.telefono) !== phone)
                continue;
            if ((0, cliente_duplicate_util_1.clienteContactDateKey)(cliente.fecha_contacto) !== dateKey)
                continue;
            return { id: cliente.id };
        }
        return null;
    }
    buildClienteWritePayload(clienteData) {
        return this.sanitizeClienteWriteData({
            ...clienteData,
            ...(clienteData.telefonos_extra !== undefined
                ? {
                    telefonos_extra: (0, cliente_telefonos_util_1.normalizeClienteTelefonosExtra)(clienteData.telefonos_extra),
                }
                : {}),
        });
    }
    sanitizeClienteWriteData(data) {
        if (data.fecha_entrada_inmueble === undefined) {
            return data;
        }
        return {
            ...data,
            fecha_entrada_inmueble: (0, cliente_entrada_prevista_1.parseClienteEntradaPrevistaInput)(data.fecha_entrada_inmueble),
        };
    }
    buildClienteInsertPayload(raw, fixedTipo) {
        return {
            nombre: raw.nombre.trim(),
            email: raw.email ?? null,
            telefono: raw.telefono ?? null,
            ciudad: raw.ciudad ?? null,
            barrio: (0, cliente_zonas_util_1.normalizeClienteZonas)(raw.barrio),
            distrito: (0, cliente_zonas_util_1.normalizeClienteZonas)(raw.distrito),
            tipo_nomina: raw.tipo_nomina ?? null,
            tipo_ingreso: raw.tipo_ingreso ?? null,
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
    mapCliente(row) {
        const clienteInmuebles = (row.cliente_inmuebles ?? []);
        const clienteWorkers = (row.cliente_workers ?? []);
        const clientePerfiles = (row.cliente_perfiles ?? []);
        const inmuebles = clienteInmuebles
            .map((r) => r.inmuebles)
            .filter(Boolean);
        const workers = clienteWorkers
            .map((r) => r.workers)
            .filter(Boolean);
        const perfiles = clientePerfiles
            .map((perfil) => this.mapPerfil(perfil))
            .sort((a, b) => a.orden - b.orden);
        const { cliente_inmuebles: _ci, cliente_workers: _cw, cliente_perfiles: _cp, ...rest } = row;
        return {
            ...rest,
            barrio: (0, cliente_zonas_util_1.normalizeClienteZonas)(rest.barrio),
            distrito: (0, cliente_zonas_util_1.normalizeClienteZonas)(rest.distrito),
            telefonos_extra: (0, cliente_telefonos_util_1.normalizeClienteTelefonosExtra)(rest.telefonos_extra),
            fecha_entrada_inmueble: (0, cliente_entrada_prevista_1.normalizeClienteEntradaPrevista)(rest.fecha_entrada_inmueble ?? null),
            inmueble_ids: clienteInmuebles.map((r) => r.inmueble_id),
            worker_ids: clienteWorkers.map((r) => r.worker_id),
            inmuebles_count: inmuebles?.length ?? 0,
            workers_count: workers?.length ?? 0,
            inmuebles,
            workers,
            perfiles,
        };
    }
    mapPerfil(row) {
        return {
            id: String(row.id),
            cliente_id: String(row.cliente_id),
            orden: Number(row.orden),
            nombre: row.nombre ?? null,
            telefono: row.telefono ?? null,
            tipo_nomina: row.tipo_nomina ?? null,
            tipo_ingreso: row.tipo_ingreso ?? null,
            ingreso_monto: row.ingreso_monto == null ? null : Number(row.ingreso_monto),
            banos: row.banos == null ? null : Number(row.banos),
            pais: row.pais ?? null,
            notas: row.notas ?? null,
            created_at: String(row.created_at),
            updated_at: String(row.updated_at),
        };
    }
};
exports.ClientesService = ClientesService;
exports.ClientesService = ClientesService = ClientesService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [supabase_service_1.SupabaseService])
], ClientesService);
//# sourceMappingURL=clientes.service.js.map