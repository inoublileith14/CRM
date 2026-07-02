import {
  BadRequestException,
  ConflictException,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { AuthService } from '../auth/auth.service';
import { UsersService } from '../auth/users.service';
import { SupabaseService } from '../supabase/supabase.service';
import { CreateWorkerDto } from './dto/create-worker.dto';
import { UpdateWorkerDto } from './dto/update-worker.dto';
import { Cliente } from '../clientes/interfaces/cliente.interface';
import { Worker, WorkerRol } from './interfaces/worker.interface';

const SELECT_FIELDS =
  'id, nombre, telf, email, rol, activo, notas, profile_id, invitation_sent_at, created_at, updated_at';

const SELECT_FIELDS_LEGACY =
  'id, nombre, telf, email, rol, activo, notas, created_at, updated_at';

const SELECT_LIST = `${SELECT_FIELDS}, cliente_workers(count)` as const;
const SELECT_LIST_LEGACY = `${SELECT_FIELDS_LEGACY}, cliente_workers(count)` as const;

const SELECT_DETAIL =
  `${SELECT_FIELDS}, cliente_workers(cliente_id, clientes(*, cliente_inmuebles(inmueble_id, gestion_estado, fecha_ultima_gestion)))` as const;
const SELECT_DETAIL_LEGACY =
  `${SELECT_FIELDS_LEGACY}, cliente_workers(cliente_id, clientes(*, cliente_inmuebles(inmueble_id, gestion_estado, fecha_ultima_gestion)))` as const;

const MIGRATION_HINT =
  'Ejecuta supabase/migration-workers-profile.sql en el SQL Editor de Supabase.';

@Injectable()
export class WorkersService {
  private readonly logger = new Logger(WorkersService.name);
  private profileColumnsAvailable: boolean | null = null;

  constructor(
    private supabase: SupabaseService,
    private authService: AuthService,
    private usersService: UsersService,
  ) {}

  async findAll(activoOnly?: boolean): Promise<Worker[]> {
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
      throw new InternalServerErrorException(
        'No se pudieron cargar los trabajadores',
      );
    }

    return (data ?? []).map((row) =>
      this.mapWithCount(row as unknown as Record<string, unknown>),
    );
  }

  async findIdByProfileId(profileId: string): Promise<string | null> {
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
      this.logger.error(
        `Error al buscar worker por profile ${profileId}: ${error.message}`,
      );
      throw new InternalServerErrorException(
        'No se pudo resolver el trabajador del usuario',
      );
    }

    return data?.id ?? null;
  }

  async findOne(id: string): Promise<Worker> {
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
      throw new InternalServerErrorException(
        'No se pudo cargar el trabajador',
      );
    }

    if (!data) {
      throw new NotFoundException('Trabajador no encontrado');
    }

    return this.mapWithClientes(data as unknown as Record<string, unknown>);
  }

  async create(dto: CreateWorkerDto): Promise<Worker> {
    const nombre = dto.nombre?.trim();
    const email = dto.email?.trim().toLowerCase();

    if (!nombre) {
      throw new BadRequestException({
        message: 'El nombre es obligatorio',
        code: 'NAME_REQUIRED',
      });
    }

    if (!email) {
      throw new BadRequestException({
        message:
          'El email es obligatorio para crear el usuario y enviar la invitación',
        code: 'EMAIL_REQUIRED',
      });
    }

    if (!(await this.hasProfileColumns())) {
      throw new BadRequestException({
        message: `No se puede crear el usuario del trabajador. ${MIGRATION_HINT}`,
        code: 'WORKERS_PROFILE_MIGRATION_REQUIRED',
      });
    }

    const { profileId, invitationSentAt, createdNewAuthUser } =
      await this.resolveUserForWorker(email, nombre, dto.rol);

    const insertPayload: Record<string, unknown> = {
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
        throw new InternalServerErrorException(
          `Falta migración en Supabase. ${MIGRATION_HINT}`,
        );
      }
      throw new InternalServerErrorException(
        'No se pudo crear el trabajador',
      );
    }

    const worker = this.withProfileDefaults(
      data as unknown as Record<string, unknown>,
    );

    if (!worker.profile_id) {
      this.logger.error(
        `Trabajador ${worker.id} guardado sin profile_id (${email})`,
      );
      throw new InternalServerErrorException(
        'El trabajador se creó sin vincular usuario. Inténtalo de nuevo',
      );
    }

    return {
      ...worker,
      clientes_count: 0,
    };
  }

  async update(id: string, dto: UpdateWorkerDto): Promise<Worker> {
    const existing = await this.findOne(id);

    const payload: Record<string, unknown> = {
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

    const newEmail =
      dto.email !== undefined
        ? dto.email?.trim().toLowerCase() || null
        : existing.email;

    const emailForAccount = newEmail ?? existing.email;

    if (!existing.profile_id && emailForAccount) {
      if (!(await this.hasProfileColumns())) {
        throw new BadRequestException({
          message: `No se puede vincular usuario al trabajador. ${MIGRATION_HINT}`,
          code: 'WORKERS_PROFILE_MIGRATION_REQUIRED',
        });
      }
      const { profileId, invitationSentAt } = await this.resolveUserForWorker(
        emailForAccount,
        (payload.nombre as string) ?? existing.nombre,
        (payload.rol as WorkerRol) ?? existing.rol,
      );
      payload.profile_id = profileId;
      payload.invitation_sent_at = invitationSentAt;
    }

    if (
      (await this.hasProfileColumns()) &&
      existing.profile_id &&
      (dto.rol !== undefined || dto.nombre !== undefined)
    ) {
      const profileRol = this.mapWorkerRolToProfileRol(
        (dto.rol as WorkerRol | undefined) ?? existing.rol,
      );
      await this.usersService.updateProfile(existing.profile_id, {
        ...(dto.nombre !== undefined
          ? { nombre: (payload.nombre as string) ?? existing.nombre }
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
      throw new InternalServerErrorException(
        'No se pudo actualizar el trabajador',
      );
    }

    return this.withProfileDefaults(data as unknown as Record<string, unknown>);
  }

  async resendInvitation(id: string): Promise<{ mensaje: string }> {
    const worker = await this.findOne(id);

    if (!worker.email) {
      throw new BadRequestException({
        message: 'El trabajador no tiene email',
        code: 'EMAIL_REQUIRED',
      });
    }

    if (!worker.profile_id) {
      throw new BadRequestException({
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
      this.logger.warn(
        `Invitación reenviada pero no se actualizó invitation_sent_at: ${error.message}`,
      );
    }

    return { mensaje: 'Invitación reenviada correctamente' };
  }

  async remove(id: string): Promise<{ mensaje: string }> {
    await this.findOne(id);

    const { error } = await this.supabase
      .getAdmin()
      .from('workers')
      .delete()
      .eq('id', id);

    if (error) {
      this.logger.error(`Error al eliminar worker ${id}: ${error.message}`);
      throw new InternalServerErrorException(
        'No se pudo eliminar el trabajador',
      );
    }

    return { mensaje: 'Trabajador eliminado correctamente' };
  }

  private isMissingProfileColumns(message: string): boolean {
    return (
      message.includes('profile_id') &&
      (message.includes('does not exist') ||
        message.includes('column') ||
        message.includes('42703'))
    );
  }

  private async hasProfileColumns(): Promise<boolean> {
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

  private mapWorkerRolToProfileRol(rol?: WorkerRol | string): 'admin' | 'asesor' {
    if (rol === 'admin' || rol === 'administracion') return 'admin';
    return 'asesor';
  }

  private async assertProfileNotLinked(profileId: string): Promise<void> {
    const { data, error } = await this.supabase
      .getAdmin()
      .from('workers')
      .select('id, nombre')
      .eq('profile_id', profileId)
      .maybeSingle();

    if (error) {
      this.logger.error(
        `Error al comprobar profile_id en workers: ${error.message}`,
      );
      throw new InternalServerErrorException(
        'No se pudo validar el usuario vinculado',
      );
    }

    if (data) {
      throw new ConflictException({
        message: 'Ese usuario ya está vinculado a otro trabajador',
        code: 'PROFILE_ALREADY_LINKED',
      });
    }
  }

  private async resolveUserForWorker(
    email: string,
    nombre: string,
    workerRol?: WorkerRol,
  ): Promise<{
    profileId: string;
    invitationSentAt: string | null;
    createdNewAuthUser: boolean;
  }> {
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
    const { userId, invitationSent, createdNewAuthUser } =
      await this.authService.provisionWorkerAccount({
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

  private mapWithCount(row: Record<string, unknown>): Worker {
    const clienteWorkers = row.cliente_workers as { count: number }[] | undefined;
    const { cliente_workers: _omit, ...rest } = row;
    return {
      ...this.withProfileDefaults(rest),
      clientes_count: clienteWorkers?.[0]?.count ?? 0,
    };
  }

  private mapWithClientes(row: Record<string, unknown>): Worker {
    const clienteWorkers = row.cliente_workers as
      | {
          cliente_id: string;
          clientes: (Cliente & {
            cliente_inmuebles?: Array<{
              inmueble_id: string;
              gestion_estado: string | null;
              fecha_ultima_gestion: string | null;
            }>;
          }) | null;
        }[]
      | undefined;
    const { cliente_workers: _omit, ...rest } = row;
    const clientes = (clienteWorkers ?? [])
      .map((link) => {
        const raw = link.clientes;
        if (!raw) return null;
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
          gestion_estado: this.pickPrimaryGestionEstado(
            links,
            clienteRest.tipo_operacion,
          ),
        } as Cliente;
      })
      .filter((cliente): cliente is Cliente => cliente != null);

    return {
      ...this.withProfileDefaults(rest),
      clientes_count: clientes.length,
      clientes,
    };
  }

  private pickPrimaryGestionEstado(
    links: Array<{ gestion_estado: string | null }>,
    tipo: Cliente['tipo_operacion'],
  ): Cliente['gestion_estado'] {
    const priority: Record<string, number> = {
      ya_compro: 100,
      ya_encontro_piso: 100,
      reservado: 95,
      alquilado_por_coc: 95,
      visita_concertada: 90,
      pendiente_cuadrar_docs: 75,
      int_pendiente_docs: 75,
      pendiente_cuadrar_visita: 75,
      videollamada: 70,
      gestionando: 60,
      gestionando_w: 60,
      nc: 40,
      perfil_no_encaja: 20,
      no_gestionando: 10,
      no_gestionado: 10,
    };

    let best: string | null = null;
    let bestScore = -1;
    for (const link of links) {
      const estado = link.gestion_estado;
      if (!estado) continue;
      const score = priority[estado] ?? 30;
      if (score > bestScore) {
        bestScore = score;
        best = estado;
      }
    }

    if (best) {
      return best as Cliente['gestion_estado'];
    }

    if (tipo === 'venta') return 'no_gestionado';
    if (tipo === 'alquiler') return 'no_gestionando';
    return null;
  }

  private withProfileDefaults(rest: Record<string, unknown>): Worker {
    return {
      ...(rest as unknown as Worker),
      profile_id: (rest.profile_id as string | null | undefined) ?? null,
      invitation_sent_at:
        (rest.invitation_sent_at as string | null | undefined) ?? null,
    };
  }
}
