import { SupabaseService } from '../supabase/supabase.service';
import { CreatePropietarioDto } from './dto/create-propietario.dto';
import { FindOrCreatePropietarioDto } from './dto/find-or-create-propietario.dto';
import { UpdatePropietarioDto } from './dto/update-propietario.dto';
import { Propietario } from './interfaces/propietario.interface';
export declare class PropietariosService {
    private supabase;
    private readonly logger;
    constructor(supabase: SupabaseService);
    findAll(): Promise<Propietario[]>;
    findOne(id: string): Promise<Propietario>;
    create(dto: CreatePropietarioDto): Promise<Propietario>;
    findOrCreate(dto: FindOrCreatePropietarioDto): Promise<Propietario>;
    update(id: string, dto: UpdatePropietarioDto): Promise<Propietario>;
    remove(id: string): Promise<{
        mensaje: string;
    }>;
    private mapWithCount;
}
