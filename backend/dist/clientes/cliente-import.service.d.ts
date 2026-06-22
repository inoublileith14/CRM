import { SupabaseService } from '../supabase/supabase.service';
import { ClientesService } from './clientes.service';
import { BulkImportClientesOptionsDto } from './dto/bulk-import-clientes.dto';
export type ClienteImportJobStatus = 'pending' | 'processing' | 'completed' | 'failed';
export interface ClienteImportJob {
    id: string;
    status: ClienteImportJobStatus;
    total_rows: number;
    processed_rows: number;
    created_count: number;
    skipped_count: number;
    failed_count: number;
    error_message: string | null;
    options: BulkImportClientesOptionsDto;
    created_at: string;
    updated_at: string;
}
export declare class ClienteImportService {
    private supabase;
    private clientesService;
    private readonly logger;
    private readonly runningJobs;
    constructor(supabase: SupabaseService, clientesService: ClientesService);
    startUploadImport(file: Express.Multer.File, options: BulkImportClientesOptionsDto): Promise<{
        jobId: string;
    }>;
    getJob(jobId: string): Promise<ClienteImportJob>;
    private runJob;
    private patchJob;
}
