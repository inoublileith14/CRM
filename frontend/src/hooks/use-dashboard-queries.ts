'use client';

import {
  useQuery,
  useQueryClient,
  UseQueryResult,
} from '@tanstack/react-query';
import { getMe } from '@/lib/api';
import { getClientes, getCliente } from '@/lib/clientes-api';
import {
  fetchAllInmuebleClientesByTipo,
  getInmueble,
  getInmuebleClienteRefsByTipo,
  getInmuebleClientesByTipo,
  getInmuebles,
  InmueblesFilters,
} from '@/lib/inmuebles-api';
import { getPropietario, getPropietarios } from '@/lib/propietarios-api';
import { QUERY_GC_TIME, QUERY_STALE_TIME } from '@/lib/query-config';
import { queryKeys } from '@/lib/query-keys';
import { getWorker, getWorkers } from '@/lib/workers-api';
import {
  getWhatsAppConversations,
  getWhatsAppMessages,
} from '@/lib/whatsapp-inbox-api';
import { TipoOperacion } from '@/types/inmueble';
import { ClientesByTipoListParams } from '@/types/clientes-by-tipo-page';
import {
  CalendarEventItem,
  CalendarEventsRange,
} from '@/types/calendar';

const defaultQueryOptions = {
  gcTime: QUERY_GC_TIME,
  refetchOnWindowFocus: process.env.NODE_ENV === 'production',
  retry: 1,
} as const;

async function fetchCalendarStatus() {
  const res = await fetch('/api/calendar/status', { cache: 'no-store' });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error ?? 'Error al cargar calendario');
  return data as {
    connected: boolean;
    googleEmail: string | null;
    calendarId: string | null;
    connectedAt: string | null;
    canCreateEvents: boolean;
    pushSyncEnabled: boolean;
    isShared: boolean;
    canManageConnection: boolean;
  };
}

