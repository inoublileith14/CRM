import { Request } from 'express';
import { UserProfile } from '../auth/interfaces/user.interface';
import { BulkSendWhatsAppDto } from './dto/bulk-send.dto';
import { WhatsAppService } from './whatsapp.service';
export declare class WhatsAppController {
    private whatsappService;
    constructor(whatsappService: WhatsAppService);
    bulkSend(req: Request & {
        user: UserProfile;
    }, dto: BulkSendWhatsAppDto): Promise<import("./whatsapp.service").BulkSendWhatsAppResponse>;
    listConversations(req: Request & {
        user: UserProfile;
    }): Promise<import("./whatsapp.service").WhatsAppConversationListItem[]>;
    listMessages(req: Request & {
        user: UserProfile;
    }, conversationId: string): Promise<import("./whatsapp.service").WhatsAppMessageItem[]>;
    reply(req: Request & {
        user: UserProfile;
    }, conversationId: string, body: {
        text?: string;
    }): Promise<{
        ok: true;
    }>;
    verifyWebhook(mode: string, verifyToken: string, challenge: string): string;
    handleWebhook(body: unknown): Promise<{
        received: boolean;
    }>;
}
