'use client';

import { useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import type {
  RealtimeChannel,
  RealtimePostgresChangesPayload,
} from '@supabase/supabase-js';
import { useSupabaseSession } from '@/contexts/SupabaseSessionContext';
import {
  applyClienteWorkersChangeInAllByTipoCaches,
  clienteRowBelongsToTipo,
  invalidateAllClientesByTipoCaches,
  isClienteVisibleInByTipoCaches,
  mapRealtimeRowToCliente,
  patchClienteInAllByTipoCaches,
  patchLinkRowInAllByTipoCaches,
  removeRowFromAllByTipoCaches,
  resolveInmuebleTipo,
  resolveWorkerFromCache,
} from '@/lib/cliente-query-cache';
import {
  getSupabaseBrowserClient,
  isSupabaseBrowserConfigured,
} from '@/lib/supabase-browser';
import { TipoOperacion } from '@/types/inmueble';

type RealtimePayload = RealtimePostgresChangesPayload<{
  [key: string]: unknown;
}>;

function readId(value: unknown): string | null {
  return typeof value === 'string' && value.length > 0 ? value : null;
}

function toStringOrNullish(value: unknown): string | null | undefined {
  if (value === undefined) return undefined;
  if (value == null) return null;
  const text = String(value).trim();
  return text ? text : null;
}

function readTipoOperacion(value: unknown): TipoOperacion | null {
  return value === 'alquiler' || value === 'venta' ? value : null;
}

export function useClientesByTipoRealtime(tipoOperacion: TipoOperacion) {
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
        .channel(`clientes-by-tipo-${tipoOperacion}-${Date.now()}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'cliente_inmuebles',
          },
          (payload) => {
            const typed = payload as RealtimePayload;
            const newRecord = typed.new as Record<string, unknown> | undefined;
            const oldRecord = typed.old as Record<string, unknown> | undefined;
            const clienteId =
              readId(newRecord?.cliente_id) ?? readId(oldRecord?.cliente_id);
            const inmuebleId =
              readId(newRecord?.inmueble_id) ?? readId(oldRecord?.inmueble_id);
            if (!clienteId) return;

            if (inmuebleId) {
              const inmuebleTipo = resolveInmuebleTipo(queryClient, inmuebleId);
              if (inmuebleTipo && inmuebleTipo !== tipoOperacion) return;
            }

            if (typed.eventType === 'DELETE') {
              if (!inmuebleId) return;
              removeRowFromAllByTipoCaches(
                queryClient,
                tipoOperacion,
                `${inmuebleId}-${clienteId}`,
              );
              return;
            }

            if (typed.eventType === 'INSERT') {
              invalidateAllClientesByTipoCaches(queryClient, tipoOperacion);
              return;
            }

            if (typed.eventType === 'UPDATE' && inmuebleId) {
              const rowKey = `${inmuebleId}-${clienteId}`;
              const visible = queryClient
                .getQueriesData<{ rows: { row_key: string }[] }>({
                  queryKey: ['clientes-by-tipo', tipoOperacion],
                })
                .some(([, data]) =>
                  data?.rows.some((row) => row.row_key === rowKey),
                );

              if (visible) {
                patchLinkRowInAllByTipoCaches(
                  queryClient,
                  tipoOperacion,
                  inmuebleId,
                  clienteId,
                  {
                    gestion_estado: toStringOrNullish(newRecord?.gestion_estado),
                    fecha_ultima_gestion: toStringOrNullish(
                      newRecord?.fecha_ultima_gestion,
                    ),
                  },
                );
              } else {
                invalidateAllClientesByTipoCaches(queryClient, tipoOperacion);
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

            if (typed.eventType === 'INSERT') {
              const tipo = readTipoOperacion(newRecord?.tipo_operacion);
              if (tipo === tipoOperacion || tipo == null) {
                invalidateAllClientesByTipoCaches(queryClient, tipoOperacion);
              }
              return;
            }

            if (typed.eventType === 'DELETE') {
              if (
                isClienteVisibleInByTipoCaches(
                  queryClient,
                  tipoOperacion,
                  clienteId,
                )
              ) {
                forEachVisibleRowKeys(queryClient, tipoOperacion, clienteId, (rowKey) => {
                  removeRowFromAllByTipoCaches(
                    queryClient,
                    tipoOperacion,
                    rowKey,
                  );
                });
              }
              return;
            }

            const mapped = mapRealtimeRowToCliente(newRecord ?? {});
            if (!mapped) return;

            if (
              !clienteRowBelongsToTipo(
                queryClient,
                tipoOperacion,
                mapped,
                null,
              ) &&
              !isClienteVisibleInByTipoCaches(
                queryClient,
                tipoOperacion,
                clienteId,
              )
            ) {
              return;
            }

            if (!isClienteVisibleInByTipoCaches(queryClient, tipoOperacion, clienteId)) {
              return;
            }

            patchClienteInAllByTipoCaches(
              queryClient,
              tipoOperacion,
              clienteId,
              mapped,
            );
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

            if (
              !isClienteVisibleInByTipoCaches(
                queryClient,
                tipoOperacion,
                clienteId,
              )
            ) {
              return;
            }

            const worker = resolveWorkerFromCache(queryClient, workerId);
            if (!worker) return;

            applyClienteWorkersChangeInAllByTipoCaches(
              queryClient,
              tipoOperacion,
              clienteId,
              worker,
              typed.eventType === 'DELETE' ? 'remove' : 'add',
            );
          },
        )
        .subscribe((status, error) => {
          if (process.env.NODE_ENV === 'development') {
            if (status === 'SUBSCRIBED') {
              console.info(
                `[realtime] clientes-by-tipo (${tipoOperacion}) connected`,
              );
            } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
              console.warn(
                `[realtime] clientes-by-tipo (${tipoOperacion}) ${status}`,
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
  }, [hasSession, queryClient, ready, refreshRealtimeAuth, tipoOperacion]);
}

function forEachVisibleRowKeys(
  queryClient: ReturnType<typeof useQueryClient>,
  tipo: TipoOperacion,
  clienteId: string,
  callback: (rowKey: string) => void,
): void {
  const entries = queryClient.getQueriesData<{
    rows: { row_key: string; cliente: { id: string } }[];
  }>({
    queryKey: ['clientes-by-tipo', tipo],
  });

  const seen = new Set<string>();
  for (const [, data] of entries) {
    for (const row of data?.rows ?? []) {
      if (row.cliente.id !== clienteId || seen.has(row.row_key)) continue;
      seen.add(row.row_key);
      callback(row.row_key);
    }
  }
}
