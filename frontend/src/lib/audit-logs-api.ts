export type AuditLogRow = {
  id: string;
  created_at: string;
  actor_id: string | null;
  actor_nombre: string | null;
  actor_rol: string | null;
  action: string;
  entity_type: string | null;
  entity_id: string | null;
  route: string | null;
  method: string | null;
  status_code: number | null;
  metadata: Record<string, unknown>;
};

export async function getAuditLogs(limit = 200): Promise<AuditLogRow[]> {
  const res = await fetch(`/api/audit-logs?limit=${encodeURIComponent(String(limit))}`, {
    cache: 'no-store',
  });
  const data = await res.json().catch(() => []);
  if (!res.ok) {
    throw new Error((data && (data.error as string)) || 'Error al cargar logs');
  }
  return data as AuditLogRow[];
}

