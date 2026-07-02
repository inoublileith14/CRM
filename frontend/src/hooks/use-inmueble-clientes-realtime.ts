'use client';

import { useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import type {
  RealtimeChannel,
  RealtimePostgresChangesPayload,
} from '@supabase/supabase-js';
import { useSupabaseSession } from '@/contexts/SupabaseSessionContext';
import {
  addClienteToInmuebleDetail,
  applyClienteLinkUpdateToInmuebleDetail,
  applyClienteWorkersChange,
  isClienteInInmuebleDetail,
  mapRealtimeRowToCliente,
  patchClienteInInmuebleDetail,
  removeClienteFromInmuebleDetail,
  resolveWorkerFromCache,
} from '@/lib/cliente-query-cache';
import { getCliente } from '@/lib/clientes-api';
import {
  getSupabaseBrowserClient,
  isSupabaseBrowserConfigured,
} from '@/lib/supabase-browser';
import { queryKeys } from '@/lib/query-keys';
import { Cliente } from '@/types/cliente';
import { Inmueble } from '@/types/inmueble';

type RealtimePayload = RealtimePostgresChangesPayload<{
  [key: string]: unknown;
}>;

function readId(value: unknown): string | null {
  return typeof value === 'string' && value.length > 0 ? value : null;
}

function toDetailCliente(
  fetched: Cliente,
  link?: {
    gestion_estado?: string | null;
    fecha_ultima_gestion?: string | null;
    visita_no_realizada?: boolean | null;
  },
): Cliente {
  return {
    ...fetched,
    gestion_estado:
      (link?.gestion_estado as Cliente['gestion_estado']) ??
      fetched.gestion_estado ??
      null,
    fecha_ultima_gestion:
      link?.fecha_ultima_gestion ?? fetched.fecha_ultima_gestion ?? null,
    visita_no_realizada:
      link?.visita_no_realizada ?? fetched.visita_no_realizada ?? false,
    workers: fetched.workers ?? [],
    worker_ids: fetched.worker_ids ?? [],
    workers_count: fetched.workers?.length ?? 0,
  };
}

export function useInmuebleClientesRealtime(inmuebleId: string) {
  const queryClient = useQueryClient();
  const { ready, hasSession, refreshRealtimeAuth } = useSupabaseSession();
  const channelRef = useRef<RealtimeChannel | null>(null);
  const pendingClienteFetchRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (!inmuebleId || !ready || !hasSession || !isSupabaseBrowserConfigured()) {
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

    async function fetchAndAddCliente(
      clienteId: string,
      link?: {
        gestion_estado?: string | null;
        fecha_ultima_gestion?: string | null;
      },
    ) {
      if (
        pendingClienteFetchRef.current.has(clienteId) ||
        isClienteInInmuebleDetail(queryClient, inmuebleId, clienteId)
      ) {
        return;
      }

      pendingClienteFetchRef.current.add(clienteId);
      try {
        const fetched = await getCliente(clienteId);
        if (cancelled) return;
        addClienteToInmuebleDetail(
          queryClient,
          inmuebleId,
          toDetailCliente(fetched, link),
        );
      } catch {
        // Ignore fetch errors — next manual refresh will reconcile.
      } finally {
        pendingClienteFetchRef.current.delete(clienteId);
      }
    }

    async function subscribe() {
      await refreshRealtimeAuth();
      if (cancelled) return;

      const channel = supabase!
        .channel(`inmueble-clientes-${inmuebleId}-${Date.now()}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'cliente_inmuebles',
            filter: `inmueble_id=eq.${inmuebleId}`,
          },
          (payload) => {
            const typed = payload as RealtimePayload;
            const newRecord = typed.new as Record<string, unknown> | undefined;
            const oldRecord = typed.old as Record<string, unknown> | undefined;
            const clienteId =
              readId(newRecord?.cliente_id) ?? readId(oldRecord?.cliente_id);
            if (!clienteId) return;

            if (typed.eventType === 'DELETE') {
              removeClienteFromInmuebleDetail(
                queryClient,
                inmuebleId,
                clienteId,
              );
              return;
            }

            if (typed.eventType === 'INSERT') {
              void fetchAndAddCliente(clienteId, {
                gestion_estado: toStringOrNullish(newRecord?.gestion_estado),
                fecha_ultima_gestion: toStringOrNullish(
                  newRecord?.fecha_ultima_gestion,
                ),
              });
              return;
            }

            if (typed.eventType === 'UPDATE') {
              if (isClienteInInmuebleDetail(queryClient, inmuebleId, clienteId)) {
                applyClienteLinkUpdateToInmuebleDetail(
                  queryClient,
                  inmuebleId,
                  clienteId,
                  {
                    gestion_estado: toStringOrNullish(newRecord?.gestion_estado),
                    fecha_ultima_gestion: toStringOrNullish(
                      newRecord?.fecha_ultima_gestion,
                    ),
                    visita_no_realizada:
                      typeof newRecord?.visita_no_realizada === 'boolean'
                        ? newRecord.visita_no_realizada
                        : undefined,
                  },
                );
              } else {
                void fetchAndAddCliente(clienteId, {
                  gestion_estado: toStringOrNullish(newRecord?.gestion_estado),
                  fecha_ultima_gestion: toStringOrNullish(
                    newRecord?.fecha_ultima_gestion,
                  ),
                });
              }
            }
          },
        )
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'clientes',
          },
          (payload) => {
            const typed = payload as RealtimePayload;
            const newRecord = typed.new as Record<string, unknown> | undefined;
            const oldRecord = typed.old as Record<string, unknown> | undefined;
            const clienteId =
              readId(newRecord?.id) ?? readId(oldRecord?.id);
            if (!clienteId) return;

            if (typed.eventType === 'DELETE') {
              if (isClienteInInmuebleDetail(queryClient, inmuebleId, clienteId)) {
                removeClienteFromInmuebleDetail(
                  queryClient,
                  inmuebleId,
                  clienteId,
                );
              }
              return;
            }

            if (!isClienteInInmuebleDetail(queryClient, inmuebleId, clienteId)) {
              return;
            }

            const mapped = mapRealtimeRowToCliente(newRecord ?? {});
            if (!mapped) return;

            const existing = queryClient
              .getQueryData<Inmueble>(queryKeys.inmuebles.detail(inmuebleId))
              ?.clientes?.find((cliente) => cliente.id === clienteId);

            patchClienteInInmuebleDetail(queryClient, inmuebleId, clienteId, {
              ...mapped,
              gestion_estado: existing?.gestion_estado ?? mapped.gestion_estado,
              workers: existing?.workers,
              worker_ids: existing?.worker_ids,
              workers_count: existing?.workers_count,
            });
          },
        )
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'cliente_workers',
          },
          (payload) => {
            const typed = payload as RealtimePayload;
            const newRecord = typed.new as Record<string, unknown> | undefined;
            const oldRecord = typed.old as Record<string, unknown> | undefined;
            const clienteId =
              readId(newRecord?.cliente_id) ?? readId(oldRecord?.cliente_id);
            const workerId =
              readId(newRecord?.worker_id) ?? readId(oldRecord?.worker_id);
            if (!clienteId || !workerId) return;
            if (!isClienteInInmuebleDetail(queryClient, inmuebleId, clienteId)) {
              return;
            }

            if (typed.eventType === 'DELETE') {
              const worker = resolveWorkerFromCache(queryClient, workerId);
              if (!worker) return;
              applyClienteWorkersChange(
                queryClient,
                inmuebleId,
                clienteId,
                worker,
                'remove',
              );
              return;
            }

            const worker = resolveWorkerFromCache(queryClient, workerId);
            if (!worker) return;
            applyClienteWorkersChange(
              queryClient,
              inmuebleId,
              clienteId,
              worker,
              'add',
            );
          },
        )
        .subscribe((status, error) => {
          if (process.env.NODE_ENV === 'development') {
            if (status === 'SUBSCRIBED') {
              console.info(
                `[realtime] inmueble clientes (${inmuebleId}) connected`,
              );
            } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
              console.warn(
                `[realtime] inmueble clientes (${inmuebleId}) ${status}`,
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
      pendingClienteFetchRef.current.clear();
      if (channelRef.current) {
        void supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [hasSession, inmuebleId, queryClient, ready, refreshRealtimeAuth]);
}

function toStringOrNullish(value: unknown): string | null | undefined {
  if (value === undefined) return undefined;
  if (value == null) return null;
  const text = String(value).trim();
  return text ? text : null;
}
