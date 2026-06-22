import { AuthService } from '../auth/auth.service';
import { UsersService } from '../auth/users.service';
import { SupabaseService } from '../supabase/supabase.service';
import { CreateWorkerDto } from './dto/create-worker.dto';
import { UpdateWorkerDto } from './dto/update-worker.dto';
import { Worker } from './interfaces/worker.interface';
export declare class WorkersService {
    private supabase;
    private authService;
    private usersService;
    private readonly logger;
    private profileColumnsAvailable;
    constructor(supabase: SupabaseService, authService: AuthService, usersService: UsersService);
    findAll(activoOnly?: boolean): Promise<Worker[]>;
    findIdByProfileId(profileId: string): Promise<string | null>;
    findOne(id: string): Promise<Worker>;
    create(dto: CreateWorkerDto): Promise<Worker>;
    update(id: string, dto: UpdateWorkerDto): Promise<Worker>;
    resendInvitation(id: string): Promise<{
        mensaje: string;
    }>;
    remove(id: string): Promise<{
        mensaje: string;
    }>;
    private isMissingProfileColumns;
    private hasProfileColumns;
    private mapWorkerRolToProfileRol;
    private assertProfileNotLinked;
    private resolveUserForWorker;
    private mapWithCount;
    private mapWithClientes;
    private withProfileDefaults;
}
