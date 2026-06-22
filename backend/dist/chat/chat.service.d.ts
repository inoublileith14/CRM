import { ConfigService } from '@nestjs/config';
import { ChatRequestDto } from './dto/chat-request.dto';
export declare class ChatService {
    private config;
    private readonly logger;
    private knowledgeCache;
    constructor(config: ConfigService);
    complete(dto: ChatRequestDto): Promise<{
        reply: string;
    }>;
    private extractOutputText;
    private sanitizeHistory;
    private buildSystemPrompt;
    private loadKnowledge;
}
