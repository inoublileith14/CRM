import {
  BadRequestException,
  Injectable,
  Logger,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SupabaseService } from '../supabase/supabase.service';
import { UserProfile } from './interfaces/user.interface';

const SELECT_FIELDS =
  'id, email, nombre, rol, avatar_url' as const;
const SELECT_FIELDS_LEGACY = 'id, email, nombre, rol' as const;

const MIGRATION_HINT =
  'Ejecuta supabase/migration-profiles-avatar.sql en el SQL Editor de Supabase.';

@Injectable()
export class UsersService implements OnModuleInit {
  private readonly logger = new Logger(UsersService.name);
  private avatarColumnAvailable: boolean | null = null;

  constructor(
    private supabase: SupabaseService,
    private config: ConfigService,
  ) {}

  async onModuleInit() {
    await this.seedAdmin();
  }

  async findById(id: string): Promise<UserProfile | null> {
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
        ? this.mapProfile(data as unknown as Record<string, unknown>)
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
      ? this.mapProfile(data as unknown as Record<string, unknown>)
      : null;
  }

  async updateProfile(
    id: string,
    data: Partial<Pick<UserProfile, 'nombre' | 'rol' | 'avatar_url'>>,
  ): Promise<UserProfile | null> {
    const withAvatar = await this.hasAvatarColumn();

    if (!withAvatar && data.avatar_url !== undefined) {
      throw new BadRequestException({
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
        ? this.mapProfile(updated as unknown as Record<string, unknown>)
        : null;
    }

    const legacyPayload: Partial<Pick<UserProfile, 'nombre' | 'rol'>> = {};
    if (data.nombre !== undefined) legacyPayload.nombre = data.nombre;
    if (data.rol !== undefined) legacyPayload.rol = data.rol;

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
      ? this.mapProfile(updated as unknown as Record<string, unknown>)
      : null;
  }

  async createProfile(profile: UserProfile): Promise<void> {
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

  async findByEmail(email: string): Promise<UserProfile | null> {
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
        ? this.mapProfile(data as unknown as Record<string, unknown>)
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
      ? this.mapProfile(data as unknown as Record<string, unknown>)
      : null;
  }

  private isMissingAvatarColumn(message: string): boolean {
    return (
      message.includes('avatar_url') &&
      (message.includes('does not exist') ||
        message.includes('Could not find') ||
        message.includes('column') ||
        message.includes('schema cache'))
    );
  }

  private async hasAvatarColumn(): Promise<boolean> {
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

  private mapProfile(row: Record<string, unknown>): UserProfile {
    return {
      id: row.id as string,
      email: row.email as string,
      nombre: row.nombre as string,
      rol: row.rol as string,
      avatar_url: (row.avatar_url as string | null | undefined) ?? null,
    };
  }

  private async seedAdmin() {
    const email =
      this.config.get<string>('ADMIN_EMAIL') ?? 'admin@cocount.com';
    const password = this.config.get<string>('ADMIN_PASSWORD') ?? 'Cocount';
    const admin = this.supabase.getAdmin();

    const { data: listData } = await admin.auth.admin.listUsers();
    const existing = listData?.users?.find(
      (u: { email?: string }) => u.email === email,
    );

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

    if (!userId) return;

    const { error: profileError } = await admin.from('profiles').upsert(
      {
        id: userId,
        email,
        nombre: 'Administrador',
        rol: 'admin',
      },
      { onConflict: 'id' },
    );

    if (profileError) {
      this.logger.warn(
        `Perfil admin no sincronizado (¿ejecutaste schema.sql?): ${profileError.message}`,
      );
    } else {
      this.logger.log(`Perfil admin listo en Supabase: ${email}`);
    }
  }
}
