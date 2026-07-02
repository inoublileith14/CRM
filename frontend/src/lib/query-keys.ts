import { ClientesByTipoListParams } from '@/types/clientes-by-tipo-page';
import { InmueblesFilters } from '@/lib/inmuebles-api';
import { TipoOperacion } from '@/types/inmueble';

export const queryKeys = {
  auth: {
    me: ['auth', 'me'] as const,
  },
  auditLogs: {
    all: ['audit-logs'] as const,
  },
  clientes: {
    all: ['clientes'] as const,
    detail: (id: string) => ['clientes', id] as const,
    byTipo: (tipo: TipoOperacion, params?: ClientesByTipoListParams) =>
      [
        'clientes-by-tipo',
        tipo,
        params?.page ?? 1,
        params?.limit ?? 50,
        params?.sort ?? '',
        params?.dir ?? '',
        params?.nombre ?? '',
        params?.telefono ?? '',
        params?.ref_cliente ?? '',
        params?.entrada_prevista ?? '',
        params?.presupuesto_maximo_min ?? '',
        params?.presupuesto_maximo_max ?? '',
        params?.presupuesto_peticion_min ?? '',
        params?.presupuesto_peticion_max ?? '',
        params?.habitaciones_min ?? '',
        params?.habitaciones_max ?? '',
        params?.banos_min ?? '',
        params?.banos_max ?? '',
        params?.metros_min ?? '',
        params?.metros_max ?? '',
        params?.barrio ?? '',
        params?.distrito ?? '',
      ] as const,
    refsByTipo: (tipo: TipoOperacion, search?: string) =>
      ['clientes-by-tipo', tipo, 'refs', search ?? ''] as const,
    byTipoAll: (
      tipo: TipoOperacion,
      sort?: ClientesByTipoListParams['sort'],
      dir?: ClientesByTipoListParams['dir'],
    ) =>
      ['clientes-by-tipo', tipo, 'all', sort ?? '', dir ?? ''] as const,
  },
  inmuebles: {
    all: (filters?: InmueblesFilters) =>
      ['inmuebles', filters ?? {}] as const,
    detail: (id: string) => ['inmuebles', 'detail', id] as const,
  },
  workers: {
    all: (activoOnly = false) => ['workers', { activoOnly }] as const,
    detail: (id: string) => ['workers', id] as const,
    me: ['workers', 'me'] as const,
  },
  propietarios: {
    all: ['propietarios'] as const,
    detail: (id: string) => ['propietarios', id] as const,
  },
  whatsapp: {
    conversations: ['whatsapp', 'conversations'] as const,
    messages: (conversationId: string) =>
      ['whatsapp', 'messages', conversationId] as const,
  },
  calendar: {
    status: ['calendar', 'status'] as const,
    events: (range?: { from: string; to: string }) =>
      range
        ? (['calendar', 'events', range.from, range.to] as const)
        : (['calendar', 'events'] as const),
  },
};
