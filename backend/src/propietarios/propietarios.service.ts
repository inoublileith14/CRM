import {
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import { CreatePropietarioDto } from './dto/create-propietario.dto';
import { FindOrCreatePropietarioDto } from './dto/find-or-create-propietario.dto';
import { UpdatePropietarioDto } from './dto/update-propietario.dto';
import { Propietario } from './interfaces/propietario.interface';

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

@Injectable()
export class PropietariosService {
  private readonly logger = new Logger(PropietariosService.name);

  constructor(private supabase: SupabaseService) {}

  async findAll(): Promise<Propietario[]> {
    const { data, error } = await this.supabase
      .getAdmin()
      .from('propietarios')
      .select(`${SELECT_FIELDS}, inmuebles(count)`)
      .order('nombre', { ascending: true });

    if (error) {
      this.logger.error(`Error al listar propietarios: ${error.message}`);
      throw new InternalServerErrorException(
        'No se pudieron cargar los propietarios',
      );
    }

    return (data ?? []).map((row) => this.mapWithCount(row));
  }

  async findOne(id: string): Promise<Propietario> {
    const { data, error } = await this.supabase
      .getAdmin()
      .from('propietarios')
      .select(`${SELECT_FIELDS}, inmuebles(*)`)
      .eq('id', id)
      .maybeSingle();

    if (error) {
      this.logger.error(`Error al buscar propietario ${id}: ${error.message}`);
      throw new InternalServerErrorException(
        'No se pudo cargar el propietario',
      );
    }

    if (!data) {
      throw new NotFoundException('Propietario no encontrado');
    }

    const { inmuebles, ...rest } = data as Propietario & {
      inmuebles?: unknown[];
    };

    return {
      ...rest,
      inmuebles_count: inmuebles?.length ?? 0,
      inmuebles: (inmuebles ?? []) as Propietario['inmuebles'],
    };
  }

  async create(dto: CreatePropietarioDto): Promise<Propietario> {
    const { data, error } = await this.supabase
      .getAdmin()
      .from('propietarios')
      .insert(dto)
      .select(SELECT_FIELDS)
      .single();

    if (error) {
      this.logger.error(`Error al crear propietario: ${error.message}`);
      throw new InternalServerErrorException(
        'No se pudo crear el propietario',
      );
    }

    return { ...data, inmuebles_count: 0 };
  }

  async findOrCreate(dto: FindOrCreatePropietarioDto): Promise<Propietario> {
    const nombre = dto.nombre.trim();
    if (!nombre) {
      throw new InternalServerErrorException('Nombre de propietario requerido');
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
      this.logger.error(
        `Error al buscar propietario: ${findError.message}`,
      );
      throw new InternalServerErrorException(
        'No se pudo buscar el propietario',
      );
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

  async update(id: string, dto: UpdatePropietarioDto): Promise<Propietario> {
    await this.findOne(id);

    const { data, error } = await this.supabase
      .getAdmin()
      .from('propietarios')
      .update({ ...dto, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select(SELECT_FIELDS)
      .single();

    if (error) {
      this.logger.error(
        `Error al actualizar propietario ${id}: ${error.message}`,
      );
      throw new InternalServerErrorException(
        'No se pudo actualizar el propietario',
      );
    }

    return data;
  }

  async remove(id: string): Promise<{ mensaje: string }> {
    await this.findOne(id);

    const { error } = await this.supabase
      .getAdmin()
      .from('propietarios')
      .delete()
      .eq('id', id);

    if (error) {
      this.logger.error(
        `Error al eliminar propietario ${id}: ${error.message}`,
      );
      throw new InternalServerErrorException(
        'No se pudo eliminar el propietario',
      );
    }

    return { mensaje: 'Propietario eliminado correctamente' };
  }

  private mapWithCount(row: Record<string, unknown>): Propietario {
    const inmuebles = row.inmuebles as { count: number }[] | undefined;
    const { inmuebles: _omit, ...rest } = row;
    return {
      ...(rest as unknown as Propietario),
      inmuebles_count: inmuebles?.[0]?.count ?? 0,
    };
  }
}
