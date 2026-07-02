import { Injectable } from '@nestjs/common';
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

@Injectable()
export class AuditLogsService {
  constructor(private supabase: SupabaseService) {}

  async create(params: AuditLogCreateParams): Promise<void> {
    const admin = this.supabase.getAdmin();
    const payload = {
      actor_id: params.actor_id ?? null,
      actor_nombre: params.actor_nombre ?? null,
      actor_rol: params.actor_rol ?? null,
      action: params.action,
      entity_type: params.entity_type ?? null,
      entity_id: params.entity_id ?? null,
      route: params.route ?? null,
      method: params.method ?? null,
      status_code: params.status_code ?? null,
      metadata: params.metadata ?? {},
    };

    // fire-and-forget: avoid blocking user actions on log insert
    void admin.from('audit_logs').insert(payload);
  }

  async list(params: { limit: number }): Promise<unknown[]> {
    const admin = this.supabase.getAdmin();
    const { data, error } = await admin
      .from('audit_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(params.limit);
    if (error) {
      throw new Error(error.message);
    }
    return data ?? [];
  }
}

