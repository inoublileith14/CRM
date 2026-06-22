import { ApiError } from '@/lib/api';
import { parseApiResponse } from '@/lib/parse-api-error';

export interface WhatsAppConversationListItem {
  id: string;
  wa_from: string;
  cliente_id: string | null;
  cliente_nombre: string | null;
  last_message_at: string;
  last_message_preview: string | null;
}

export interface WhatsAppMessageItem {
  id: string;
  direction: 'inbound' | 'outbound';
  from_phone: string | null;
  body: string | null;
  created_at: string;
}

async function request<T>(url: string, init?: RequestInit): Promise<T> {
  let res: Response;
  try {
    res = await fetch(url, init);
  } catch {
    throw new ApiError('No se pudo conectar con el servidor', 0, 'NETWORK_ERROR');
  }

  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw parseApiResponse(data, res);
  return data as T;
}

export function getWhatsAppConversations(): Promise<WhatsAppConversationListItem[]> {
  return request<WhatsAppConversationListItem[]>('/api/whatsapp/conversations');
}

export function getWhatsAppMessages(
  conversationId: string,
): Promise<WhatsAppMessageItem[]> {
  return request<WhatsAppMessageItem[]>(
    `/api/whatsapp/conversations/${conversationId}/messages`,
  );
}

export function replyWhatsApp(
  conversationId: string,
  text: string,
): Promise<{ ok: true }> {
  return request<{ ok: true }>(`/api/whatsapp/conversations/${conversationId}/reply`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text }),
  });
}

