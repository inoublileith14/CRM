import { ChatService } from './chat.service';
import { ChatRequestDto } from './dto/chat-request.dto';
export declare class ChatController {
    private chatService;
    constructor(chatService: ChatService);
    complete(dto: ChatRequestDto): Promise<{
        reply: string;
    }>;
}
