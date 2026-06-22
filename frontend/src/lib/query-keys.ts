import { InmueblesFilters } from '@/lib/inmuebles-api';
import { TipoOperacion } from '@/types/inmueble';

export const queryKeys = {
  auth: {
    me: ['auth', 'me'] as const,
  },
  clientes: {
    all: ['clientes'] as const,
    detail: (id: string) => ['clientes', id] as const,
    byTipo: (tipo: TipoOperacion) => ['clientes-by-tipo', tipo] as const,
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
    events: ['calendar', 'events'] as const,
  },
};
