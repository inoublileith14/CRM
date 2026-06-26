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
var InmueblesService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.InmueblesService = void 0;
const common_1 = require("@nestjs/common");
const cliente_gestion_estado_1 = require("../clientes/cliente-gestion-estado");
const supabase_service_1 = require("../supabase/supabase.service");
const inmueble_propietarios_util_1 = require("./inmueble-propietarios.util");
const cliente_entrada_sort_util_1 = require("./cliente-entrada-sort.util");
const inmueble_split_fields_1 = require("./inmueble-split-fields");
const SELECT_FIELDS = 'id, ref, fecha_entrada_inmueble, imagen_real, direccion_piso_real, foto_espejo, espejo_direccion, barrio_distrito, distrito_ciudad, precio, precio_espejo, hab, banos, metros, larga_estancia_temporada, propietario_id, propietarios_contactos, nombre_propi, telf, ficha_del_piso_real, link_idealista, link_espejo, link_idealista_espejo, fecha_visitas, fecha_visitas_entrada, observaciones, requisitos_propietario, amueblado, captador, alquilado_por, captador_alquilado_por, status, row_color, tipo_operacion, created_at, updated_at';
const SELECT_DETAIL = `${SELECT_FIELDS}, cliente_inmuebles(cliente_id, gestion_estado, fecha_ultima_gestion, clientes(id, nombre, email, telefono, ciudad, estado, origen, estado_contacto, ref_cliente, fecha_contacto, fecha_ultima_gestion, presupuesto_maximo, banos, notas, created_at, updated_at, cliente_workers(worker_id, workers(id, nombre, rol))))`;
const CLIENTE_GLOBAL_FIELDS = `
  id,
  nombre,
  email,
  telefono,
  ciudad,
  estado,
  origen,
  estado_contacto,
  ref_cliente,
  fecha_contacto,
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
async function fetchAll(queryFactory, pageSize = 1000) {
    const all = [];
    for (let from = 0;; from += pageSize) {
        const to = from + pageSize - 1;
        const { data, error } = await queryFactory(from, to);
        if (error) {
            throw new Error(error.message || JSON.stringify(error));
        }
        const chunk = data ?? [];
        all.push(...chunk);
        if (chunk.length < pageSize)
            break;
    }
    return all;
}
function chunkArray(items, size) {
    if (size <= 0)
        return [items];
    const chunks = [];
    for (let i = 0; i < items.length; i += size) {
        chunks.push(items.slice(i, i + size));
    }
    return chunks;
}
const HYDRATE_LINKED_FULL_SCAN_THRESHOLD = 120;
const HYDRATE_LINKED_IN_BATCH_SIZE = 80;
const HYDRATE_UNLINKED_IN_BATCH_SIZE = 200;
let InmueblesService = class InmueblesService {
    static { InmueblesService_1 = this; }
    supabase;
    logger = new common_1.Logger(InmueblesService_1.name);
    clientesByTipoIndexCache = new Map();
    static INDEX_CACHE_TTL_MS = 60_000;
    constructor(supabase) {
        this.supabase = supabase;
    }
    async findAll(filters) {
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
            throw new common_1.InternalServerErrorException('No se pudieron cargar los inmuebles');
        }
        return data ?? [];
    }
    async findClientesByTipoOperacion(tipoOperacion) {
        const defaultGestion = (0, cliente_gestion_estado_1.getDefaultClienteGestionEstado)(tipoOperacion);
        const rows = [];
        let linkedLinks = [];
        try {
            linkedLinks = await fetchAll((from, to) => this.supabase
                .getAdmin()
                .from('cliente_inmuebles')
                .select(CLIENTE_INMUEBLE_LINK_SELECT)
                .eq('inmuebles.tipo_operacion', tipoOperacion)
                .range(from, to));
        }
        catch (e) {
            const message = e instanceof Error ? e.message : String(e);
            if (this.isMissingClienteInmuebles(message)) {
                return [];
            }
            this.logger.error(`Error al listar clientes vinculados por tipo ${tipoOperacion}: ${message}`);
            throw new common_1.InternalServerErrorException('No se pudieron cargar los clientes');
        }
        const linkedClienteIds = new Set();
        for (const linkRow of linkedLinks) {
            const mapped = this.mapLinkedClienteRow(linkRow, defaultGestion);
            if (!mapped)
                continue;
            linkedClienteIds.add(mapped.cliente.id);
            rows.push(mapped);
        }
        let rawClientes = [];
        try {
            rawClientes = await fetchAll((from, to) => this.supabase
                .getAdmin()
                .from('clientes')
                .select(CLIENTE_UNLINKED_SELECT)
                .eq('tipo_operacion', tipoOperacion)
                .range(from, to));
        }
        catch (e) {
            const message = e instanceof Error ? e.message : String(e);
            this.logger.error(`Error al listar clientes sin inmueble (${tipoOperacion}): ${message}`);
            throw new common_1.InternalServerErrorException('No se pudieron cargar los clientes');
        }
        for (const row of rawClientes ?? []) {
            const clienteInmuebles = (row.cliente_inmuebles ?? []);
            if (linkedClienteIds.has(row.id) || clienteInmuebles.length > 0) {
                continue;
            }
            const { cliente_inmuebles: _ci, ...rest } = row;
            const cliente = {
                ...rest,
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
    async findClientesByTipoOperacionPaginated(tipoOperacion, query) {
        const page = Math.max(1, query.page);
        const limit = Math.min(Math.max(1, query.limit), MAX_CLIENTES_BY_TIPO_LIMIT);
        const sortDir = query.sort === 'fecha_entrada' && query.dir === 'asc' ? 'asc' : 'desc';
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
        const defaultGestion = (0, cliente_gestion_estado_1.getDefaultClienteGestionEstado)(tipoOperacion);
        const rows = await this.hydrateClientesByTipoPage(slice, tipoOperacion, defaultGestion);
        return { rows, total, page, limit };
    }
    async buildClientesByTipoIndex(tipoOperacion) {
        const cacheKey = tipoOperacion;
        const cached = this.clientesByTipoIndexCache.get(cacheKey);
        if (cached && cached.expiresAt > Date.now()) {
            return cached.items;
        }
        const items = [];
        const linkedClienteIds = new Set();
        let linkedIndex = [];
        try {
            linkedIndex = await fetchAll((from, to) => this.supabase
                .getAdmin()
                .from('cliente_inmuebles')
                .select(LINK_INDEX_SELECT)
                .eq('inmuebles.tipo_operacion', tipoOperacion)
                .range(from, to));
        }
        catch (e) {
            const message = e instanceof Error ? e.message : String(e);
            if (this.isMissingClienteInmuebles(message)) {
                return [];
            }
            this.logger.error(`Error al indexar clientes vinculados (${tipoOperacion}): ${message}`);
            throw new common_1.InternalServerErrorException('No se pudieron cargar los clientes');
        }
        for (const linkRow of linkedIndex) {
            const inmuebleId = linkRow.inmueble_id;
            const clienteId = linkRow.cliente_id;
            const clienteRaw = linkRow.clientes;
            if (!inmuebleId || !clienteId)
                continue;
            linkedClienteIds.add(clienteId);
            items.push({
                row_key: `${inmuebleId}-${clienteId}`,
                cliente_id: clienteId,
                inmueble_id: inmuebleId,
                sort_key: (0, cliente_entrada_sort_util_1.getClienteEntradaSortKey)(clienteRaw?.fecha_contacto ?? null),
            });
        }
        let rawClientes = [];
        try {
            rawClientes = await fetchAll((from, to) => this.supabase
                .getAdmin()
                .from('clientes')
                .select(UNLINKED_INDEX_SELECT)
                .eq('tipo_operacion', tipoOperacion)
                .range(from, to));
        }
        catch (e) {
            const message = e instanceof Error ? e.message : String(e);
            this.logger.error(`Error al indexar clientes sin inmueble (${tipoOperacion}): ${message}`);
            throw new common_1.InternalServerErrorException('No se pudieron cargar los clientes');
        }
        for (const row of rawClientes) {
            const clienteId = row.id;
            const clienteInmuebles = (row.cliente_inmuebles ?? []);
            if (linkedClienteIds.has(clienteId) || clienteInmuebles.length > 0) {
                continue;
            }
            items.push({
                row_key: `unlinked-${clienteId}`,
                cliente_id: clienteId,
                inmueble_id: null,
                sort_key: (0, cliente_entrada_sort_util_1.getClienteEntradaSortKey)(row.fecha_contacto),
            });
        }
        this.clientesByTipoIndexCache.set(cacheKey, {
            items,
            expiresAt: Date.now() + InmueblesService_1.INDEX_CACHE_TTL_MS,
        });
        return items;
    }
    async hydrateClientesByTipoPage(slice, tipoOperacion, defaultGestion) {
        if (slice.length === 0)
            return [];
        const linkedItems = slice.filter((item) => item.inmueble_id);
        const unlinkedIds = slice
            .filter((item) => !item.inmueble_id)
            .map((item) => item.cliente_id);
        const rowByKey = new Map();
        if (linkedItems.length > 0) {
            const pairKeys = new Set(linkedItems.map((item) => `${item.inmueble_id}:${item.cliente_id}`));
            let linkedRows = [];
            try {
                linkedRows = await this.fetchLinkedRowsForHydration(tipoOperacion, linkedItems, pairKeys);
            }
            catch (e) {
                const message = e instanceof Error ? e.message : String(e);
                this.logger.error(`Error al hidratar clientes vinculados (${tipoOperacion}): ${message || '(sin detalle)'}`);
                throw new common_1.InternalServerErrorException('No se pudieron cargar los clientes');
            }
            for (const linkRow of linkedRows) {
                const inmuebleId = linkRow.inmueble_id;
                const clienteId = linkRow.cliente_id;
                if (!inmuebleId || !clienteId)
                    continue;
                if (!pairKeys.has(`${inmuebleId}:${clienteId}`))
                    continue;
                const mapped = this.mapLinkedClienteRow(linkRow, defaultGestion);
                if (mapped)
                    rowByKey.set(mapped.row_key, mapped);
            }
        }
        if (unlinkedIds.length > 0) {
            let unlinkedRows = [];
            try {
                unlinkedRows = await this.fetchClientesByIds(unlinkedIds);
            }
            catch (e) {
                const message = e instanceof Error ? e.message : String(e);
                this.logger.error(`Error al hidratar clientes sin inmueble (${tipoOperacion}): ${message || '(sin detalle)'}`);
                throw new common_1.InternalServerErrorException('No se pudieron cargar los clientes');
            }
            for (const row of unlinkedRows) {
                const cliente = {
                    ...row,
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
            .filter((row) => row != null);
    }
    async fetchLinkedRowsForHydration(tipoOperacion, linkedItems, pairKeys) {
        const fetchByTipo = () => fetchAll((from, to) => this.supabase
            .getAdmin()
            .from('cliente_inmuebles')
            .select(CLIENTE_INMUEBLE_LINK_SELECT)
            .eq('inmuebles.tipo_operacion', tipoOperacion)
            .range(from, to));
        if (linkedItems.length > HYDRATE_LINKED_FULL_SCAN_THRESHOLD) {
            const all = await fetchByTipo();
            return all.filter((linkRow) => {
                const inmuebleId = linkRow.inmueble_id;
                const clienteId = linkRow.cliente_id;
                return (Boolean(inmuebleId && clienteId) &&
                    pairKeys.has(`${inmuebleId}:${clienteId}`));
            });
        }
        const linkedRows = [];
        const seen = new Set();
        for (const batch of chunkArray(linkedItems, HYDRATE_LINKED_IN_BATCH_SIZE)) {
            const clienteIds = [...new Set(batch.map((item) => item.cliente_id))];
            const inmuebleIds = [
                ...new Set(batch.map((item) => item.inmueble_id)),
            ];
            const batchRows = await fetchAll((from, to) => this.supabase
                .getAdmin()
                .from('cliente_inmuebles')
                .select(CLIENTE_INMUEBLE_LINK_SELECT)
                .eq('inmuebles.tipo_operacion', tipoOperacion)
                .in('cliente_id', clienteIds)
                .in('inmueble_id', inmuebleIds)
                .range(from, to));
            for (const linkRow of batchRows) {
                const inmuebleId = linkRow.inmueble_id;
                const clienteId = linkRow.cliente_id;
                if (!inmuebleId || !clienteId)
                    continue;
                const key = `${inmuebleId}:${clienteId}`;
                if (!pairKeys.has(key) || seen.has(key))
                    continue;
                seen.add(key);
                linkedRows.push(linkRow);
            }
        }
        return linkedRows;
    }
    async fetchClientesByIds(ids) {
        const rows = [];
        for (const batch of chunkArray(ids, HYDRATE_UNLINKED_IN_BATCH_SIZE)) {
            const { data, error } = await this.supabase
                .getAdmin()
                .from('clientes')
                .select(CLIENTE_GLOBAL_FIELDS)
                .in('id', batch);
            if (error) {
                throw new Error(error.message || JSON.stringify(error));
            }
            rows.push(...(data ?? []));
        }
        return rows;
    }
    mapLinkedClienteRow(linkRow, defaultGestion) {
        const inmueble = linkRow.inmuebles;
        const clienteRaw = linkRow.clientes;
        if (!inmueble?.id || !clienteRaw?.id)
            return null;
        const cliente = {
            ...clienteRaw,
            fecha_ultima_gestion: clienteRaw.fecha_ultima_gestion ??
                linkRow.fecha_ultima_gestion ??
                null,
            gestion_estado: linkRow.gestion_estado ?? defaultGestion,
            inmueble_ids: [inmueble.id],
            worker_ids: [],
            inmuebles_count: 1,
            workers_count: 0,
            workers: [],
        };
        const label = inmueble.direccion_piso_real ||
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
    mapCliente(row) {
        const clienteInmuebles = (row.cliente_inmuebles ?? []);
        const clienteWorkers = (row.cliente_workers ?? []);
        const workers = (clienteWorkers
            .map((r) => r.workers)
            .filter(Boolean) ?? []);
        const { cliente_inmuebles: _ci, cliente_workers: _cw, ...rest } = row;
        return {
            ...rest,
            inmueble_ids: clienteInmuebles.map((r) => r.inmueble_id),
            worker_ids: clienteWorkers.map((r) => r.worker_id),
            inmuebles_count: clienteInmuebles.length,
            workers_count: workers.length,
            workers,
            gestion_estado: null,
        };
    }
    async findOne(id) {
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
            throw new common_1.InternalServerErrorException('No se pudo cargar el inmueble');
        }
        if (!data) {
            throw new common_1.NotFoundException('Inmueble no encontrado');
        }
        return this.mapWithClientes(data);
    }
    async findOneWithoutClientes(id) {
        const { data, error } = await this.supabase
            .getAdmin()
            .from('inmuebles')
            .select(SELECT_FIELDS)
            .eq('id', id)
            .maybeSingle();
        if (error) {
            this.logger.error(`Error al buscar inmueble ${id}: ${error.message}`);
            throw new common_1.InternalServerErrorException('No se pudo cargar el inmueble');
        }
        if (!data) {
            throw new common_1.NotFoundException('Inmueble no encontrado');
        }
        return { ...data, clientes: [], clientes_count: 0 };
    }
    isMissingClienteInmuebles(message) {
        return (message.includes('cliente_inmuebles') &&
            (message.includes('does not exist') ||
                message.includes('Could not find') ||
                message.includes('schema cache')));
    }
    async create(dto) {
        const ownerFields = (0, inmueble_propietarios_util_1.normalizePropietariosContactos)(dto);
        const payload = (0, inmueble_split_fields_1.normalizeInmuebleSplitFields)({
            ...dto,
            ...ownerFields,
        });
        const { data, error } = await this.supabase
            .getAdmin()
            .from('inmuebles')
            .insert(payload)
            .select(SELECT_FIELDS)
            .single();
        if (error) {
            this.logger.error(`Error al crear inmueble: ${error.message}`);
            throw new common_1.InternalServerErrorException('No se pudo crear el inmueble');
        }
        return data;
    }
    async update(id, dto) {
        await this.findOne(id);
        const ownerFields = dto.propietarios_contactos !== undefined ||
            dto.nombre_propi !== undefined ||
            dto.telf !== undefined
            ? (0, inmueble_propietarios_util_1.normalizePropietariosContactos)(dto)
            : {};
        const { data, error } = await this.supabase
            .getAdmin()
            .from('inmuebles')
            .update((0, inmueble_split_fields_1.normalizeInmuebleSplitFields)({
            ...dto,
            ...ownerFields,
            updated_at: new Date().toISOString(),
        }))
            .eq('id', id)
            .select(SELECT_FIELDS)
            .single();
        if (error) {
            this.logger.error(`Error al actualizar inmueble ${id}: ${error.message}`);
            throw new common_1.InternalServerErrorException('No se pudo actualizar el inmueble');
        }
        return data;
    }
    async updateClienteGestionEstado(inmuebleId, clienteId, gestionEstado) {
        const inmueble = await this.findOne(inmuebleId);
        const tipo = inmueble.tipo_operacion;
        if (tipo !== 'alquiler' && tipo !== 'venta') {
            throw new common_1.BadRequestException('Tipo de inmueble no válido');
        }
        if (!(0, cliente_gestion_estado_1.isClienteGestionEstadoForTipo)(gestionEstado, tipo)) {
            throw new common_1.BadRequestException('Estado de gestión no válido');
        }
        const linked = inmueble.clientes?.some((c) => c.id === clienteId);
        if (!linked) {
            throw new common_1.NotFoundException('El cliente no está vinculado a este inmueble');
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
            this.logger.error(`Error al actualizar gestión cliente ${clienteId} en inmueble ${inmuebleId}: ${error.message}`);
            throw new common_1.InternalServerErrorException('No se pudo actualizar el estado de gestión');
        }
        if (!data) {
            throw new common_1.NotFoundException('No se encontró la relación cliente–inmueble');
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
            gestion_estado: data.gestion_estado ??
                (0, cliente_gestion_estado_1.getDefaultClienteGestionEstado)(tipo),
            fecha_ultima_gestion: data.fecha_ultima_gestion ?? now,
        };
    }
    async updateClienteFechaUltimaGestion(inmuebleId, clienteId, fechaUltimaGestion) {
        const inmueble = await this.findOne(inmuebleId);
        const linked = inmueble.clientes?.some((c) => c.id === clienteId);
        if (!linked) {
            throw new common_1.NotFoundException('El cliente no está vinculado a este inmueble');
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
            this.logger.error(`Error al actualizar fecha última gestión cliente ${clienteId} en inmueble ${inmuebleId}: ${error.message}`);
            throw new common_1.InternalServerErrorException('No se pudo actualizar la fecha de última gestión');
        }
        if (!data) {
            throw new common_1.NotFoundException('No se encontró la relación cliente–inmueble');
        }
        return {
            fecha_ultima_gestion: data.fecha_ultima_gestion ?? null,
        };
    }
    async remove(id) {
        await this.findOne(id);
        const { error } = await this.supabase
            .getAdmin()
            .from('inmuebles')
            .delete()
            .eq('id', id);
        if (error) {
            this.logger.error(`Error al eliminar inmueble ${id}: ${error.message}`);
            throw new common_1.InternalServerErrorException('No se pudo eliminar el inmueble');
        }
        return { mensaje: 'Inmueble eliminado correctamente' };
    }
    mapWithClientes(row) {
        const clienteInmuebles = row.cliente_inmuebles;
        const { cliente_inmuebles: _omit, ...rest } = row;
        const tipoOperacion = rest
            .tipo_operacion;
        const defaultGestion = tipoOperacion === 'alquiler' || tipoOperacion === 'venta'
            ? (0, cliente_gestion_estado_1.getDefaultClienteGestionEstado)(tipoOperacion)
            : 'no_gestionando';
        const clientes = (clienteInmuebles ?? [])
            .map((link) => {
            const cliente = link.clientes;
            if (!cliente)
                return null;
            const clienteWorkers = cliente.cliente_workers ?? [];
            const workers = clienteWorkers
                .map((cw) => cw.workers)
                .filter((worker) => worker != null);
            const { cliente_workers: _cw, ...rest } = cliente;
            return {
                ...rest,
                gestion_estado: link.gestion_estado ?? defaultGestion,
                fecha_ultima_gestion: rest.fecha_ultima_gestion ??
                    link.fecha_ultima_gestion ??
                    null,
                worker_ids: clienteWorkers.map((cw) => cw.worker_id),
                workers,
                workers_count: workers.length,
            };
        })
            .filter((cliente) => cliente != null);
        return {
            ...rest,
            clientes_count: clientes.length,
            clientes,
        };
    }
};
exports.InmueblesService = InmueblesService;
exports.InmueblesService = InmueblesService = InmueblesService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [supabase_service_1.SupabaseService])
], InmueblesService);
//# sourceMappingURL=inmuebles.service.js.map