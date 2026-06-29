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
var AuthService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const crypto_1 = require("crypto");
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const jwt_1 = require("@nestjs/jwt");
const supabase_service_1 = require("../supabase/supabase.service");
const users_service_1 = require("./users.service");
let AuthService = AuthService_1 = class AuthService {
    supabase;
    usersService;
    jwtService;
    config;
    logger = new common_1.Logger(AuthService_1.name);
    constructor(supabase, usersService, jwtService, config) {
        this.supabase = supabase;
        this.usersService = usersService;
        this.jwtService = jwtService;
        this.config = config;
    }
    async login(dto) {
        const { data, error } = await this.supabase
            .getAnon()
            .auth.signInWithPassword({
            email: dto.email.trim().toLowerCase(),
            password: dto.password,
        });
        if (error) {
            throw new common_1.UnauthorizedException(this.mapAuthError(error));
        }
        if (!data.user) {
            throw new common_1.UnauthorizedException({
                message: 'No se pudo verificar la sesión',
                code: 'SESSION_ERROR',
            });
        }
        const profile = await this.usersService.findById(data.user.id);
        if (!profile) {
            throw new common_1.UnauthorizedException({
                message: 'Usuario sin perfil en la base de datos',
                code: 'PROFILE_NOT_FOUND',
            });
        }
        const payload = {
            sub: profile.id,
            email: profile.email,
            rol: profile.rol,
        };
        return {
            access_token: this.jwtService.sign(payload),
            supabase_session: data.session
                ? {
                    access_token: data.session.access_token,
                    refresh_token: data.session.refresh_token,
                }
                : null,
            user: {
                id: profile.id,
                email: profile.email,
                nombre: profile.nombre,
                rol: profile.rol,
                avatar_url: profile.avatar_url ?? null,
            },
        };
    }
    async updateProfile(userId, dto) {
        const updates = {};
        if (dto.nombre !== undefined) {
            const nombre = dto.nombre.trim();
            if (!nombre) {
                throw new common_1.BadRequestException({
                    message: 'El nombre no puede estar vacío',
                    code: 'NAME_REQUIRED',
                });
            }
            updates.nombre = nombre;
        }
        if (dto.avatar_url !== undefined) {
            updates.avatar_url = dto.avatar_url;
        }
        if (Object.keys(updates).length === 0) {
            const current = await this.usersService.findById(userId);
            if (!current) {
                throw new common_1.UnauthorizedException({
                    message: 'Usuario no encontrado',
                    code: 'PROFILE_NOT_FOUND',
                });
            }
            return current;
        }
        const updated = await this.usersService.updateProfile(userId, updates);
        if (!updated) {
            throw new common_1.UnauthorizedException({
                message: 'Usuario no encontrado',
                code: 'PROFILE_NOT_FOUND',
            });
        }
        return updated;
    }
    async register(dto) {
        const nombre = dto.nombre?.trim();
        const email = dto.email?.trim().toLowerCase();
        if (!nombre) {
            throw new common_1.BadRequestException({
                message: 'Introduce tu nombre',
                code: 'NAME_REQUIRED',
            });
        }
        if (!email) {
            throw new common_1.BadRequestException({
                message: 'Introduce un correo electrónico',
                code: 'EMAIL_REQUIRED',
            });
        }
        if (!dto.password || dto.password.length < 4) {
            throw new common_1.BadRequestException({
                message: 'La contraseña debe tener al menos 4 caracteres',
                code: 'WEAK_PASSWORD',
            });
        }
        const existing = await this.usersService.findByEmail(email);
        if (existing) {
            throw new common_1.ConflictException({
                message: 'Ya existe una cuenta con ese correo',
                code: 'EMAIL_ALREADY_EXISTS',
            });
        }
        const admin = this.supabase.getAdmin();
        const { data, error } = await admin.auth.admin.createUser({
            email,
            password: dto.password,
            email_confirm: true,
            user_metadata: { nombre, rol: 'asesor' },
        });
        if (error) {
            this.logger.error(`Registro fallido (${email}): ${error.message}`);
            throw new common_1.BadRequestException(this.mapRegisterError(error));
        }
        const userId = data.user.id;
        try {
            await this.usersService.createProfile({
                id: userId,
                email,
                nombre,
                rol: 'asesor',
            });
        }
        catch {
            await admin.auth.admin.deleteUser(userId);
            throw new common_1.ServiceUnavailableException({
                message: 'No se pudo crear el perfil. Inténtalo de nuevo',
                code: 'REGISTER_ERROR',
            });
        }
        const payload = {
            sub: userId,
            email,
            rol: 'asesor',
        };
        return {
            access_token: this.jwtService.sign(payload),
            user: {
                id: userId,
                email,
                nombre,
                rol: 'asesor',
            },
            mensaje: 'Cuenta creada correctamente',
            code: 'REGISTER_SUCCESS',
        };
    }
    async inviteUser(params) {
        const email = params.email.trim().toLowerCase();
        const nombre = params.nombre.trim();
        const rol = params.rol ?? 'asesor';
        if (!email) {
            throw new common_1.BadRequestException({
                message: 'Introduce un correo electrónico',
                code: 'EMAIL_REQUIRED',
            });
        }
        if (!nombre) {
            throw new common_1.BadRequestException({
                message: 'Introduce el nombre del trabajador',
                code: 'NAME_REQUIRED',
            });
        }
        const existing = await this.usersService.findByEmail(email);
        if (existing) {
            throw new common_1.ConflictException({
                message: 'Ya existe una cuenta con ese correo',
                code: 'EMAIL_ALREADY_EXISTS',
            });
        }
        const admin = this.supabase.getAdmin();
        const frontendUrl = this.config.get('FRONTEND_URL') ?? 'http://localhost:3000';
        const { data, error } = await admin.auth.admin.inviteUserByEmail(email, {
            redirectTo: `${frontendUrl}/aceptar-invitacion`,
            data: { nombre, rol },
        });
        if (error) {
            this.logger.error(`Invitación fallida (${email}): ${error.message}`);
            throw new common_1.BadRequestException(this.mapInviteError(error));
        }
        const userId = data.user.id;
        try {
            await this.usersService.createProfile({
                id: userId,
                email,
                nombre,
                rol,
            });
        }
        catch {
            await admin.auth.admin.deleteUser(userId);
            throw new common_1.ServiceUnavailableException({
                message: 'No se pudo crear el perfil del usuario. Inténtalo de nuevo',
                code: 'INVITE_ERROR',
            });
        }
        return { userId };
    }
    async provisionWorkerAccount(params) {
        const email = params.email.trim().toLowerCase();
        const nombre = params.nombre.trim();
        const rol = params.rol ?? 'asesor';
        if (!email) {
            throw new common_1.BadRequestException({
                message: 'Introduce un correo electrónico',
                code: 'EMAIL_REQUIRED',
            });
        }
        if (!nombre) {
            throw new common_1.BadRequestException({
                message: 'Introduce el nombre del trabajador',
                code: 'NAME_REQUIRED',
            });
        }
        const existingProfile = await this.usersService.findByEmail(email);
        if (existingProfile) {
            await this.assertAuthUserExists(existingProfile.id, email);
            return {
                userId: existingProfile.id,
                invitationSent: false,
                createdNewAuthUser: false,
            };
        }
        const admin = this.supabase.getAdmin();
        const frontendUrl = this.config.get('FRONTEND_URL') ?? 'http://localhost:3000';
        const inviteOptions = {
            redirectTo: `${frontendUrl}/aceptar-invitacion`,
            data: { nombre, rol },
        };
        let authUserId = await this.findAuthUserIdByEmail(email);
        let createdNewAuthUser = false;
        if (!authUserId) {
            authUserId = await this.createAuthUserForWorker(email, nombre, rol, inviteOptions.redirectTo);
            createdNewAuthUser = true;
            this.logger.log(`Usuario Auth creado para trabajador: ${email}`);
        }
        else {
            await this.assertAuthUserExists(authUserId, email);
        }
        const existingById = await this.usersService.findById(authUserId);
        if (!existingById) {
            try {
                await this.usersService.createProfile({
                    id: authUserId,
                    email,
                    nombre,
                    rol,
                });
                this.logger.log(`Perfil creado para trabajador: ${email}`);
            }
            catch (profileError) {
                if (createdNewAuthUser) {
                    await admin.auth.admin.deleteUser(authUserId);
                }
                this.logger.error(`Perfil no creado para trabajador (${email}): ${profileError}`);
                throw new common_1.ServiceUnavailableException({
                    message: 'No se pudo crear el perfil del usuario. Inténtalo de nuevo',
                    code: 'INVITE_ERROR',
                });
            }
        }
        const invitationSent = await this.trySendWorkerInvitationEmail(email, inviteOptions);
        return { userId: authUserId, invitationSent, createdNewAuthUser };
    }
    async rollbackNewAuthUser(userId) {
        const admin = this.supabase.getAdmin();
        const { error } = await admin.auth.admin.deleteUser(userId);
        if (error) {
            this.logger.warn(`No se pudo revertir usuario Auth ${userId}: ${error.message}`);
        }
    }
    async resendInvitation(email) {
        const normalized = email.trim().toLowerCase();
        if (!normalized) {
            throw new common_1.BadRequestException({
                message: 'Introduce un correo electrónico',
                code: 'EMAIL_REQUIRED',
            });
        }
        const profile = await this.usersService.findByEmail(normalized);
        if (!profile) {
            throw new common_1.BadRequestException({
                message: 'No existe una cuenta con ese correo',
                code: 'EMAIL_NOT_FOUND',
            });
        }
        const frontendUrl = this.config.get('FRONTEND_URL') ?? 'http://localhost:3000';
        const { error } = await this.supabase
            .getAdmin()
            .auth.admin.inviteUserByEmail(normalized, {
            redirectTo: `${frontendUrl}/aceptar-invitacion`,
            data: { nombre: profile.nombre, rol: profile.rol },
        });
        if (error) {
            this.logger.error(`Reenvío de invitación fallido (${normalized}): ${error.message}`);
            throw new common_1.BadRequestException(this.mapInviteError(error));
        }
    }
    async getProfile(userId) {
        const user = await this.usersService.findById(userId);
        if (!user) {
            throw new common_1.UnauthorizedException({
                message: 'Usuario no encontrado',
                code: 'USER_NOT_FOUND',
            });
        }
        return user;
    }
    async forgotPassword(dto) {
        const email = dto.email.trim().toLowerCase();
        if (!email) {
            throw new common_1.BadRequestException({
                message: 'Introduce un correo electrónico',
                code: 'EMAIL_REQUIRED',
            });
        }
        const profile = await this.usersService.findByEmail(email);
        if (!profile) {
            throw new common_1.BadRequestException({
                message: 'No existe una cuenta con ese correo',
                code: 'EMAIL_NOT_FOUND',
            });
        }
        const frontendUrl = this.config.get('FRONTEND_URL') ?? 'http://localhost:3000';
        const { error } = await this.supabase.getAnon().auth.resetPasswordForEmail(email, { redirectTo: `${frontendUrl}/restablecer-contraseña` });
        if (error) {
            throw new common_1.ServiceUnavailableException(this.mapResetError(error));
        }
        return {
            mensaje: 'Si el correo existe, recibirás un enlace para restablecer tu contraseña',
            code: 'RESET_EMAIL_SENT',
        };
    }
    async resetPassword(dto) {
        if (!dto.password || dto.password.length < 4) {
            throw new common_1.BadRequestException({
                message: 'La contraseña debe tener al menos 4 caracteres',
                code: 'WEAK_PASSWORD',
            });
        }
        if (!dto.accessToken || !dto.refreshToken) {
            throw new common_1.BadRequestException({
                message: 'Enlace de recuperación no válido o expirado',
                code: 'INVALID_RESET_TOKEN',
            });
        }
        const client = this.supabase.getAnon();
        const { error: sessionError } = await client.auth.setSession({
            access_token: dto.accessToken,
            refresh_token: dto.refreshToken,
        });
        if (sessionError) {
            throw new common_1.UnauthorizedException({
                message: 'El enlace de recuperación ha expirado. Solicita uno nuevo',
                code: 'INVALID_RESET_TOKEN',
            });
        }
        const { error: updateError } = await client.auth.updateUser({
            password: dto.password,
        });
        if (updateError) {
            throw new common_1.BadRequestException(this.mapResetError(updateError));
        }
        return {
            mensaje: 'Contraseña actualizada correctamente',
            code: 'PASSWORD_RESET_SUCCESS',
        };
    }
    async createAuthUserForWorker(email, nombre, rol, redirectTo) {
        const admin = this.supabase.getAdmin();
        const { data: linkData, error: linkError } = await admin.auth.admin.generateLink({
            type: 'invite',
            email,
            options: {
                redirectTo,
                data: { nombre, rol },
            },
        });
        if (!linkError && linkData?.user?.id) {
            return linkData.user.id;
        }
        if (linkError) {
            this.logger.warn(`generateLink invite falló (${email}): ${linkError.message}`);
            if (this.isAuthUserAlreadyRegistered(linkError)) {
                const existingId = await this.findAuthUserIdByEmail(email);
                if (existingId) {
                    return existingId;
                }
            }
        }
        const tempPassword = (0, crypto_1.randomBytes)(24).toString('base64url');
        const { data: createData, error: createError } = await admin.auth.admin.createUser({
            email,
            password: tempPassword,
            email_confirm: false,
            user_metadata: { nombre, rol },
        });
        if (createError) {
            if (this.isAuthUserAlreadyRegistered(createError)) {
                const existingId = await this.findAuthUserIdByEmail(email);
                if (existingId) {
                    return existingId;
                }
                throw new common_1.ConflictException({
                    message: 'Ya existe una cuenta con ese correo',
                    code: 'EMAIL_ALREADY_EXISTS',
                });
            }
            this.logger.error(`createUser falló para trabajador (${email}): ${createError.message}`);
            throw new common_1.BadRequestException(this.mapInviteError(createError));
        }
        if (!createData.user?.id) {
            throw new common_1.ServiceUnavailableException({
                message: 'No se pudo crear el usuario del trabajador',
                code: 'INVITE_ERROR',
            });
        }
        return createData.user.id;
    }
    async trySendWorkerInvitationEmail(email, options) {
        const { error } = await this.supabase
            .getAdmin()
            .auth.admin.inviteUserByEmail(email, options);
        if (error) {
            this.logger.warn(`Correo de invitación no enviado (${email}): ${error.message}. ` +
                'El usuario Auth ya existe; usa "Reenviar invitación" más tarde.');
            return false;
        }
        return true;
    }
    async assertAuthUserExists(userId, email) {
        const { data, error } = await this.supabase
            .getAdmin()
            .auth.admin.getUserById(userId);
        if (error || !data.user) {
            this.logger.error(`Perfil huérfano: ${email} (${userId}) sin usuario en Auth`);
            throw new common_1.ServiceUnavailableException({
                message: 'El perfil existe pero no hay usuario en autenticación. Contacta con soporte',
                code: 'AUTH_USER_MISSING',
            });
        }
    }
    isAuthUserAlreadyRegistered(error) {
        const message = error.message.toLowerCase();
        return (message.includes('already registered') ||
            message.includes('already been registered') ||
            message.includes('user already exists'));
    }
    async findAuthUserIdByEmail(email) {
        const admin = this.supabase.getAdmin();
        const normalized = email.trim().toLowerCase();
        let page = 1;
        const perPage = 200;
        while (true) {
            const { data, error } = await admin.auth.admin.listUsers({ page, perPage });
            if (error) {
                this.logger.error(`Error al buscar usuario auth por email: ${error.message}`);
                return null;
            }
            const match = data.users.find((user) => user.email?.toLowerCase() === normalized);
            if (match?.id) {
                return match.id;
            }
            if (data.users.length < perPage) {
                break;
            }
            page++;
        }
        return null;
    }
    mapInviteError(error) {
        const map = {
            'User already registered': {
                message: 'Ya existe una cuenta con ese correo',
                code: 'EMAIL_ALREADY_EXISTS',
            },
            'Unable to validate email address: invalid format': {
                message: 'El formato del correo no es válido',
                code: 'INVALID_EMAIL',
            },
            'Email rate limit exceeded': {
                message: 'Demasiados correos enviados. Espera un momento',
                code: 'TOO_MANY_REQUESTS',
            },
            'User not allowed': {
                message: 'Clave service_role incorrecta. Revisa SUPABASE_SERVICE_ROLE_KEY en backend/.env',
                code: 'SUPABASE_CONFIG_ERROR',
            },
        };
        const mapped = map[error.message];
        if (mapped)
            return mapped;
        return {
            message: 'No se pudo enviar la invitación. Inténtalo de nuevo',
            code: 'INVITE_ERROR',
        };
    }
    mapRegisterError(error) {
        const map = {
            'User already registered': {
                message: 'Ya existe una cuenta con ese correo',
                code: 'EMAIL_ALREADY_EXISTS',
            },
            'User not allowed': {
                message: 'Clave service_role incorrecta en el servidor. Revisa SUPABASE_SERVICE_ROLE_KEY en backend/.env',
                code: 'SUPABASE_CONFIG_ERROR',
            },
            'Password should be at least 6 characters': {
                message: 'La contraseña debe tener al menos 6 caracteres',
                code: 'WEAK_PASSWORD',
            },
            'Unable to validate email address: invalid format': {
                message: 'El formato del correo no es válido',
                code: 'INVALID_EMAIL',
            },
        };
        const mapped = map[error.message];
        if (mapped)
            return mapped;
        return {
            message: 'No se pudo crear la cuenta. Inténtalo de nuevo',
            code: 'REGISTER_ERROR',
        };
    }
    mapResetError(error) {
        const map = {
            'Too many requests': {
                message: 'Demasiados intentos. Espera un momento e inténtalo de nuevo',
                code: 'TOO_MANY_REQUESTS',
            },
            'New password should be different from the old password': {
                message: 'La nueva contraseña debe ser diferente a la anterior',
                code: 'SAME_PASSWORD',
            },
        };
        const mapped = map[error.message];
        if (mapped)
            return mapped;
        if (error.status === 0 || error.message.includes('fetch')) {
            return {
                message: 'No se pudo conectar con Supabase',
                code: 'SUPABASE_UNAVAILABLE',
            };
        }
        return {
            message: 'No se pudo restablecer la contraseña. Inténtalo de nuevo',
            code: 'RESET_ERROR',
        };
    }
    mapAuthError(error) {
        const code = error.message;
        const map = {
            'Invalid login credentials': {
                message: 'Correo o contraseña incorrectos',
                code: 'INVALID_CREDENTIALS',
            },
            'Email not confirmed': {
                message: 'Debes confirmar tu correo antes de iniciar sesión',
                code: 'EMAIL_NOT_CONFIRMED',
            },
            'Too many requests': {
                message: 'Demasiados intentos. Espera un momento e inténtalo de nuevo',
                code: 'TOO_MANY_REQUESTS',
            },
        };
        const mapped = map[error.message];
        if (mapped)
            return mapped;
        if (error.status === 0 || error.message.includes('fetch')) {
            throw new common_1.ServiceUnavailableException({
                message: 'No se pudo conectar con Supabase',
                code: 'SUPABASE_UNAVAILABLE',
            });
        }
        return {
            message: 'Error al iniciar sesión. Inténtalo de nuevo',
            code: 'AUTH_ERROR',
        };
    }
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = AuthService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [supabase_service_1.SupabaseService,
        users_service_1.UsersService,
        jwt_1.JwtService,
        config_1.ConfigService])
], AuthService);
//# sourceMappingURL=auth.service.js.map