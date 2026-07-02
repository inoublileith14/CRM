import { SupabaseService } from '../supabase/supabase.service';
export type AuditLogCreateParams = {
    actor_id?: string | null;
    actor_nombre?: string | null;
    actor_rol?: string | null;
    action: string;
    entity_type?: string | null;
    entity_id?: string | null;
    route?: string | null;
    method?: string | null;
    status_code?: number | null;
    metadata?: Record<string, unknown>;
};
export declare class AuditLogsService {
    private supabase;
    constructor(supabase: SupabaseService);
    create(params: AuditLogCreateParams): Promise<void>;
    list(params: {
        limit: number;
    }): Promise<unknown[]>;
}
