'use client';

import { useState } from 'react';
import { Loader2, MessageCircle } from 'lucide-react';
import { toast } from 'sonner';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { bulkSendWhatsApp } from '@/lib/whatsapp-api';

export type WhatsAppSentUpdate = {
  clienteId: string;
  gestionEstado: string;
  fechaUltimaGestion: string;
};

const compactToolbarButtonClass =
  'inline-flex h-7 w-[11.25rem] shrink-0 items-center justify-center gap-1 whitespace-nowrap rounded-md px-2 text-xs font-semibold';

interface ClienteWhatsAppButtonProps {
  inmuebleId: string;
  clienteIds: string[];
  disabled?: boolean;
  compact?: boolean;
  onSent?: (updates: WhatsAppSentUpdate[]) => void;
}

export function ClienteWhatsAppButton({
  inmuebleId,
  clienteIds,
  disabled,
  compact,
  onSent,
}: ClienteWhatsAppButtonProps) {
  const [sending, setSending] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const count = clienteIds.length;

  async function handleConfirmSend() {
    setSending(true);
    try {
      const result = await bulkSendWhatsApp(inmuebleId, clienteIds);

      const gestionUpdates: WhatsAppSentUpdate[] = result.results
        .filter(
          (item) =>
            item.ok &&
            item.gestionEstado &&
            item.fechaUltimaGestion,
        )
        .map((item) => ({
          clienteId: item.clienteId,
          gestionEstado: item.gestionEstado!,
          fechaUltimaGestion: item.fechaUltimaGestion!,
        }));

      if (gestionUpdates.length > 0) {
        onSent?.(gestionUpdates);
      }

      if (result.sent > 0 && result.failed === 0) {
        toast.success(
          `${result.sent} mensaje${result.sent !== 1 ? 's' : ''} enviado${result.sent !== 1 ? 's' : ''}`,
        );
        setConfirmOpen(false);
      } else if (result.sent > 0) {
        toast.warning(
          `${result.sent} enviado${result.sent !== 1 ? 's' : ''}, ${result.failed} fallido${result.failed !== 1 ? 's' : ''}.`,
        );
        setConfirmOpen(false);
      } else {
        toast.error('No se pudo enviar a ningún cliente.');
      }
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Error al enviar WhatsApp',
      );
    } finally {
      setSending(false);
    }
  }

  function handleOpenConfirm() {
    if (clienteIds.length === 0) {
      toast.error('Selecciona al menos un cliente');
      return;
    }
    setConfirmOpen(true);
  }

  return (
    <>
      <button
        type="button"
        onClick={handleOpenConfirm}
        disabled={disabled || sending || clienteIds.length === 0}
        className={
          compact
            ? `${compactToolbarButtonClass} border border-[#25D366] bg-white text-[#128C7E] transition hover:bg-[#25D366]/10 disabled:opacity-60`
            : 'inline-flex w-full items-center justify-center gap-2 rounded-lg border border-[#25D366] bg-white px-4 py-2.5 text-sm font-semibold text-[#128C7E] transition hover:bg-[#25D366]/10 disabled:opacity-60 sm:w-auto'
        }
        title="Enviar plantilla de visita a los clientes seleccionados"
      >
        {sending ? (
          <Loader2 className={compact ? 'h-3.5 w-3.5 animate-spin' : 'h-4 w-4 animate-spin'} />
        ) : (
          <MessageCircle className={compact ? 'h-3.5 w-3.5' : 'h-4 w-4'} />
        )}
        {sending ? 'Enviando…' : 'Whatsipiando'}
      </button>

      <ConfirmDialog
        open={confirmOpen}
        title="Enviar WhatsApp"
        description={`¿Enviar plantilla de WhatsApp (Coconut Luxury Flats) a ${count} cliente${count !== 1 ? 's' : ''}? Tras el envío, su gestión pasará a GESTIONANDO.`}
        confirmLabel="Enviar"
        confirmButtonClassName="bg-[#128C7E] hover:bg-[#0f7a6d]"
        loading={sending}
        onConfirm={() => void handleConfirmSend()}
        onCancel={() => setConfirmOpen(false)}
      />
    </>
  );
}
