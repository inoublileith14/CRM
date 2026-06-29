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
var WorkersService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.WorkersService = void 0;
const common_1 = require("@nestjs/common");
const auth_service_1 = require("../auth/auth.service");
const users_service_1 = require("../auth/users.service");
const supabase_service_1 = require("../supabase/supabase.service");
const SELECT_FIELDS = 'id, nombre, telf, email, rol, activo, notas, profile_id, invitation_sent_at, created_at, updated_at';
const SELECT_FIELDS_LEGACY = 'id, nombre, telf, email, rol, activo, notas, created_at, updated_at';
const SELECT_LIST = `${SELECT_FIELDS}, cliente_workers(count)`;
const SELECT_LIST_LEGACY = `${SELECT_FIELDS_LEGACY}, cliente_workers(count)`;
const SELECT_DETAIL = `${SELECT_FIELDS}, cliente_workers(cliente_id, clientes(*, cliente_inmuebles(inmueble_id, gestion_estado, fecha_ultima_gestion)))`;
const SELECT_DETAIL_LEGACY = `${SELECT_FIELDS_LEGACY}, cliente_workers(cliente_id, clientes(*, cliente_inmuebles(inmueble_id, gestion_estado, fecha_ultima_gestion)))`;
const MIGRATION_HINT = 'Ejecuta supabase/migration-workers-profile.sql en el SQL Editor de Supabase.';
let WorkersService = WorkersService_1 = class WorkersService {
    supabase;
    authService;
    usersService;
    logger = new common_1.Logger(WorkersService_1.name);
    profileColumnsAvailable = null;
    constructor(supabase, authService, usersService) {
        this.supabase = supabase;
        this.authService = authService;
        this.usersService = usersService;
    }
    async findAll(activoOnly) {
        const withProfile = await this.hasProfileColumns();
        const selectQuery = withProfile ? SELECT_LIST : SELECT_LIST_LEGACY;
        let query = this.supabase
            .getAdmin()
            .from('workers')
            .select(selectQuery)
            .order('nombre', { ascending: true });
        if (activoOnly) {
            query = query.eq('activo', true);
        }
        const { data, error } = await query;
        if (error) {
            if (!withProfile && this.isMissingProfileColumns(error.message)) {
                this.profileColumnsAvailable = false;
                return this.findAll(activoOnly);
            }
            this.logger.error(`Error al listar workers: ${error.message}`);
            throw new common_1.InternalServerErrorException('No se pudieron cargar los trabajadores');
        }
        return (data ?? []).map((row) => this.mapWithCount(row));
    }
    async findIdByProfileId(profileId) {
        const withProfile = await this.hasProfileColumns();
        if (!withProfile) {
            return null;
        }
        const { data, error } = await this.supabase
            .getAdmin()
            .from('workers')
            .select('id')
            .eq('profile_id', profileId)
            .maybeSingle();
        if (error) {
            this.logger.error(`Error al buscar worker por profile ${profileId}: ${error.message}`);
            throw new common_1.InternalServerErrorException('No se pudo resolver el trabajador del usuario');
        }
        return data?.id ?? null;
    }
    async findOne(id) {
        const withProfile = await this.hasProfileColumns();
        const selectQuery = withProfile ? SELECT_DETAIL : SELECT_DETAIL_LEGACY;
        const { data, error } = await this.supabase
            .getAdmin()
            .from('workers')
            .select(selectQuery)
            .eq('id', id)
            .maybeSingle();
        if (error) {
            if (!withProfile && this.isMissingProfileColumns(error.message)) {
                this.profileColumnsAvailable = false;
                return this.findOne(id);
            }
            this.logger.error(`Error al buscar worker ${id}: ${error.message}`);
            throw new common_1.InternalServerErrorException('No se pudo cargar el trabajador');
        }
        if (!data) {
            throw new common_1.NotFoundException('Trabajador no encontrado');
        }
        return this.mapWithClientes(data);
    }
    async create(dto) {
        const nombre = dto.nombre?.trim();
        const email = dto.email?.trim().toLowerCase();
        if (!nombre) {
            throw new common_1.BadRequestException({
                message: 'El nombre es obligatorio',
                code: 'NAME_REQUIRED',
            });
        }
        if (!email) {
            throw new common_1.BadRequestException({
                message: 'El email es obligatorio para crear el usuario y enviar la invitación',
                code: 'EMAIL_REQUIRED',
            });
        }
        if (!(await this.hasProfileColumns())) {
            throw new common_1.BadRequestException({
                message: `No se puede crear el usuario del trabajador. ${MIGRATION_HINT}`,
                code: 'WORKERS_PROFILE_MIGRATION_REQUIRED',
            });
        }
        const { profileId, invitationSentAt, createdNewAuthUser } = await this.resolveUserForWorker(email, nombre, dto.rol);
        const insertPayload = {
            nombre,
            telf: dto.telf?.trim() || null,
            email,
            rol: dto.rol ?? 'asesor',
            activo: dto.activo ?? true,
            notas: dto.notas?.trim() || null,
            profile_id: profileId,
            invitation_sent_at: invitationSentAt,
        };
        const { data, error } = await this.supabase
            .getAdmin()
            .from('workers')
            .insert(insertPayload)
            .select(SELECT_FIELDS)
            .single();
        if (error) {
            this.logger.error(`Error al crear worker: ${error.message}`);
            if (createdNewAuthUser) {
                await this.authService.rollbackNewAuthUser(profileId);
            }
            if (this.isMissingProfileColumns(error.message)) {
                throw new common_1.InternalServerErrorException(`Falta migración en Supabase. ${MIGRATION_HINT}`);
            }
            throw new common_1.InternalServerErrorException('No se pudo crear el trabajador');
        }
        const worker = this.withProfileDefaults(data);
        if (!worker.profile_id) {
            this.logger.error(`Trabajador ${worker.id} guardado sin profile_id (${email})`);
            throw new common_1.InternalServerErrorException('El trabajador se creó sin vincular usuario. Inténtalo de nuevo');
        }
        return {
            ...worker,
            clientes_count: 0,
        };
    }
    async update(id, dto) {
        const existing = await this.findOne(id);
        const payload = {
            ...dto,
            updated_at: new Date().toISOString(),
        };
        if (dto.nombre !== undefined) {
            payload.nombre = dto.nombre.trim();
        }
        if (dto.email !== undefined) {
            payload.email = dto.email?.trim().toLowerCase() || null;
        }
        if (dto.telf !== undefined) {
            payload.telf = dto.telf?.trim() || null;
        }
        if (dto.notas !== undefined) {
            payload.notas = dto.notas?.trim() || null;
        }
        const newEmail = dto.email !== undefined
            ? dto.email?.trim().toLowerCase() || null
            : existing.email;
        const emailForAccount = newEmail ?? existing.email;
        if (!existing.profile_id && emailForAccount) {
            if (!(await this.hasProfileColumns())) {
                throw new common_1.BadRequestException({
                    message: `No se puede vincular usuario al trabajador. ${MIGRATION_HINT}`,
                    code: 'WORKERS_PROFILE_MIGRATION_REQUIRED',
                });
            }
            const { profileId, invitationSentAt } = await this.resolveUserForWorker(emailForAccount, payload.nombre ?? existing.nombre, payload.rol ?? existing.rol);
            payload.profile_id = profileId;
            payload.invitation_sent_at = invitationSentAt;
        }
        if ((await this.hasProfileColumns()) &&
            existing.profile_id &&
            (dto.rol !== undefined || dto.nombre !== undefined)) {
            const profileRol = this.mapWorkerRolToProfileRol(dto.rol ?? existing.rol);
            await this.usersService.updateProfile(existing.profile_id, {
                ...(dto.nombre !== undefined
                    ? { nombre: payload.nombre ?? existing.nombre }
                    : {}),
                rol: profileRol,
            });
        }
        const withProfile = await this.hasProfileColumns();
        const selectQuery = withProfile ? SELECT_FIELDS : SELECT_FIELDS_LEGACY;
        const { data, error } = await this.supabase
            .getAdmin()
            .from('workers')
            .update(payload)
            .eq('id', id)
            .select(selectQuery)
            .single();
        if (error) {
            this.logger.error(`Error al actualizar worker ${id}: ${error.message}`);
            throw new common_1.InternalServerErrorException('No se pudo actualizar el trabajador');
        }
        return this.withProfileDefaults(data);
    }
    async resendInvitation(id) {
        const worker = await this.findOne(id);
        if (!worker.email) {
            throw new common_1.BadRequestException({
                message: 'El trabajador no tiene email',
                code: 'EMAIL_REQUIRED',
            });
        }
        if (!worker.profile_id) {
            throw new common_1.BadRequestException({
                message: 'El trabajador no tiene cuenta de usuario vinculada',
                code: 'PROFILE_NOT_LINKED',
            });
        }
        await this.authService.resendInvitation(worker.email);
        const { error } = await this.supabase
            .getAdmin()
            .from('workers')
            .update({
            invitation_sent_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
        })
            .eq('id', id);
        if (error) {
            this.logger.warn(`Invitación reenviada pero no se actualizó invitation_sent_at: ${error.message}`);
        }
        return { mensaje: 'Invitación reenviada correctamente' };
    }
    async remove(id) {
        await this.findOne(id);
        const { error } = await this.supabase
            .getAdmin()
            .from('workers')
            .delete()
            .eq('id', id);
        if (error) {
            this.logger.error(`Error al eliminar worker ${id}: ${error.message}`);
            throw new common_1.InternalServerErrorException('No se pudo eliminar el trabajador');
        }
        return { mensaje: 'Trabajador eliminado correctamente' };
    }
    isMissingProfileColumns(message) {
        return (message.includes('profile_id') &&
            (message.includes('does not exist') ||
                message.includes('column') ||
                message.includes('42703')));
    }
    async hasProfileColumns() {
        if (this.profileColumnsAvailable !== null) {
            return this.profileColumnsAvailable;
        }
        const { error } = await this.supabase
            .getAdmin()
            .from('workers')
            .select('profile_id')
            .limit(1);
        if (error && this.isMissingProfileColumns(error.message)) {
            this.profileColumnsAvailable = false;
            this.logger.warn(MIGRATION_HINT);
            return false;
        }
        this.profileColumnsAvailable = true;
        return true;
    }
    mapWorkerRolToProfileRol(rol) {
        if (rol === 'admin' || rol === 'administracion')
            return 'admin';
        return 'asesor';
    }
    async assertProfileNotLinked(profileId) {
        const { data, error } = await this.supabase
            .getAdmin()
            .from('workers')
            .select('id, nombre')
            .eq('profile_id', profileId)
            .maybeSingle();
        if (error) {
            this.logger.error(`Error al comprobar profile_id en workers: ${error.message}`);
            throw new common_1.InternalServerErrorException('No se pudo validar el usuario vinculado');
        }
        if (data) {
            throw new common_1.ConflictException({
                message: 'Ese usuario ya está vinculado a otro trabajador',
                code: 'PROFILE_ALREADY_LINKED',
            });
        }
    }
    async resolveUserForWorker(email, nombre, workerRol) {
        const existingProfile = await this.usersService.findByEmail(email);
        if (existingProfile) {
            await this.assertProfileNotLinked(existingProfile.id);
            return {
                profileId: existingProfile.id,
                invitationSentAt: null,
                createdNewAuthUser: false,
            };
        }
        const profileRol = this.mapWorkerRolToProfileRol(workerRol);
        const { userId, invitationSent, createdNewAuthUser } = await this.authService.provisionWorkerAccount({
            email,
            nombre,
            rol: profileRol,
        });
        return {
            profileId: userId,
            invitationSentAt: invitationSent ? new Date().toISOString() : null,
            createdNewAuthUser,
        };
    }
    mapWithCount(row) {
        const clienteWorkers = row.cliente_workers;
        const { cliente_workers: _omit, ...rest } = row;
        return {
            ...this.withProfileDefaults(rest),
            clientes_count: clienteWorkers?.[0]?.count ?? 0,
        };
    }
    mapWithClientes(row) {
        const clienteWorkers = row.cliente_workers;
        const { cliente_workers: _omit, ...rest } = row;
        const clientes = (clienteWorkers ?? [])
            .map((link) => {
            const raw = link.clientes;
            if (!raw)
                return null;
            const links = raw.cliente_inmuebles ?? [];
            const { cliente_inmuebles: _ci, ...clienteRest } = raw;
            const inmuebleGestionLinks = links.map((item) => ({
                inmueble_id: item.inmueble_id,
                gestion_estado: item.gestion_estado,
                fecha_ultima_gestion: item.fecha_ultima_gestion,
            }));
            return {
                ...clienteRest,
                inmueble_ids: links.map((item) => item.inmueble_id),
                inmuebles_count: links.length,
                inmueble_gestion_links: inmuebleGestionLinks,
                gestion_estado: this.pickPrimaryGestionEstado(links, clienteRest.tipo_operacion),
            };
        })
            .filter((cliente) => cliente != null);
        return {
            ...this.withProfileDefaults(rest),
            clientes_count: clientes.length,
            clientes,
        };
    }
    pickPrimaryGestionEstado(links, tipo) {
        const priority = {
            ya_compro: 100,
            ya_encontro_piso: 100,
            reservado: 95,
            visita_concertada: 90,
            pendiente_cuadrar_docs: 75,
            pendiente_cuadrar_visita: 75,
            videollamada: 70,
            gestionando: 60,
            gestionando_w: 60,
            nc: 40,
            perfil_no_encaja: 20,
            no_gestionando: 10,
            no_gestionado: 10,
        };
        let best = null;
        let bestScore = -1;
        for (const link of links) {
            const estado = link.gestion_estado;
            if (!estado)
                continue;
            const score = priority[estado] ?? 30;
            if (score > bestScore) {
                bestScore = score;
                best = estado;
            }
        }
        if (best) {
            return best;
        }
        if (tipo === 'venta')
            return 'no_gestionado';
        if (tipo === 'alquiler')
            return 'no_gestionando';
        return null;
    }
    withProfileDefaults(rest) {
        return {
            ...rest,
            profile_id: rest.profile_id ?? null,
            invitation_sent_at: rest.invitation_sent_at ?? null,
        };
    }
};
exports.WorkersService = WorkersService;
exports.WorkersService = WorkersService = WorkersService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [supabase_service_1.SupabaseService,
        auth_service_1.AuthService,
        users_service_1.UsersService])
], WorkersService);
//# sourceMappingURL=workers.service.js.map