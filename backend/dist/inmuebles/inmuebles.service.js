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
const SELECT_FIELDS = 'id, ref, fecha_entrada_inmueble, imagen_real, direccion_piso_real, foto_espejo, espejo_direccion, barrio_distrito, precio, precio_espejo, hab, banos, metros, larga_estancia_temporada, propietario_id, propietarios_contactos, nombre_propi, telf, ficha_del_piso_real, link_idealista_espejo, fecha_visitas_entrada, observaciones, amueblado, captador_alquilado_por, status, row_color, tipo_operacion, created_at, updated_at';
const SELECT_DETAIL = `${SELECT_FIELDS}, cliente_inmuebles(cliente_id, gestion_estado, fecha_ultima_gestion, clientes(id, nombre, email, telefono, ciudad, estado, origen, estado_contacto, ref_cliente, fecha_contacto, fecha_ultima_gestion, presupuesto_maximo, banos, notas, created_at, updated_at, cliente_workers(worker_id, workers(id, nombre, rol))))`;
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
        if (error)
            throw new Error(error.message);
        const chunk = data ?? [];
        all.push(...chunk);
        if (chunk.length < pageSize)
            break;
    }
    return all;
}
let InmueblesService = InmueblesService_1 = class InmueblesService {
    supabase;
    logger = new common_1.Logger(InmueblesService_1.name);
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
            this.logger.error(`Error al listar clientes por tipo ${tipoOperacion}: ${error.message}`);
            throw new common_1.InternalServerErrorException('No se pudieron cargar los clientes');
        }
        const rows = [];
        const linkedClienteIds = new Set();
        for (const inmuebleRow of data ?? []) {
            const inmueble = this.mapWithClientes(inmuebleRow);
            const label = inmueble.direccion_piso_real ||
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
        let rawClientes = [];
        try {
            rawClientes = await fetchAll((from, to) => this.supabase
                .getAdmin()
                .from('clientes')
                .select(CLIENTE_SELECT)
                .eq('tipo_operacion', tipoOperacion)
                .range(from, to));
        }
        catch (e) {
            const message = e instanceof Error ? e.message : String(e);
            this.logger.error(`Error al listar clientes sin inmueble (${tipoOperacion}): ${message}`);
            throw new common_1.InternalServerErrorException('No se pudieron cargar los clientes');
        }
        for (const row of rawClientes ?? []) {
            const cliente = this.mapCliente(row);
            const hasLinks = (cliente.inmueble_ids?.length ?? 0) > 0;
            if (linkedClienteIds.has(cliente.id) || hasLinks)
                continue;
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