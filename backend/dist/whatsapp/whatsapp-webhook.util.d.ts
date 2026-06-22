export interface WhatsAppIncomingMessage {
    from: string;
    messageId: string;
    timestamp: string;
    type: string;
    text?: string;
}
export declare function parseWhatsAppWebhookPayload(body: unknown): WhatsAppIncomingMessage[];
