import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import { ChatMessageDto, ChatRequestDto } from './dto/chat-request.dto';

const MAX_MESSAGE_LENGTH = 2000;
const MAX_HISTORY_MESSAGES = 10;
const MAX_CONTEXT_CHARS = 28_000;

interface OpenAIResponsesBody {
  output_text?: string;
  output?: Array<{
    type?: string;
    content?: Array<{ type?: string; text?: string }>;
  }>;
  error?: { message?: string; code?: string; type?: string };
}

@Injectable()
export class ChatService {
  private readonly logger = new Logger(ChatService.name);
  private knowledgeCache: string | null = null;

  constructor(private config: ConfigService) {}

  async complete(dto: ChatRequestDto): Promise<{ reply: string }> {
    const apiKey = this.config.get<string>('OPENAI_API_KEY');
    if (!apiKey?.trim()) {
      throw new ServiceUnavailableException(
        'El asistente no está configurado (falta OPENAI_API_KEY)',
      );
    }

    const message = dto.message?.trim();
    if (!message) {
      throw new BadRequestException('El mensaje no puede estar vacío');
    }
    if (message.length > MAX_MESSAGE_LENGTH) {
      throw new BadRequestException(
        `El mensaje no puede superar ${MAX_MESSAGE_LENGTH} caracteres`,
      );
    }

    const history = this.sanitizeHistory(dto.history ?? []);
    const model =
      this.config.get<string>('OPENAI_MODEL')?.trim() || 'gpt-5.4-mini';

    const instructions = this.buildSystemPrompt();
    const input: { role: string; content: string }[] = [
      ...history.map((m) => ({ role: m.role, content: m.content })),
      { role: 'user', content: message },
    ];

    let response: Response;
    try {
      response = await fetch('https://api.openai.com/v1/responses', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model,
          instructions,
          input,
          max_output_tokens: 800,
          store: false,
        }),
      });
    } catch (error) {
      this.logger.error(`OpenAI network error: ${error}`);
      throw new ServiceUnavailableException(
        'No se pudo conectar con el asistente',
      );
    }

    const data = (await response.json().catch(() => ({}))) as OpenAIResponsesBody;

    if (!response.ok) {
      const apiMessage = data.error?.message ?? 'unknown';
      this.logger.error(
        `OpenAI API error ${response.status}: ${apiMessage}`,
      );

      if (response.status === 429) {
        throw new ServiceUnavailableException(
          'Cuota de OpenAI agotada o límite de peticiones. Revisa facturación en platform.openai.com.',
        );
      }

      if (response.status === 401) {
        throw new ServiceUnavailableException(
          'Clave de OpenAI no válida. Revisa OPENAI_API_KEY.',
        );
      }

      throw new ServiceUnavailableException(
        `El asistente no está disponible (${apiMessage})`,
      );
    }

    const reply = this.extractOutputText(data);
    if (!reply) {
      this.logger.error(
        `OpenAI empty response for model ${model}: ${JSON.stringify(data).slice(0, 500)}`,
      );
      throw new InternalServerErrorException(
        'El asistente no devolvió una respuesta',
      );
    }

    return { reply };
  }

  private extractOutputText(data: OpenAIResponsesBody): string | null {
    if (data.output_text?.trim()) {
      return data.output_text.trim();
    }

    for (const item of data.output ?? []) {
      if (item.type !== 'message' || !item.content) continue;
      const parts = item.content
        .filter(
          (part) =>
            (part.type === 'output_text' || part.type === 'text') && part.text,
        )
        .map((part) => part.text!.trim())
        .filter(Boolean);
      if (parts.length > 0) {
        return parts.join('\n');
      }
    }

    return null;
  }

  private sanitizeHistory(history: ChatMessageDto[]): ChatMessageDto[] {
    return history
      .filter(
        (m) =>
          (m.role === 'user' || m.role === 'assistant') &&
          typeof m.content === 'string' &&
          m.content.trim().length > 0,
      )
      .slice(-MAX_HISTORY_MESSAGES)
      .map((m) => ({
        role: m.role,
        content: m.content.trim().slice(0, MAX_MESSAGE_LENGTH),
      }));
  }

  private buildSystemPrompt(): string {
    const knowledge = this.loadKnowledge();
    return `Eres Coconut AI, el asistente de soporte de la plataforma Coconut (gestión inmobiliaria: inmuebles alquiler/venta, clientes, propietarios, trabajadores).

REGLAS:
- Responde en el mismo idioma que el usuario (español por defecto).
- Responde SOLO sobre cómo usar la plataforma Coconut, según la guía siguiente.
- NO inventes funciones que no estén en la guía.
- NO tienes acceso a datos en vivo (clientes, inmuebles, contraseñas). Si preguntan por datos concretos, explica cómo verlos en el panel o que contacten al administrador.
- Sé breve, claro y práctico. Usa listas numeradas para pasos.
- Si no sabes la respuesta, dilo y sugiere revisar la sección correspondiente del menú o contactar al administrador.

GUÍA DE LA PLATAFORMA:
${knowledge}`.slice(0, MAX_CONTEXT_CHARS);
  }

  private loadKnowledge(): string {
    if (this.knowledgeCache) return this.knowledgeCache;

    const candidates = [
      join(__dirname, 'knowledge', 'guia-usuario.md'),
      join(process.cwd(), 'src', 'chat', 'knowledge', 'guia-usuario.md'),
      join(process.cwd(), 'knowledge', 'guia-usuario.md'),
      join(process.cwd(), '..', 'GUIA-USUARIO.md'),
    ];

    for (const filePath of candidates) {
      if (existsSync(filePath)) {
        this.knowledgeCache = readFileSync(filePath, 'utf-8');
        return this.knowledgeCache;
      }
    }

    this.logger.warn('Guía de usuario no encontrada; usando resumen mínimo');
    this.knowledgeCache =
      'Coconut es un panel para gestionar inmuebles, clientes, propietarios y trabajadores. Menú: Panel, Clientes, Propietarios, Trabajadores, Casas alquiler, Casas venta.';
    return this.knowledgeCache;
  }
}
