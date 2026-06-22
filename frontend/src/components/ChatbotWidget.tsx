'use client';

import Image from 'next/image';
import { Loader2, Send, X } from 'lucide-react';
import { FormEvent, useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import { ChatMessage, sendChatMessage } from '@/lib/chat-api';

const WELCOME: ChatMessage = {
  role: 'assistant',
  content:
    'Hola, soy Coconut AI. Pregúntame cómo usar el panel: clientes, inmuebles, importar Excel, Gestión, invitaciones de trabajadores, etc.',
};

export function ChatbotWidget() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([WELCOME]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open && listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight;
    }
  }, [messages, open, sending]);

  useEffect(() => {
    if (open) {
      inputRef.current?.focus();
    }
  }, [open]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const text = input.trim();
    if (!text || sending) return;

    const userMessage: ChatMessage = { role: 'user', content: text };
    const historyForApi = messages.slice(1);
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setSending(true);

    try {
      const { reply } = await sendChatMessage(text, historyForApi);
      setMessages((prev) => [...prev, { role: 'assistant', content: reply }]);
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : 'No se pudo obtener respuesta del asistente',
      );
      setMessages((prev) => prev.slice(0, -1));
      setInput(text);
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="pointer-events-none fixed bottom-4 right-4 z-50 flex flex-col items-end gap-3 sm:bottom-6 sm:right-6">
      {open && (
        <div
          className="pointer-events-auto flex w-[min(100vw-2rem,22rem)] flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl shadow-slate-900/15"
          role="dialog"
          aria-label="Asistente Coconut"
        >
          <div className="flex shrink-0 items-center justify-between border-b border-slate-100 bg-gradient-to-r from-slate-900 to-slate-800 px-4 py-3">
            <div className="flex items-center gap-2.5">
              <div className="relative h-9 w-9 overflow-hidden rounded-full ring-2 ring-amber-400/60">
                <Image
                  src="/coconut-chat-logo.png"
                  alt="Coconut"
                  fill
                  className="object-cover"
                  sizes="36px"
                />
              </div>
              <div>
                <p className="text-sm font-semibold text-white">Coconut AI</p>
                <p className="text-xs text-slate-300">Asistente inmobiliario</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="rounded-lg p-1.5 text-slate-300 transition hover:bg-white/10 hover:text-white"
              aria-label="Cerrar chat"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div
            ref={listRef}
            className="flex max-h-72 min-h-[12rem] flex-col gap-3 overflow-y-auto bg-slate-50 px-3 py-4"
          >
            {messages.map((msg, index) => (
              <div
                key={`${msg.role}-${index}`}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[90%] whitespace-pre-wrap rounded-2xl px-3 py-2 text-sm leading-relaxed ${
                    msg.role === 'user'
                      ? 'bg-emerald-600 text-white'
                      : 'border border-slate-200 bg-white text-slate-800'
                  }`}
                >
                  {msg.content}
                </div>
              </div>
            ))}
            {sending && (
              <div className="flex justify-start">
                <div className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-500">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Escribiendo…
                </div>
              </div>
            )}
          </div>

          <form
            onSubmit={handleSubmit}
            className="shrink-0 border-t border-slate-100 bg-white p-3"
          >
            <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                disabled={sending}
                placeholder="Escribe un mensaje…"
                maxLength={2000}
                className="min-w-0 flex-1 bg-transparent text-sm text-slate-900 outline-none placeholder:text-slate-400 disabled:opacity-60"
              />
              <button
                type="submit"
                disabled={sending || !input.trim()}
                className="shrink-0 rounded-lg bg-emerald-600 p-2 text-white transition hover:bg-emerald-500 disabled:opacity-40"
                aria-label="Enviar mensaje"
              >
                <Send className="h-4 w-4" />
              </button>
            </div>
          </form>
        </div>
      )}

      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="pointer-events-auto group relative h-14 w-14 overflow-hidden rounded-full bg-black shadow-lg shadow-black/30 ring-2 ring-amber-400/50 transition hover:scale-105 hover:ring-amber-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 sm:h-16 sm:w-16"
        aria-label={open ? 'Cerrar asistente' : 'Abrir asistente'}
        aria-expanded={open}
      >
        <Image
          src="/coconut-chat-logo.png"
          alt="Abrir asistente Coconut"
          fill
          className="object-cover transition group-hover:brightness-110"
          sizes="64px"
          priority
        />
      </button>
    </div>
  );
}
