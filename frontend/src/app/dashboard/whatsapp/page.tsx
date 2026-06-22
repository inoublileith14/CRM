'use client';

import { useEffect, useMemo, useState } from 'react';
import { SendHorizonal } from 'lucide-react';
import { toast } from 'sonner';
import { QueryRefreshingBadge } from '@/components/QueryRefreshingBadge';
import {
  useInvalidateDashboardQueries,
  useWhatsAppConversationsQuery,
  useWhatsAppMessagesQuery,
} from '@/hooks/use-dashboard-queries';
import { useQueryUiState } from '@/hooks/use-query-ui';
import { replyWhatsApp } from '@/lib/whatsapp-inbox-api';

function formatTime(value: string) {
  try {
    return new Intl.DateTimeFormat('es-ES', {
      dateStyle: 'short',
      timeStyle: 'short',
    }).format(new Date(value));
  } catch {
    return value;
  }
}

export default function WhatsAppInboxPage() {
  const { invalidateWhatsApp } = useInvalidateDashboardQueries();
  const conversationsQuery = useWhatsAppConversationsQuery();
  const {
    data: conversations = [],
    showInitialLoading,
    isRefreshing,
  } = useQueryUiState(conversationsQuery);
  const [activeId, setActiveId] = useState<string | null>(null);
  const messagesQuery = useWhatsAppMessagesQuery(activeId);
  const {
    data: messages = [],
    showInitialLoading: messagesInitialLoading,
    isRefreshing: messagesRefreshing,
  } = useQueryUiState(messagesQuery);
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (!activeId && conversations.length > 0) {
      setActiveId(conversations[0].id);
    }
  }, [activeId, conversations]);

  const activeConversation = useMemo(
    () => conversations.find((c) => c.id === activeId) ?? null,
    [conversations, activeId],
  );

  async function handleSend() {
    if (!activeId) return;
    const text = draft.trim();
    if (!text) return;

    setSending(true);
    try {
      await replyWhatsApp(activeId, text);
      setDraft('');
      await invalidateWhatsApp();
      toast.success('Mensaje enviado');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'No se pudo enviar');
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="grid gap-4 lg:grid-cols-[360px_1fr]">
      <header className="lg:col-span-2">
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-xl font-bold text-slate-900 sm:text-2xl">WhatsApp</h1>
          {isRefreshing || messagesRefreshing ? <QueryRefreshingBadge /> : null}
        </div>
        <p className="mt-1 text-slate-500">
          Bandeja de entrada (admin). Responde manualmente a los clientes.
        </p>
      </header>

      <aside className="rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 px-4 py-3">
          <p className="text-sm font-semibold text-slate-900">Conversaciones</p>
          <p className="text-xs text-slate-500">
            {showInitialLoading ? 'Cargando…' : `${conversations.length} chat(s)`}
          </p>
        </div>
        <div className="max-h-[70vh] overflow-y-auto p-2">
          {conversations.length === 0 && !showInitialLoading ? (
            <p className="px-3 py-6 text-center text-sm text-slate-500">
              Aún no hay mensajes entrantes. Envía un WhatsApp y responde desde el móvil del cliente.
            </p>
          ) : (
            <ul className="space-y-1">
              {conversations.map((c) => {
                const active = c.id === activeId;
                const title = c.cliente_nombre ?? c.wa_from;
                return (
                  <li key={c.id}>
                    <button
                      type="button"
                      onClick={() => setActiveId(c.id)}
                      className={`w-full rounded-lg px-3 py-2 text-left transition ${
                        active ? 'bg-emerald-50 ring-1 ring-emerald-600/15' : 'hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <p className="truncate text-sm font-semibold text-slate-900">{title}</p>
                        <p className="shrink-0 text-[11px] text-slate-500">
                          {formatTime(c.last_message_at)}
                        </p>
                      </div>
                      <p className="mt-0.5 truncate text-xs text-slate-600">
                        {c.last_message_preview ?? '—'}
                      </p>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </aside>

      <section className="flex min-h-[60vh] flex-col rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 px-4 py-3">
          <p className="text-sm font-semibold text-slate-900">
            {activeConversation
              ? `Chat con ${activeConversation.cliente_nombre ?? activeConversation.wa_from}`
              : 'Selecciona una conversación'}
          </p>
        </div>

        <div className="flex-1 space-y-2 overflow-y-auto px-4 py-4">
          {!activeId ? (
            <p className="py-10 text-center text-sm text-slate-500">
              Selecciona una conversación para ver los mensajes.
            </p>
          ) : messagesInitialLoading ? (
            <p className="py-10 text-center text-sm text-slate-500">Cargando mensajes…</p>
          ) : messages.length === 0 ? (
            <p className="py-10 text-center text-sm text-slate-500">Sin mensajes todavía.</p>
          ) : (
            messages.map((m) => {
              const mine = m.direction === 'outbound';
              return (
                <div key={m.id} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
                  <div
                    className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm ${
                      mine
                        ? 'bg-emerald-600 text-white'
                        : 'bg-slate-100 text-slate-900'
                    }`}
                  >
                    <p className="whitespace-pre-wrap">{m.body ?? ''}</p>
                    <p className={`mt-1 text-[11px] ${mine ? 'text-emerald-50/80' : 'text-slate-500'}`}>
                      {formatTime(m.created_at)}
                    </p>
                  </div>
                </div>
              );
            })
          )}
        </div>

        <div className="border-t border-slate-200 p-3 sm:p-4">
          <div className="flex gap-2">
            <textarea
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              rows={2}
              disabled={!activeId || sending}
              placeholder={activeId ? 'Escribe una respuesta…' : 'Selecciona un chat…'}
              className="flex-1 resize-none rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 disabled:bg-slate-50 disabled:opacity-60"
            />
            <button
              type="button"
              onClick={() => void handleSend()}
              disabled={!activeId || sending || draft.trim().length === 0}
              className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-500 disabled:opacity-60"
              title="Enviar"
            >
              <SendHorizonal className="h-4 w-4" />
              Enviar
            </button>
          </div>
          <p className="mt-2 text-xs text-slate-500">
            En desarrollo: solo puedes conversar con números de prueba registrados en Meta.
          </p>
        </div>
      </section>
    </div>
  );
}
