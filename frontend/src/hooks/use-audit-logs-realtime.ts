'use client';

import { useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import type {
  RealtimeChannel,
  RealtimePostgresChangesPayload,
} from '@supabase/supabase-js';
import { useSupabaseSession } from '@/contexts/SupabaseSessionContext';
import {
  getSupabaseBrowserClient,
  isSupabaseBrowserConfigured,
} from '@/lib/supabase-browser';
import { queryKeys } from '@/lib/query-keys';
import type { AuditLogRow } from '@/lib/audit-logs-api';

type AuditLogRealtimePayload = RealtimePostgresChangesPayload<{
  [key: string]: unknown;
}>;

function mapRow(row: Record<string, unknown>): AuditLogRow | null {
  if (!row || typeof row.id !== 'string' || typeof row.created_at !== 'string') return null;
  return row as unknown as AuditLogRow;
}

export function useAuditLogsRealtime() {
  const queryClient = useQueryClient();
  const { ready, hasSession, refreshRealtimeAuth } = useSupabaseSession();
  const channelRef = useRef<RealtimeChannel | null>(null);

  useEffect(() => {
    if (!ready || !hasSession || !isSupabaseBrowserConfigured()) {
      if (channelRef.current) {
        const supabase = getSupabaseBrowserClient();
        if (supabase) void supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
      return;
    }

    const supabase = getSupabaseBrowserClient();
    if (!supabase) return;

    let cancelled = false;

    async function subscribe() {
      await refreshRealtimeAuth();
      if (cancelled) return;

      const channel = supabase!
        .channel(`audit-logs-${Date.now()}`)
        .on(
          'postgres_changes',
          { event: 'INSERT', schema: 'public', table: 'audit_logs' },
          (payload) => {
            const raw = (payload as AuditLogRealtimePayload).new;
            const row =
              raw && typeof raw === 'object'
                ? mapRow(raw as Record<string, unknown>)
                : null;
            if (!row) return;
            queryClient.setQueryData<AuditLogRow[]>(
              queryKeys.auditLogs.all,
              (prev) => {
                const current = Array.isArray(prev) ? prev : [];
                if (current.some((r) => r.id === row.id)) return current;
                return [row, ...current].slice(0, 500);
              },
            );
          },
        )
        .subscribe();

      channelRef.current = channel;
    }

    void subscribe();

    return () => {
      cancelled = true;
      if (channelRef.current) {
        void supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [hasSession, queryClient, ready, refreshRealtimeAuth]);
}

