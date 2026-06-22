export interface WhatsAppIncomingMessage {
  from: string;
  messageId: string;
  timestamp: string;
  type: string;
  text?: string;
}

export function parseWhatsAppWebhookPayload(
  body: unknown,
): WhatsAppIncomingMessage[] {
  if (!body || typeof body !== 'object') return [];

  const payload = body as {
    object?: string;
    entry?: Array<{
      changes?: Array<{
        field?: string;
        value?: {
          messages?: Array<{
            from?: string;
            id?: string;
            timestamp?: string;
            type?: string;
            text?: { body?: string };
          }>;
        };
      }>;
    }>;
  };

  if (payload.object !== 'whatsapp_business_account') return [];

  const messages: WhatsAppIncomingMessage[] = [];

  for (const entry of payload.entry ?? []) {
    for (const change of entry.changes ?? []) {
      if (change.field !== 'messages') continue;

      for (const message of change.value?.messages ?? []) {
        if (!message.from || !message.id) continue;

        messages.push({
          from: message.from,
          messageId: message.id,
          timestamp: message.timestamp ?? '',
          type: message.type ?? 'unknown',
          text: message.text?.body,
        });
      }
    }
  }

  return messages;
}
