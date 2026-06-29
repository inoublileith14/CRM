import { randomBytes } from 'crypto';
import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  ServiceUnavailableException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { AuthError } from '@supabase/supabase-js';
import { SupabaseService } from '../supabase/supabase.service';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { JwtPayload, UserProfile } from './interfaces/user.interface';
import { UsersService } from './users.service';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private supabase: SupabaseService,
    private usersService: UsersService,
    private jwtService: JwtService,
    private config: ConfigService,
  ) {}

  async login(dto: LoginDto) {
    const { data, error } = await this.supabase
      .getAnon()
      .auth.signInWithPassword({
        email: dto.email.trim().toLowerCase(),
        password: dto.password,
      });

    if (error) {
      throw new UnauthorizedException(this.mapAuthError(error));
    }

    if (!data.user) {
      throw new UnauthorizedException({
        message: 'No se pudo verificar la sesión',
        code: 'SESSION_ERROR',
      });
    }

    const profile = await this.usersService.findById(data.user.id);

    if (!profile) {
      throw new UnauthorizedException({
        message: 'Usuario sin perfil en la base de datos',
        code: 'PROFILE_NOT_FOUND',
      });
    }

    const payload: JwtPayload = {
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

  async updateProfile(
    userId: string,
    dto: UpdateProfileDto,
  ): Promise<UserProfile> {
    const updates: Partial<UserProfile> = {};

    if (dto.nombre !== undefined) {
      const nombre = dto.nombre.trim();
      if (!nombre) {
        throw new BadRequestException({
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
        throw new UnauthorizedException({
          message: 'Usuario no encontrado',
          code: 'PROFILE_NOT_FOUND',
        });
      }
      return current;
    }

    const updated = await this.usersService.updateProfile(userId, updates);
    if (!updated) {
      throw new UnauthorizedException({
        message: 'Usuario no encontrado',
        code: 'PROFILE_NOT_FOUND',
      });
    }

    return updated;
  }

  async register(dto: RegisterDto) {
    const nombre = dto.nombre?.trim();
    const email = dto.email?.trim().toLowerCase();

    if (!nombre) {
      throw new BadRequestException({
        message: 'Introduce tu nombre',
        code: 'NAME_REQUIRED',
      });
    }

    if (!email) {
      throw new BadRequestException({
        message: 'Introduce un correo electrónico',
        code: 'EMAIL_REQUIRED',
      });
    }

    if (!dto.password || dto.password.length < 4) {
      throw new BadRequestException({
        message: 'La contraseña debe tener al menos 4 caracteres',
        code: 'WEAK_PASSWORD',
      });
    }

    const existing = await this.usersService.findByEmail(email);

    if (existing) {
      throw new ConflictException({
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
      throw new BadRequestException(this.mapRegisterError(error));
    }

    const userId = data.user.id;

    try {
      await this.usersService.createProfile({
        id: userId,
        email,
        nombre,
        rol: 'asesor',
      });
    } catch {
      await admin.auth.admin.deleteUser(userId);
      throw new ServiceUnavailableException({
        message: 'No se pudo crear el perfil. Inténtalo de nuevo',
        code: 'REGISTER_ERROR',
      });
    }

    const payload: JwtPayload = {
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

  async inviteUser(params: {
    email: string;
    nombre: string;
    rol?: string;
  }): Promise<{ userId: string }> {
    const email = params.email.trim().toLowerCase();
    const nombre = params.nombre.trim();
    const rol = params.rol ?? 'asesor';

    if (!email) {
      throw new BadRequestException({
        message: 'Introduce un correo electrónico',
        code: 'EMAIL_REQUIRED',
      });
    }

    if (!nombre) {
      throw new BadRequestException({
        message: 'Introduce el nombre del trabajador',
        code: 'NAME_REQUIRED',
      });
    }

    const existing = await this.usersService.findByEmail(email);

    if (existing) {
      throw new ConflictException({
        message: 'Ya existe una cuenta con ese correo',
        code: 'EMAIL_ALREADY_EXISTS',
      });
    }

    const admin = this.supabase.getAdmin();
    const frontendUrl =
      this.config.get<string>('FRONTEND_URL') ?? 'http://localhost:3000';

    const { data, error } = await admin.auth.admin.inviteUserByEmail(email, {
      redirectTo: `${frontendUrl}/aceptar-invitacion`,
      data: { nombre, rol },
    });

    if (error) {
      this.logger.error(`Invitación fallida (${email}): ${error.message}`);
      throw new BadRequestException(this.mapInviteError(error));
    }

    const userId = data.user.id;

    try {
      await this.usersService.createProfile({
        id: userId,
        email,
        nombre,
        rol,
      });
    } catch {
      await admin.auth.admin.deleteUser(userId);
      throw new ServiceUnavailableException({
        message: 'No se pudo crear el perfil del usuario. Inténtalo de nuevo',
        code: 'INVITE_ERROR',
      });
    }

    return { userId };
  }

  /**
   * Crea o vincula un usuario Supabase Auth + perfil para un trabajador.
   * Usa generateLink/createUser para garantizar el usuario en Auth (inviteUserByEmail
   * solo intenta enviar el correo y puede fallar por rate limit sin crear usuario).
   */
  async provisionWorkerAccount(params: {
    email: string;
    nombre: string;
    rol?: string;
  }): Promise<{
    userId: string;
    invitationSent: boolean;
    createdNewAuthUser: boolean;
  }> {
    const email = params.email.trim().toLowerCase();
    const nombre = params.nombre.trim();
    const rol = params.rol ?? 'asesor';

    if (!email) {
      throw new BadRequestException({
        message: 'Introduce un correo electrónico',
        code: 'EMAIL_REQUIRED',
      });
    }

    if (!nombre) {
      throw new BadRequestException({
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
    const frontendUrl =
      this.config.get<string>('FRONTEND_URL') ?? 'http://localhost:3000';
    const inviteOptions = {
      redirectTo: `${frontendUrl}/aceptar-invitacion`,
      data: { nombre, rol },
    };

    let authUserId = await this.findAuthUserIdByEmail(email);
    let createdNewAuthUser = false;

    if (!authUserId) {
      authUserId = await this.createAuthUserForWorker(
        email,
        nombre,
        rol,
        inviteOptions.redirectTo,
      );
      createdNewAuthUser = true;
      this.logger.log(`Usuario Auth creado para trabajador: ${email}`);
    } else {
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
      } catch (profileError) {
        if (createdNewAuthUser) {
          await admin.auth.admin.deleteUser(authUserId);
        }
        this.logger.error(
          `Perfil no creado para trabajador (${email}): ${profileError}`,
        );
        throw new ServiceUnavailableException({
          message: 'No se pudo crear el perfil del usuario. Inténtalo de nuevo',
          code: 'INVITE_ERROR',
        });
      }
    }

    const invitationSent = await this.trySendWorkerInvitationEmail(
      email,
      inviteOptions,
    );

    return { userId: authUserId, invitationSent, createdNewAuthUser };
  }

  /** Elimina un usuario Auth recién creado si falla el alta del trabajador. */
  async rollbackNewAuthUser(userId: string): Promise<void> {
    const admin = this.supabase.getAdmin();
    const { error } = await admin.auth.admin.deleteUser(userId);
    if (error) {
      this.logger.warn(
        `No se pudo revertir usuario Auth ${userId}: ${error.message}`,
      );
    }
  }

  async resendInvitation(email: string): Promise<void> {
    const normalized = email.trim().toLowerCase();

    if (!normalized) {
      throw new BadRequestException({
        message: 'Introduce un correo electrónico',
        code: 'EMAIL_REQUIRED',
      });
    }

    const profile = await this.usersService.findByEmail(normalized);

    if (!profile) {
      throw new BadRequestException({
        message: 'No existe una cuenta con ese correo',
        code: 'EMAIL_NOT_FOUND',
      });
    }

    const frontendUrl =
      this.config.get<string>('FRONTEND_URL') ?? 'http://localhost:3000';

    const { error } = await this.supabase
      .getAdmin()
      .auth.admin.inviteUserByEmail(normalized, {
        redirectTo: `${frontendUrl}/aceptar-invitacion`,
        data: { nombre: profile.nombre, rol: profile.rol },
      });

    if (error) {
      this.logger.error(
        `Reenvío de invitación fallido (${normalized}): ${error.message}`,
      );
      throw new BadRequestException(this.mapInviteError(error));
    }
  }

  async getProfile(userId: string) {
    const user = await this.usersService.findById(userId);

    if (!user) {
      throw new UnauthorizedException({
        message: 'Usuario no encontrado',
        code: 'USER_NOT_FOUND',
      });
    }

    return user;
  }

  async forgotPassword(dto: ForgotPasswordDto) {
    const email = dto.email.trim().toLowerCase();

    if (!email) {
      throw new BadRequestException({
        message: 'Introduce un correo electrónico',
        code: 'EMAIL_REQUIRED',
      });
    }

    const profile = await this.usersService.findByEmail(email);

    if (!profile) {
      throw new BadRequestException({
        message: 'No existe una cuenta con ese correo',
        code: 'EMAIL_NOT_FOUND',
      });
    }

    const frontendUrl =
      this.config.get<string>('FRONTEND_URL') ?? 'http://localhost:3000';

    const { error } = await this.supabase.getAnon().auth.resetPasswordForEmail(
      email,
      { redirectTo: `${frontendUrl}/restablecer-contraseña` },
    );

    if (error) {
      throw new ServiceUnavailableException(this.mapResetError(error));
    }

    return {
      mensaje:
        'Si el correo existe, recibirás un enlace para restablecer tu contraseña',
      code: 'RESET_EMAIL_SENT',
    };
  }

  async resetPassword(dto: ResetPasswordDto) {
    if (!dto.password || dto.password.length < 4) {
      throw new BadRequestException({
        message: 'La contraseña debe tener al menos 4 caracteres',
        code: 'WEAK_PASSWORD',
      });
    }

    if (!dto.accessToken || !dto.refreshToken) {
      throw new BadRequestException({
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
      throw new UnauthorizedException({
        message: 'El enlace de recuperación ha expirado. Solicita uno nuevo',
        code: 'INVALID_RESET_TOKEN',
      });
    }

    const { error: updateError } = await client.auth.updateUser({
      password: dto.password,
    });

    if (updateError) {
      throw new BadRequestException(this.mapResetError(updateError));
    }

    return {
      mensaje: 'Contraseña actualizada correctamente',
      code: 'PASSWORD_RESET_SUCCESS',
    };
  }

  private async createAuthUserForWorker(
    email: string,
    nombre: string,
    rol: string,
    redirectTo: string,
  ): Promise<string> {
    const admin = this.supabase.getAdmin();

    const { data: linkData, error: linkError } =
      await admin.auth.admin.generateLink({
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
      this.logger.warn(
        `generateLink invite falló (${email}): ${linkError.message}`,
      );
      if (this.isAuthUserAlreadyRegistered(linkError)) {
        const existingId = await this.findAuthUserIdByEmail(email);
        if (existingId) {
          return existingId;
        }
      }
    }

    const tempPassword = randomBytes(24).toString('base64url');
    const { data: createData, error: createError } =
      await admin.auth.admin.createUser({
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
        throw new ConflictException({
          message: 'Ya existe una cuenta con ese correo',
          code: 'EMAIL_ALREADY_EXISTS',
        });
      }

      this.logger.error(
        `createUser falló para trabajador (${email}): ${createError.message}`,
      );
      throw new BadRequestException(this.mapInviteError(createError));
    }

    if (!createData.user?.id) {
      throw new ServiceUnavailableException({
        message: 'No se pudo crear el usuario del trabajador',
        code: 'INVITE_ERROR',
      });
    }

    return createData.user.id;
  }

  private async trySendWorkerInvitationEmail(
    email: string,
    options: { redirectTo: string; data: { nombre: string; rol: string } },
  ): Promise<boolean> {
    const { error } = await this.supabase
      .getAdmin()
      .auth.admin.inviteUserByEmail(email, options);

    if (error) {
      this.logger.warn(
        `Correo de invitación no enviado (${email}): ${error.message}. ` +
          'El usuario Auth ya existe; usa "Reenviar invitación" más tarde.',
      );
      return false;
    }

    return true;
  }

  private async assertAuthUserExists(
    userId: string,
    email: string,
  ): Promise<void> {
    const { data, error } = await this.supabase
      .getAdmin()
      .auth.admin.getUserById(userId);

    if (error || !data.user) {
      this.logger.error(
        `Perfil huérfano: ${email} (${userId}) sin usuario en Auth`,
      );
      throw new ServiceUnavailableException({
        message:
          'El perfil existe pero no hay usuario en autenticación. Contacta con soporte',
        code: 'AUTH_USER_MISSING',
      });
    }
  }

  private isAuthUserAlreadyRegistered(error: AuthError): boolean {
    const message = error.message.toLowerCase();
    return (
      message.includes('already registered') ||
      message.includes('already been registered') ||
      message.includes('user already exists')
    );
  }

  private async findAuthUserIdByEmail(email: string): Promise<string | null> {
    const admin = this.supabase.getAdmin();
    const normalized = email.trim().toLowerCase();
    let page = 1;
    const perPage = 200;

    while (true) {
      const { data, error } = await admin.auth.admin.listUsers({ page, perPage });

      if (error) {
        this.logger.error(
          `Error al buscar usuario auth por email: ${error.message}`,
        );
        return null;
      }

      const match = data.users.find(
        (user) => user.email?.toLowerCase() === normalized,
      );
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

  private mapInviteError(error: AuthError) {
    const map: Record<string, { message: string; code: string }> = {
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
        message:
          'Clave service_role incorrecta. Revisa SUPABASE_SERVICE_ROLE_KEY en backend/.env',
        code: 'SUPABASE_CONFIG_ERROR',
      },
    };

    const mapped = map[error.message];

    if (mapped) return mapped;

    return {
      message: 'No se pudo enviar la invitación. Inténtalo de nuevo',
      code: 'INVITE_ERROR',
    };
  }

  private mapRegisterError(error: AuthError) {
    const map: Record<string, { message: string; code: string }> = {
      'User already registered': {
        message: 'Ya existe una cuenta con ese correo',
        code: 'EMAIL_ALREADY_EXISTS',
      },
      'User not allowed': {
        message:
          'Clave service_role incorrecta en el servidor. Revisa SUPABASE_SERVICE_ROLE_KEY en backend/.env',
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

    if (mapped) return mapped;

    return {
      message: 'No se pudo crear la cuenta. Inténtalo de nuevo',
      code: 'REGISTER_ERROR',
    };
  }

  private mapResetError(error: AuthError) {
    const map: Record<string, { message: string; code: string }> = {
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

    if (mapped) return mapped;

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

  private mapAuthError(error: AuthError) {
    const code = error.message;

    const map: Record<string, { message: string; code: string }> = {
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

    if (mapped) return mapped;

    if (error.status === 0 || error.message.includes('fetch')) {
      throw new ServiceUnavailableException({
        message: 'No se pudo conectar con Supabase',
        code: 'SUPABASE_UNAVAILABLE',
      });
    }

    return {
      message: 'Error al iniciar sesión. Inténtalo de nuevo',
      code: 'AUTH_ERROR',
    };
  }
}
