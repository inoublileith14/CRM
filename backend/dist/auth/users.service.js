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
var UsersService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.UsersService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const supabase_service_1 = require("../supabase/supabase.service");
const SELECT_FIELDS = 'id, email, nombre, rol, avatar_url';
const SELECT_FIELDS_LEGACY = 'id, email, nombre, rol';
const MIGRATION_HINT = 'Ejecuta supabase/migration-profiles-avatar.sql en el SQL Editor de Supabase.';
let UsersService = UsersService_1 = class UsersService {
    supabase;
    config;
    logger = new common_1.Logger(UsersService_1.name);
    avatarColumnAvailable = null;
    constructor(supabase, config) {
        this.supabase = supabase;
        this.config = config;
    }
    async onModuleInit() {
        await this.seedAdmin();
    }
    async findById(id) {
        const withAvatar = await this.hasAvatarColumn();
        if (withAvatar) {
            const { data, error } = await this.supabase
                .getAdmin()
                .from('profiles')
                .select(SELECT_FIELDS)
                .eq('id', id)
                .maybeSingle();
            if (error) {
                if (this.isMissingAvatarColumn(error.message)) {
                    this.avatarColumnAvailable = false;
                    return this.findById(id);
                }
                this.logger.error(`Error al buscar usuario ${id}: ${error.message}`);
                return null;
            }
            return data
                ? this.mapProfile(data)
                : null;
        }
        const { data, error } = await this.supabase
            .getAdmin()
            .from('profiles')
            .select(SELECT_FIELDS_LEGACY)
            .eq('id', id)
            .maybeSingle();
        if (error) {
            this.logger.error(`Error al buscar usuario ${id}: ${error.message}`);
            return null;
        }
        return data
            ? this.mapProfile(data)
            : null;
    }
    async updateProfile(id, data) {
        const withAvatar = await this.hasAvatarColumn();
        if (!withAvatar && data.avatar_url !== undefined) {
            throw new common_1.BadRequestException({
                message: `La foto de perfil no está disponible. ${MIGRATION_HINT}`,
                code: 'AVATAR_COLUMN_MISSING',
            });
        }
        if (withAvatar) {
            const { data: updated, error } = await this.supabase
                .getAdmin()
                .from('profiles')
                .update(data)
                .eq('id', id)
                .select(SELECT_FIELDS)
                .maybeSingle();
            if (error) {
                if (this.isMissingAvatarColumn(error.message)) {
                    this.avatarColumnAvailable = false;
                    return this.updateProfile(id, data);
                }
                this.logger.error(`Error al actualizar perfil ${id}: ${error.message}`);
                throw error;
            }
            return updated
                ? this.mapProfile(updated)
                : null;
        }
        const legacyPayload = {};
        if (data.nombre !== undefined)
            legacyPayload.nombre = data.nombre;
        if (data.rol !== undefined)
            legacyPayload.rol = data.rol;
        const { data: updated, error } = await this.supabase
            .getAdmin()
            .from('profiles')
            .update(legacyPayload)
            .eq('id', id)
            .select(SELECT_FIELDS_LEGACY)
            .maybeSingle();
        if (error) {
            this.logger.error(`Error al actualizar perfil ${id}: ${error.message}`);
            throw error;
        }
        return updated
            ? this.mapProfile(updated)
            : null;
    }
    async createProfile(profile) {
        const withAvatar = await this.hasAvatarColumn();
        const insertPayload = withAvatar
            ? profile
            : {
                id: profile.id,
                email: profile.email,
                nombre: profile.nombre,
                rol: profile.rol,
            };
        const { error } = await this.supabase
            .getAdmin()
            .from('profiles')
            .insert(insertPayload);
        if (error) {
            this.logger.error(`Error al crear perfil: ${error.message}`);
            throw error;
        }
    }
    async findByEmail(email) {
        const withAvatar = await this.hasAvatarColumn();
        if (withAvatar) {
            const { data, error } = await this.supabase
                .getAdmin()
                .from('profiles')
                .select(SELECT_FIELDS)
                .eq('email', email)
                .maybeSingle();
            if (error) {
                if (this.isMissingAvatarColumn(error.message)) {
                    this.avatarColumnAvailable = false;
                    return this.findByEmail(email);
                }
                this.logger.error(`Error al buscar email ${email}: ${error.message}`);
                return null;
            }
            return data
                ? this.mapProfile(data)
                : null;
        }
        const { data, error } = await this.supabase
            .getAdmin()
            .from('profiles')
            .select(SELECT_FIELDS_LEGACY)
            .eq('email', email)
            .maybeSingle();
        if (error) {
            this.logger.error(`Error al buscar email ${email}: ${error.message}`);
            return null;
        }
        return data
            ? this.mapProfile(data)
            : null;
    }
    isMissingAvatarColumn(message) {
        return (message.includes('avatar_url') &&
            (message.includes('does not exist') ||
                message.includes('Could not find') ||
                message.includes('column') ||
                message.includes('schema cache')));
    }
    async hasAvatarColumn() {
        if (this.avatarColumnAvailable !== null) {
            return this.avatarColumnAvailable;
        }
        const { error } = await this.supabase
            .getAdmin()
            .from('profiles')
            .select('avatar_url')
            .limit(1);
        if (error && this.isMissingAvatarColumn(error.message)) {
            this.avatarColumnAvailable = false;
            this.logger.warn(MIGRATION_HINT);
            return false;
        }
        this.avatarColumnAvailable = true;
        return true;
    }
    mapProfile(row) {
        return {
            id: row.id,
            email: row.email,
            nombre: row.nombre,
            rol: row.rol,
            avatar_url: row.avatar_url ?? null,
        };
    }
    async seedAdmin() {
        const email = this.config.get('ADMIN_EMAIL') ?? 'admin@cocount.com';
        const password = this.config.get('ADMIN_PASSWORD') ?? 'Cocount';
        const admin = this.supabase.getAdmin();
        const { data: listData } = await admin.auth.admin.listUsers();
        const existing = listData?.users?.find((u) => u.email === email);
        let userId = existing?.id;
        if (!existing) {
            const { data, error } = await admin.auth.admin.createUser({
                email,
                password,
                email_confirm: true,
                user_metadata: { nombre: 'Administrador', rol: 'admin' },
            });
            if (error) {
                this.logger.error(`No se pudo crear el admin: ${error.message}`);
                return;
            }
            userId = data.user.id;
            this.logger.log(`Admin creado en Supabase Auth: ${email}`);
        }
        if (!userId)
            return;
        const { error: profileError } = await admin.from('profiles').upsert({
            id: userId,
            email,
            nombre: 'Administrador',
            rol: 'admin',
        }, { onConflict: 'id' });
        if (profileError) {
            this.logger.warn(`Perfil admin no sincronizado (¿ejecutaste schema.sql?): ${profileError.message}`);
        }
        else {
            this.logger.log(`Perfil admin listo en Supabase: ${email}`);
        }
    }
};
exports.UsersService = UsersService;
exports.UsersService = UsersService = UsersService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [supabase_service_1.SupabaseService,
        config_1.ConfigService])
], UsersService);
//# sourceMappingURL=users.service.js.map