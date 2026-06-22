import { parseApiResponse } from './parse-api-error';
import { ApiError } from './api';

export interface WhatsAppSendResult {
  clienteId: string;
  nombre: string;
  telefono: string | null;
  ok: boolean;
  messageId?: string;
  gestionEstado?: string;
  fechaUltimaGestion?: string;
  error?: string;
}

export interface BulkSendWhatsAppResponse {
  sent: number;
  failed: number;
  results: WhatsAppSendResult[];
}

export async function bulkSendWhatsApp(
  inmuebleId: string,
  clienteIds: string[],
): Promise<BulkSendWhatsAppResponse> {
  let res: Response;

  try {
    res = await fetch('/api/whatsapp/bulk-send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ inmuebleId, clienteIds }),
    });
  } catch {
    throw new ApiError(
      'No se pudo conectar con el servidor',
      0,
      'NETWORK_ERROR',
    );
  }

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw parseApiResponse(data, res);
  }

  return data as BulkSendWhatsAppResponse;
}