async function fetchCalendarEvents(
  range: CalendarEventsRange,
): Promise<CalendarEventItem[]> {
  const params = new URLSearchParams({
    from: range.from,
    to: range.to,
  });
  const res = await fetch(`/api/calendar/events?${params.toString()}`, {
    cache: 'no-store',
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error ?? 'Error al cargar eventos');
  return data as CalendarEventItem[];
}

export function useAuthMeQuery() {
  return useQuery({
    queryKey: queryKeys.auth.me,
    queryFn: getMe,
    staleTime: QUERY_STALE_TIME.auth,
    ...defaultQueryOptions,
  });
}

export function useClientesQuery() {
  return useQuery({
    queryKey: queryKeys.clientes.all,
    queryFn: getClientes,
    staleTime: QUERY_STALE_TIME.list,
    ...defaultQueryOptions,
  });
}

export function useClienteQuery(id: string) {
  return useQuery({
    queryKey: queryKeys.clientes.detail(id),
    queryFn: () => getCliente(id),
    staleTime: QUERY_STALE_TIME.detail,
    enabled: Boolean(id),
    ...defaultQueryOptions,
  });
}

export function useClientesByTipoQuery(
  tipo: TipoOperacion,
  params: ClientesByTipoListParams,
  options?: { enabled?: boolean },
) {
  return useQuery({
    queryKey: queryKeys.clientes.byTipo(tipo, params),
    queryFn: () => getInmuebleClientesByTipo(tipo, params),
    staleTime: QUERY_STALE_TIME.list,
    placeholderData: (previousData) => previousData,
    enabled: options?.enabled ?? true,
    ...defaultQueryOptions,
  });
}

export function useClientesByTipoRefsQuery(
  tipo: TipoOperacion,
  search?: string,
  options?: { enabled?: boolean },
) {
  return useQuery({
    queryKey: queryKeys.clientes.refsByTipo(tipo, search),
    queryFn: () => getInmuebleClienteRefsByTipo(tipo, search),
    staleTime: QUERY_STALE_TIME.list,
    enabled: options?.enabled ?? true,
    ...defaultQueryOptions,
  });
}

export function useClientesByTipoAllQuery(
  tipo: TipoOperacion,
  sortParams?: Pick<ClientesByTipoListParams, 'sort' | 'dir'>,
  options?: { enabled?: boolean },
) {
  return useQuery({
    queryKey: queryKeys.clientes.byTipoAll(
      tipo,
      sortParams?.sort,
      sortParams?.dir,
    ),
    queryFn: () => fetchAllInmuebleClientesByTipo(tipo, sortParams),
    staleTime: QUERY_STALE_TIME.list,
    enabled: options?.enabled ?? true,
    ...defaultQueryOptions,
  });
}

export function useInmueblesQuery(
  filters?: InmueblesFilters,
  options?: { enabled?: boolean },
) {
  return useQuery({
    queryKey: queryKeys.inmuebles.all(filters),
    queryFn: () => getInmuebles(filters),
    staleTime: QUERY_STALE_TIME.list,
    enabled: options?.enabled ?? true,
    ...defaultQueryOptions,
  });
}

export function useInmuebleQuery(id: string) {
  return useQuery({
    queryKey: queryKeys.inmuebles.detail(id),
    queryFn: () => getInmueble(id),
    staleTime: QUERY_STALE_TIME.detail,
    enabled: Boolean(id),
    ...defaultQueryOptions,
  });
}

export function useWorkersQuery(activoOnly = false) {
  return useQuery({
    queryKey: queryKeys.workers.all(activoOnly),
    queryFn: () => getWorkers(activoOnly),
    staleTime: QUERY_STALE_TIME.workers,
    ...defaultQueryOptions,
  });
}

export function useWorkerQuery(id: string) {
  return useQuery({
    queryKey: queryKeys.workers.detail(id),
    queryFn: () => getWorker(id),
    staleTime: QUERY_STALE_TIME.detail,
    enabled: Boolean(id),
    ...defaultQueryOptions,
  });
}

export function usePropietariosQuery() {
  return useQuery({
    queryKey: queryKeys.propietarios.all,
    queryFn: getPropietarios,
    staleTime: QUERY_STALE_TIME.list,
    ...defaultQueryOptions,
  });
}

export function usePropietarioQuery(id: string) {
  return useQuery({
    queryKey: queryKeys.propietarios.detail(id),
    queryFn: () => getPropietario(id),
    staleTime: QUERY_STALE_TIME.detail,
    enabled: Boolean(id),
    ...defaultQueryOptions,
  });
}

export function useWhatsAppConversationsQuery() {
  return useQuery({
    queryKey: queryKeys.whatsapp.conversations,
    queryFn: getWhatsAppConversations,
    staleTime: QUERY_STALE_TIME.whatsapp,
    ...defaultQueryOptions,
  });
}

export function useWhatsAppMessagesQuery(conversationId: string | null) {
  return useQuery({
    queryKey: queryKeys.whatsapp.messages(conversationId ?? ''),
    queryFn: () => getWhatsAppMessages(conversationId as string),
    staleTime: QUERY_STALE_TIME.whatsapp,
    enabled: Boolean(conversationId),
    ...defaultQueryOptions,
  });
}

export function useCalendarStatusQuery(enabled = true) {
  return useQuery({
    queryKey: queryKeys.calendar.status,
    queryFn: fetchCalendarStatus,
    staleTime: QUERY_STALE_TIME.calendar,
    enabled,
    ...defaultQueryOptions,
  });
}

export function useCalendarEventsQuery(
  connected: boolean,
  range: CalendarEventsRange | null,
  options?: { refetchIntervalMs?: number },
) {
  return useQuery({
    queryKey: queryKeys.calendar.events(range ?? undefined),
    queryFn: () => fetchCalendarEvents(range!),
    staleTime: QUERY_STALE_TIME.calendar,
    refetchInterval: options?.refetchIntervalMs,
    enabled: connected && Boolean(range),
    placeholderData: (previousData) => previousData,
    ...defaultQueryOptions,
  });
}

export function useFormOptionsQuery() {
  const inmuebles = useInmueblesQuery();
  const workers = useWorkersQuery(false);
  return {
    inmuebles: inmuebles.data ?? [],
    workers: workers.data ?? [],
    isPending: inmuebles.isPending || workers.isPending,
    isError: inmuebles.isError || workers.isError,
  };
}

export function useInvalidateDashboardQueries() {
  const queryClient = useQueryClient();

  return {
    invalidateAuth: () =>
      queryClient.invalidateQueries({ queryKey: queryKeys.auth.me }),
    invalidateClientes: () =>
      queryClient.invalidateQueries({ queryKey: queryKeys.clientes.all }),
    invalidateClientesByTipo: (tipo: TipoOperacion) =>
      queryClient.invalidateQueries({
        queryKey: ['clientes-by-tipo', tipo],
      }),
    invalidateCliente: (id: string) =>
      queryClient.invalidateQueries({
        queryKey: queryKeys.clientes.detail(id),
      }),
    invalidateInmuebles: (filters?: InmueblesFilters) =>
      queryClient.invalidateQueries({
        queryKey: queryKeys.inmuebles.all(filters),
      }),
    invalidateAllInmuebles: () =>
      queryClient.invalidateQueries({ queryKey: ['inmuebles'] }),
    invalidateInmueble: (id: string) =>
      queryClient.invalidateQueries({
        queryKey: queryKeys.inmuebles.detail(id),
      }),
    invalidateWorkers: () =>
      queryClient.invalidateQueries({ queryKey: ['workers'] }),
    invalidateWorker: (id: string) =>
      queryClient.invalidateQueries({
        queryKey: queryKeys.workers.detail(id),
      }),
    invalidatePropietarios: () =>
      queryClient.invalidateQueries({ queryKey: queryKeys.propietarios.all }),
    invalidatePropietario: (id: string) =>
      queryClient.invalidateQueries({
        queryKey: queryKeys.propietarios.detail(id),
      }),
    invalidateWhatsApp: () =>
      queryClient.invalidateQueries({ queryKey: ['whatsapp'] }),
    invalidateCalendar: () =>
      queryClient.invalidateQueries({ queryKey: ['calendar'] }),
    invalidateCalendarEvents: () =>
      queryClient.invalidateQueries({ queryKey: queryKeys.calendar.events() }),
  };
}

export type DashboardQueryResult<T> = UseQueryResult<T, Error>;
