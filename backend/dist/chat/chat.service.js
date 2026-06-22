"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var ChatService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChatService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const fs_1 = require("fs");
const path_1 = require("path");
const MAX_MESSAGE_LENGTH = 2000;
const MAX_HISTORY_MESSAGES = 10;
const MAX_CONTEXT_CHARS = 28_000;
let ChatService = ChatService_1 = class ChatService {
    config;
    logger = new common_1.Logger(ChatService_1.name);
    knowledgeCache = null;
    constructor(config) {
        this.config = config;
    }
    async complete(dto) {
        const apiKey = this.config.get('OPENAI_API_KEY');
        if (!apiKey?.trim()) {
            throw new common_1.ServiceUnavailableException('El asistente no está configurado (falta OPENAI_API_KEY)');
        }
        const message = dto.message?.trim();
        if (!message) {
            throw new common_1.BadRequestException('El mensaje no puede estar vacío');
        }
        if (message.length > MAX_MESSAGE_LENGTH) {
            throw new common_1.BadRequestException(`El mensaje no puede superar ${MAX_MESSAGE_LENGTH} caracteres`);
        }
        const history = this.sanitizeHistory(dto.history ?? []);
        const model = this.config.get('OPENAI_MODEL')?.trim() || 'gpt-5.4-mini';
        const instructions = this.buildSystemPrompt();
        const input = [
            ...history.map((m) => ({ role: m.role, content: m.content })),
            { role: 'user', content: message },
        ];
        let response;
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
        }
        catch (error) {
            this.logger.error(`OpenAI network error: ${error}`);
            throw new common_1.ServiceUnavailableException('No se pudo conectar con el asistente');
        }
        const data = (await response.json().catch(() => ({})));
        if (!response.ok) {
            const apiMessage = data.error?.message ?? 'unknown';
            this.logger.error(`OpenAI API error ${response.status}: ${apiMessage}`);
            if (response.status === 429) {
                throw new common_1.ServiceUnavailableException('Cuota de OpenAI agotada o límite de peticiones. Revisa facturación en platform.openai.com.');
            }
            if (response.status === 401) {
                throw new common_1.ServiceUnavailableException('Clave de OpenAI no válida. Revisa OPENAI_API_KEY.');
            }
            throw new common_1.ServiceUnavailableException(`El asistente no está disponible (${apiMessage})`);
        }
        const reply = this.extractOutputText(data);
        if (!reply) {
            this.logger.error(`OpenAI empty response for model ${model}: ${JSON.stringify(data).slice(0, 500)}`);
            throw new common_1.InternalServerErrorException('El asistente no devolvió una respuesta');
        }
        return { reply };
    }
    extractOutputText(data) {
        if (data.output_text?.trim()) {
            return data.output_text.trim();
        }
        for (const item of data.output ?? []) {
            if (item.type !== 'message' || !item.content)
                continue;
            const parts = item.content
                .filter((part) => (part.type === 'output_text' || part.type === 'text') && part.text)
                .map((part) => part.text.trim())
                .filter(Boolean);
            if (parts.length > 0) {
                return parts.join('\n');
            }
        }
        return null;
    }
    sanitizeHistory(history) {
        return history
            .filter((m) => (m.role === 'user' || m.role === 'assistant') &&
            typeof m.content === 'string' &&
            m.content.trim().length > 0)
            .slice(-MAX_HISTORY_MESSAGES)
            .map((m) => ({
            role: m.role,
            content: m.content.trim().slice(0, MAX_MESSAGE_LENGTH),
        }));
    }
    buildSystemPrompt() {
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
    loadKnowledge() {
        if (this.knowledgeCache)
            return this.knowledgeCache;
        const candidates = [
            (0, path_1.join)(__dirname, 'knowledge', 'guia-usuario.md'),
            (0, path_1.join)(process.cwd(), 'src', 'chat', 'knowledge', 'guia-usuario.md'),
            (0, path_1.join)(process.cwd(), 'knowledge', 'guia-usuario.md'),
            (0, path_1.join)(process.cwd(), '..', 'GUIA-USUARIO.md'),
        ];
        for (const filePath of candidates) {
            if ((0, fs_1.existsSync)(filePath)) {
                this.knowledgeCache = (0, fs_1.readFileSync)(filePath, 'utf-8');
                return this.knowledgeCache;
            }
        }
        this.logger.warn('Guía de usuario no encontrada; usando resumen mínimo');
        this.knowledgeCache =
            'Coconut es un panel para gestionar inmuebles, clientes, propietarios y trabajadores. Menú: Panel, Clientes, Propietarios, Trabajadores, Casas alquiler, Casas venta.';
        return this.knowledgeCache;
    }
};
exports.ChatService = ChatService;
exports.ChatService = ChatService = ChatService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], ChatService);
//# sourceMappingURL=chat.service.js.map