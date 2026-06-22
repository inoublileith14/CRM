import { ConfigService } from '@nestjs/config';
import { SupabaseService } from '../supabase/supabase.service';
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
export declare class WhatsAppService {
    private config;
    private supabase;
    private readonly logger;
    constructor(config: ConfigService, supabase: SupabaseService);
    verifyWebhook(mode: string | undefined, verifyToken: string | undefined, challenge: string | undefined): string | null;
    handleWebhookPayload(body: unknown): Promise<void>;
    listConversations(): Promise<WhatsAppConversationListItem[]>;
    listMessages(conversationId: string): Promise<WhatsAppMessageItem[]>;
    reply(conversationId: string, text: string): Promise<{
        ok: true;
    }>;
    private findClienteByPhone;
    private upsertConversation;
    private insertMessage;
    bulkSend(inmuebleId: string, clienteIds: string[], senderName?: string): Promise<BulkSendWhatsAppResponse>;
    private sendTemplateMessage;
    private recordOutboundTemplateMessage;
    private setClienteGestionandoAfterWhatsApp;
}
