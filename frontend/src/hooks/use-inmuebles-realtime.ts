'use client';

import { useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import type {
  RealtimeChannel,
  RealtimePostgresChangesPayload,
} from '@supabase/supabase-js';
import { useSupabaseSession } from '@/contexts/SupabaseSessionContext';
import {
  applyInmuebleDeleteFromCache,
  applyInmuebleInsertToCache,
  applyInmuebleUpdateToCache,
  mapRealtimeRowToInmueble,
} from '@/lib/inmueble-query-cache';
import {
  getSupabaseBrowserClient,
  isSupabaseBrowserConfigured,
} from '@/lib/supabase-browser';
import { queryKeys } from '@/lib/query-keys';
import { Inmueble, TipoOperacion } from '@/types/inmueble';

type InmuebleRealtimePayload = RealtimePostgresChangesPayload<{
  [key: string]: unknown;
}>;

function readTipoOperacion(value: unknown): TipoOperacion | null {
  return value === 'alquiler' || value === 'venta' ? value : null;
}

function handleRealtimePayload(
  queryClient: ReturnType<typeof useQueryClient>,
  tipoOperacion: TipoOperacion,
  payload: InmuebleRealtimePayload,
) {
  const oldRecord = payload.old as Record<string, unknown> | undefined;
  const previousTipo = readTipoOperacion(oldRecord?.tipo_operacion);
  const deletedId = typeof oldRecord?.id === 'string' ? oldRecord.id : null;

  if (payload.eventType === 'DELETE') {
    if (!deletedId) return;
    const currentRows = queryClient.getQueryData<Inmueble[]>(
      queryKeys.inmuebles.all({ tipo_operacion: tipoOperacion }),
    );
    const shouldRemove =
      previousTipo === tipoOperacion ||
      currentRows?.some((row) => row.id === deletedId);
    if (shouldRemove) {
      applyInmuebleDeleteFromCache(queryClient, deletedId, tipoOperacion);
    }
    return;
  }

  const inmueble = mapRealtimeRowToInmueble(
    (payload.new ?? {}) as Record<string, unknown>,
  );
  if (!inmueble) return;

  const nextTipo = inmueble.tipo_operacion;
  const belongsNow = nextTipo === tipoOperacion;
  const belongedBefore = previousTipo === tipoOperacion;

  if (!belongsNow && belongedBefore && deletedId) {
    applyInmuebleDeleteFromCache(queryClient, deletedId, tipoOperacion);
    return;
  }

  if (!belongsNow) return;

  if (payload.eventType === 'INSERT') {
    applyInmuebleInsertToCache(queryClient, inmueble);
    return;
  }

  if (payload.eventType === 'UPDATE') {
    applyInmuebleUpdateToCache(queryClient, inmueble, previousTipo);
  }
}

export function useInmueblesRealtime(tipoOperacion: TipoOperacion) {
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
        .channel(`inmuebles-realtime-${tipoOperacion}-${Date.now()}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'inmuebles',
          },
          (payload) => {
            handleRealtimePayload(
              queryClient,
              tipoOperacion,
              payload as InmuebleRealtimePayload,
            );
          },
        )
        .subscribe((status, error) => {
          if (process.env.NODE_ENV === 'development') {
            if (status === 'SUBSCRIBED') {
              console.info(
                `[realtime] inmuebles (${tipoOperacion}) connected`,
              );
            } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
              console.warn(
                `[realtime] inmuebles (${tipoOperacion}) ${status}`,
                error,
              );
            }
          }
        });

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
  }, [
    hasSession,
    queryClient,
    ready,
    refreshRealtimeAuth,
    tipoOperacion,
  ]);
}
