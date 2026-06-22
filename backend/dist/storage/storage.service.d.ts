import { SupabaseService } from '../supabase/supabase.service';
export declare class StorageService {
    private supabase;
    private readonly logger;
    constructor(supabase: SupabaseService);
    uploadImage(file: Express.Multer.File): Promise<{
        url: string;
        path: string;
    }>;
    private extensionFromMime;
}
