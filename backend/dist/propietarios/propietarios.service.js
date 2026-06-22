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
var PropietariosService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.PropietariosService = void 0;
const common_1 = require("@nestjs/common");
const supabase_service_1 = require("../supabase/supabase.service");
const SELECT_FIELDS = `
  id,
  nombre,
  telf,
  email,
  notas,
  tipo_operacion,
  created_at,
  updated_at
`;
let PropietariosService = PropietariosService_1 = class PropietariosService {
    supabase;
    logger = new common_1.Logger(PropietariosService_1.name);
    constructor(supabase) {
        this.supabase = supabase;
    }
    async findAll() {
        const { data, error } = await this.supabase
            .getAdmin()
            .from('propietarios')
            .select(`${SELECT_FIELDS}, inmuebles(count)`)
            .order('nombre', { ascending: true });
        if (error) {
            this.logger.error(`Error al listar propietarios: ${error.message}`);
            throw new common_1.InternalServerErrorException('No se pudieron cargar los propietarios');
        }
        return (data ?? []).map((row) => this.mapWithCount(row));
    }
    async findOne(id) {
        const { data, error } = await this.supabase
            .getAdmin()
            .from('propietarios')
            .select(`${SELECT_FIELDS}, inmuebles(*)`)
            .eq('id', id)
            .maybeSingle();
        if (error) {
            this.logger.error(`Error al buscar propietario ${id}: ${error.message}`);
            throw new common_1.InternalServerErrorException('No se pudo cargar el propietario');
        }
        if (!data) {
            throw new common_1.NotFoundException('Propietario no encontrado');
        }
        const { inmuebles, ...rest } = data;
        return {
            ...rest,
            inmuebles_count: inmuebles?.length ?? 0,
            inmuebles: (inmuebles ?? []),
        };
    }
    async create(dto) {
        const { data, error } = await this.supabase
            .getAdmin()
            .from('propietarios')
            .insert(dto)
            .select(SELECT_FIELDS)
            .single();
        if (error) {
            this.logger.error(`Error al crear propietario: ${error.message}`);
            throw new common_1.InternalServerErrorException('No se pudo crear el propietario');
        }
        return { ...data, inmuebles_count: 0 };
    }
    async findOrCreate(dto) {
        const nombre = dto.nombre.trim();
        if (!nombre) {
            throw new common_1.InternalServerErrorException('Nombre de propietario requerido');
        }
        const telf = dto.telf?.trim() || null;
        const tipoOperacion = dto.tipo_operacion ?? null;
        let query = this.supabase
            .getAdmin()
            .from('propietarios')
            .select(SELECT_FIELDS)
            .ilike('nombre', nombre);
        if (telf) {
            query = query.eq('telf', telf);
        }
        if (tipoOperacion) {
            query = query.eq('tipo_operacion', tipoOperacion);
        }
        const { data: existing, error: findError } = await query.maybeSingle();
        if (findError) {
            this.logger.error(`Error al buscar propietario: ${findError.message}`);
            throw new common_1.InternalServerErrorException('No se pudo buscar el propietario');
        }
        if (existing) {
            return existing;
        }
        return this.create({
            nombre,
            telf: telf ?? undefined,
            tipo_operacion: tipoOperacion ?? undefined,
        });
    }
    async update(id, dto) {
        await this.findOne(id);
        const { data, error } = await this.supabase
            .getAdmin()
            .from('propietarios')
            .update({ ...dto, updated_at: new Date().toISOString() })
            .eq('id', id)
            .select(SELECT_FIELDS)
            .single();
        if (error) {
            this.logger.error(`Error al actualizar propietario ${id}: ${error.message}`);
            throw new common_1.InternalServerErrorException('No se pudo actualizar el propietario');
        }
        return data;
    }
    async remove(id) {
        await this.findOne(id);
        const { error } = await this.supabase
            .getAdmin()
            .from('propietarios')
            .delete()
            .eq('id', id);
        if (error) {
            this.logger.error(`Error al eliminar propietario ${id}: ${error.message}`);
            throw new common_1.InternalServerErrorException('No se pudo eliminar el propietario');
        }
        return { mensaje: 'Propietario eliminado correctamente' };
    }
    mapWithCount(row) {
        const inmuebles = row.inmuebles;
        const { inmuebles: _omit, ...rest } = row;
        return {
            ...rest,
            inmuebles_count: inmuebles?.[0]?.count ?? 0,
        };
    }
};
exports.PropietariosService = PropietariosService;
exports.PropietariosService = PropietariosService = PropietariosService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [supabase_service_1.SupabaseService])
], PropietariosService);
//# sourceMappingURL=propietarios.service.js.map