"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseWhatsAppWebhookPayload = parseWhatsAppWebhookPayload;
function parseWhatsAppWebhookPayload(body) {
    if (!body || typeof body !== 'object')
        return [];
    const payload = body;
    if (payload.object !== 'whatsapp_business_account')
        return [];
    const messages = [];
    for (const entry of payload.entry ?? []) {
        for (const change of entry.changes ?? []) {
            if (change.field !== 'messages')
                continue;
            for (const message of change.value?.messages ?? []) {
                if (!message.from || !message.id)
                    continue;
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
//# sourceMappingURL=whatsapp-webhook.util.js.map