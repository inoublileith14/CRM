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
var WhatsAppService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.WhatsAppService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const supabase_service_1 = require("../supabase/supabase.service");
const whatsapp_phone_util_1 = require("./whatsapp-phone.util");
const whatsapp_webhook_util_1 = require("./whatsapp-webhook.util");
let WhatsAppService = WhatsAppService_1 = class WhatsAppService {
    config;
    supabase;
    logger = new common_1.Logger(WhatsAppService_1.name);
    constructor(config, supabase) {
        this.config = config;
        this.supabase = supabase;
    }
    verifyWebhook(mode, verifyToken, challenge) {
        const expectedToken = this.config
            .get('WHATSAPP_WEBHOOK_VERIFY_TOKEN')
            ?.trim();
        if (!expectedToken) {
            this.logger.error('WHATSAPP_WEBHOOK_VERIFY_TOKEN no está configurado');
            return null;
        }
        if (mode !== 'subscribe' || verifyToken !== expectedToken || !challenge) {
            return null;
        }
        return challenge;
    }
    async handleWebhookPayload(body) {
        const messages = (0, whatsapp_webhook_util_1.parseWhatsAppWebhookPayload)(body);
        if (messages.length === 0)
            return;
        for (const message of messages) {
            const text = message.text ?? '';
            const cliente = await this.findClienteByPhone(message.from);
            const conversationId = await this.upsertConversation({
                waFrom: message.from,
                clienteId: cliente?.id ?? null,
                lastMessageAt: message.timestamp
                    ? new Date(Number(message.timestamp) * 1000).toISOString()
                    : new Date().toISOString(),
                lastMessagePreview: text.slice(0, 200) || `[${message.type}]`,
            });
            await this.insertMessage({
                conversationId,
                direction: 'inbound',
                fromPhone: message.from,
                body: text || null,
                waMessageId: message.messageId,
            });
            this.logger.log(`WhatsApp inbound from ${message.from}${cliente?.nombre ? ` (${cliente.nombre})` : ''}: ${text || `[${message.type}]`}`);
        }
    }
    async listConversations() {
        const { data, error } = await this.supabase
            .getAdmin()
            .from('whatsapp_conversations')
            .select('id, wa_from, cliente_id, last_message_at, last_message_preview')
            .order('last_message_at', { ascending: false })
            .limit(200);
        if (error) {
            this.logger.error(`Error loading conversations: ${error.message}`);
            throw new common_1.InternalServerErrorException('No se pudieron cargar los chats');
        }
        const rows = data ?? [];
        const clienteIds = [
            ...new Set(rows.map((r) => r.cliente_id).filter(Boolean)),
        ];
        const clienteNameById = new Map();
        if (clienteIds.length > 0) {
            const { data: clientes, error: clientesError } = await this.supabase
                .getAdmin()
                .from('clientes')
                .select('id, nombre')
                .in('id', clienteIds);
            if (!clientesError) {
                for (const c of clientes ?? []) {
                    clienteNameById.set(c.id, c.nombre);
                }
            }
        }
        return rows.map((r) => ({
            id: r.id,
            wa_from: r.wa_from,
            cliente_id: r.cliente_id ?? null,
            cliente_nombre: r.cliente_id
                ? clienteNameById.get(r.cliente_id) ?? null
                : null,
            last_message_at: r.last_message_at,
            last_message_preview: r.last_message_preview ?? null,
        }));
    }
    async listMessages(conversationId) {
        const { data, error } = await this.supabase
            .getAdmin()
            .from('whatsapp_messages')
            .select('id, direction, from_phone, body, created_at')
            .eq('conversation_id', conversationId)
            .order('created_at', { ascending: true })
            .limit(500);
        if (error) {
            this.logger.error(`Error loading messages: ${error.message}`);
            throw new common_1.InternalServerErrorException('No se pudieron cargar los mensajes');
        }
        return (data ?? []).map((m) => ({
            id: m.id,
            direction: m.direction,
            from_phone: m.from_phone ?? null,
            body: m.body ?? null,
            created_at: m.created_at,
        }));
    }
    async reply(conversationId, text) {
        const message = text.trim();
        if (!message) {
            throw new common_1.BadRequestException('El mensaje no puede estar vacío');
        }
        const { data: convo, error } = await this.supabase
            .getAdmin()
            .from('whatsapp_conversations')
            .select('id, wa_from')
            .eq('id', conversationId)
            .maybeSingle();
        if (error) {
            this.logger.error(`Error loading conversation: ${error.message}`);
            throw new common_1.InternalServerErrorException('No se pudo cargar el chat');
        }
        if (!convo?.wa_from) {
            throw new common_1.BadRequestException('Chat no encontrado');
        }
        const token = this.config.get('TOKEN_WHATSAPP')?.trim();
        const phoneNumberId = this.config.get('WHATSAPP_PHONE_NUMBER_ID')?.trim() ||
            this.config.get('PHONE_NUMBER')?.trim();
        if (!token || !phoneNumberId) {
            throw new common_1.ServiceUnavailableException('WhatsApp no configurado');
        }
        const graphVersion = this.config.get('WHATSAPP_GRAPH_VERSION')?.trim() || 'v22.0';
        const body = {
            messaging_product: 'whatsapp',
            to: convo.wa_from,
            type: 'text',
            text: { body: message },
        };
        let response;
        try {
            response = await fetch(`https://graph.facebook.com/${graphVersion}/${phoneNumberId}/messages`, {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(body),
            });
        }
        catch (err) {
            this.logger.error(`Meta API network error: ${err}`);
            throw new common_1.ServiceUnavailableException('No se pudo conectar con WhatsApp');
        }
        const data = (await response.json().catch(() => ({})));
        if (!response.ok) {
            const detail = data.error?.message ?? `HTTP ${response.status}`;
            throw new common_1.BadRequestException(detail);
        }
        const waMessageId = data.messages?.[0]?.id ?? null;
        await this.insertMessage({
            conversationId,
            direction: 'outbound',
            fromPhone: null,
            body: message,
            waMessageId,
        });
        await this.supabase
            .getAdmin()
            .from('whatsapp_conversations')
            .update({
            last_message_at: new Date().toISOString(),
            last_message_preview: message.slice(0, 200),
            updated_at: new Date().toISOString(),
        })
            .eq('id', conversationId);
        return { ok: true };
    }
    async findClienteByPhone(waFrom) {
        const { data, error } = await this.supabase
            .getAdmin()
            .from('clientes')
            .select('id, nombre, telefono')
            .not('telefono', 'is', null);
        if (error || !data?.length)
            return null;
        const target = waFrom.replace(/\D/g, '');
        for (const cliente of data) {
            const normalized = (0, whatsapp_phone_util_1.formatWhatsAppRecipient)(cliente.telefono);
            if (normalized === target) {
                return { id: cliente.id, nombre: cliente.nombre };
            }
        }
        return null;
    }
    async upsertConversation(params) {
        const { data: existing, error: existingError } = await this.supabase
            .getAdmin()
            .from('whatsapp_conversations')
            .select('id')
            .eq('wa_from', params.waFrom)
            .maybeSingle();
        if (existingError) {
            this.logger.error(`Error reading whatsapp_conversations: ${existingError.message}`);
            throw new common_1.InternalServerErrorException('No se pudo guardar el chat');
        }
        if (existing?.id) {
            const { error } = await this.supabase
                .getAdmin()
                .from('whatsapp_conversations')
                .update({
                cliente_id: params.clienteId,
                last_message_at: params.lastMessageAt,
                last_message_preview: params.lastMessagePreview,
                updated_at: new Date().toISOString(),
            })
                .eq('id', existing.id);
            if (error) {
                this.logger.error(`Error updating whatsapp_conversations: ${error.message}`);
                throw new common_1.InternalServerErrorException('No se pudo guardar el chat');
            }
            return existing.id;
        }
        const now = new Date().toISOString();
        const { data, error } = await this.supabase
            .getAdmin()
            .from('whatsapp_conversations')
            .insert({
            cliente_id: params.clienteId,
            wa_from: params.waFrom,
            last_message_at: params.lastMessageAt,
            last_message_preview: params.lastMessagePreview,
            created_at: now,
            updated_at: now,
        })
            .select('id')
            .single();
        if (error || !data?.id) {
            this.logger.error(`Error inserting whatsapp_conversations: ${error?.message ?? 'unknown'}`);
            throw new common_1.InternalServerErrorException('No se pudo guardar el chat');
        }
        return data.id;
    }
    async insertMessage(params) {
        const { error } = await this.supabase
            .getAdmin()
            .from('whatsapp_messages')
            .insert({
            conversation_id: params.conversationId,
            direction: params.direction,
            from_phone: params.fromPhone,
            body: params.body,
            wa_message_id: params.waMessageId,
        });
        if (error) {
            this.logger.error(`Error inserting whatsapp_messages: ${error.message}`);
            throw new common_1.InternalServerErrorException('No se pudo guardar el mensaje');
        }
    }
    async bulkSend(inmuebleId, clienteIds, senderName) {
        const ids = [...new Set(clienteIds.map((id) => id.trim()).filter(Boolean))];
        if (ids.length === 0) {
            throw new common_1.BadRequestException('No hay clientes para enviar');
        }
        const token = this.config.get('TOKEN_WHATSAPP')?.trim();
        const phoneNumberId = this.config.get('WHATSAPP_PHONE_NUMBER_ID')?.trim() ||
            this.config.get('PHONE_NUMBER')?.trim();
        if (!token) {
            throw new common_1.ServiceUnavailableException('WhatsApp no configurado (falta TOKEN_WHATSAPP)');
        }
        if (!phoneNumberId) {
            throw new common_1.ServiceUnavailableException('WhatsApp no configurado (falta WHATSAPP_PHONE_NUMBER_ID o PHONE_NUMBER)');
        }
        const templateName = this.config.get('WHATSAPP_TEMPLATE_NAME')?.trim() ||
            'coconut_luxury_flats';
        const templateLanguage = this.config.get('WHATSAPP_TEMPLATE_LANGUAGE')?.trim() || 'es';
        const agentName = senderName?.trim() ||
            this.config.get('WHATSAPP_SENDER_NAME')?.trim() ||
            'Coconut Luxury Flats';
        const { data: inmueble, error: inmuebleError } = await this.supabase
            .getAdmin()
            .from('inmuebles')
            .select('id, tipo_operacion, link_idealista_espejo, ficha_del_piso_real, imagen_real, foto_espejo')
            .eq('id', inmuebleId)
            .maybeSingle();
        if (inmuebleError) {
            this.logger.error(`Error loading inmueble for WhatsApp: ${inmuebleError.message}`);
            throw new common_1.InternalServerErrorException('No se pudo cargar el inmueble');
        }
        if (!inmueble) {
            throw new common_1.BadRequestException('Inmueble no encontrado');
        }
        const propertyLink = inmueble.link_idealista_espejo?.trim() ||
            inmueble.ficha_del_piso_real?.trim() ||
            '';
        if (!propertyLink) {
            throw new common_1.BadRequestException('El inmueble no tiene link de Idealista ni ficha del piso real');
        }
        const headerImageUrl = inmueble.imagen_real?.trim() ||
            inmueble.foto_espejo?.trim() ||
            '';
        if (!headerImageUrl.startsWith('https://')) {
            throw new common_1.BadRequestException('El inmueble necesita imagen real o foto espejo con URL HTTPS pública para enviar la plantilla de WhatsApp');
        }
        const { data, error } = await this.supabase
            .getAdmin()
            .from('cliente_inmuebles')
            .select('cliente_id, clientes!inner(id, nombre, telefono)')
            .eq('inmueble_id', inmuebleId)
            .in('cliente_id', ids);
        if (error) {
            this.logger.error(`Error loading clientes for WhatsApp: ${error.message}`);
            throw new common_1.InternalServerErrorException('No se pudieron cargar los clientes del inmueble');
        }
        const rows = data ?? [];
        if (rows.length === 0) {
            throw new common_1.BadRequestException('Ningún cliente pertenece a este inmueble');
        }
        const tipoOperacion = inmueble.tipo_operacion;
        if (tipoOperacion !== 'alquiler' && tipoOperacion !== 'venta') {
            throw new common_1.BadRequestException('Tipo de inmueble no válido');
        }
        const results = [];
        for (const row of rows) {
            const rawCliente = row.clientes;
            const cliente = (Array.isArray(rawCliente) ? rawCliente[0] : rawCliente);
            if (!cliente)
                continue;
            const waTo = (0, whatsapp_phone_util_1.formatWhatsAppRecipient)(cliente.telefono);
            if (!waTo) {
                results.push({
                    clienteId: cliente.id,
                    nombre: cliente.nombre,
                    telefono: cliente.telefono,
                    ok: false,
                    error: 'Sin teléfono válido',
                });
                continue;
            }
            try {
                const messageId = await this.sendTemplateMessage({
                    token,
                    phoneNumberId,
                    to: waTo,
                    templateName,
                    templateLanguage,
                    headerImageUrl,
                    bodyParameters: [
                        cliente.nombre.trim() || 'Cliente',
                        agentName,
                        propertyLink,
                    ],
                });
                await this.recordOutboundTemplateMessage({
                    waTo,
                    clienteId: cliente.id,
                    clienteNombre: cliente.nombre,
                    agentName,
                    propertyLink,
                    waMessageId: messageId,
                });
                const gestionUpdate = await this.setClienteGestionandoAfterWhatsApp(inmuebleId, cliente.id, tipoOperacion);
                results.push({
                    clienteId: cliente.id,
                    nombre: cliente.nombre,
                    telefono: cliente.telefono,
                    ok: true,
                    messageId,
                    gestionEstado: gestionUpdate.gestion_estado,
                    fechaUltimaGestion: gestionUpdate.fecha_ultima_gestion,
                });
            }
            catch (err) {
                const message = err instanceof Error ? err.message : 'Error al enviar mensaje';
                this.logger.warn(`WhatsApp send failed for ${cliente.id} (${waTo}): ${message}`);
                results.push({
                    clienteId: cliente.id,
                    nombre: cliente.nombre,
                    telefono: cliente.telefono,
                    ok: false,
                    error: message,
                });
            }
        }
        return {
            sent: results.filter((r) => r.ok).length,
            failed: results.filter((r) => !r.ok).length,
            results,
        };
    }
    async sendTemplateMessage(params) {
        const graphVersion = this.config.get('WHATSAPP_GRAPH_VERSION')?.trim() || 'v22.0';
        const urlButtonIndex = this.config.get('WHATSAPP_TEMPLATE_URL_BUTTON_INDEX')?.trim() ||
            '0';
        const useUrlButton = this.config.get('WHATSAPP_TEMPLATE_HAS_URL_BUTTON')?.trim() ===
            'true';
        const template = {
            name: params.templateName,
            language: { code: params.templateLanguage },
        };
        const components = [];
        if (params.headerImageUrl) {
            components.push({
                type: 'header',
                parameters: [
                    {
                        type: 'image',
                        image: {
                            link: params.headerImageUrl,
                        },
                    },
                ],
            });
        }
        if (params.bodyParameters?.length) {
            components.push({
                type: 'body',
                parameters: params.bodyParameters.map((text) => ({
                    type: 'text',
                    text,
                })),
            });
        }
        if (useUrlButton && params.urlButtonParameter) {
            components.push({
                type: 'button',
                sub_type: 'url',
                index: urlButtonIndex,
                parameters: [
                    {
                        type: 'text',
                        text: params.urlButtonParameter,
                    },
                ],
            });
        }
        if (components.length > 0) {
            template.components = components;
        }
        const body = {
            messaging_product: 'whatsapp',
            to: params.to,
            type: 'template',
            template,
        };
        let response;
        try {
            response = await fetch(`https://graph.facebook.com/${graphVersion}/${params.phoneNumberId}/messages`, {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${params.token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(body),
            });
        }
        catch (err) {
            this.logger.error(`Meta API network error: ${err}`);
            throw new common_1.ServiceUnavailableException('No se pudo conectar con WhatsApp');
        }
        const data = (await response.json().catch(() => ({})));
        if (!response.ok) {
            const detail = data.error?.message ?? `HTTP ${response.status}`;
            throw new common_1.BadRequestException(detail);
        }
        const messageId = data.messages?.[0]?.id;
        if (!messageId) {
            throw new common_1.InternalServerErrorException('WhatsApp no devolvió id de mensaje');
        }
        return messageId;
    }
    async recordOutboundTemplateMessage(params) {
        const preview = `Hola ${params.clienteNombre}, Soy ${params.agentName} de Coconut Luxury Flats. Link: ${params.propertyLink}`;
        try {
            const conversationId = await this.upsertConversation({
                waFrom: params.waTo,
                clienteId: params.clienteId,
                lastMessageAt: new Date().toISOString(),
                lastMessagePreview: preview.slice(0, 200),
            });
            await this.insertMessage({
                conversationId,
                direction: 'outbound',
                fromPhone: null,
                body: preview,
                waMessageId: params.waMessageId,
            });
        }
        catch (err) {
            this.logger.warn(`WhatsApp sent but inbox log failed for ${params.clienteId}: ${err}`);
        }
    }
    async setClienteGestionandoAfterWhatsApp(inmuebleId, clienteId, tipoOperacion) {
        const gestionEstado = tipoOperacion === 'alquiler' ? 'gestionando' : 'gestionando_w';
        const now = new Date().toISOString();
        const { data, error } = await this.supabase
            .getAdmin()
            .from('cliente_inmuebles')
            .update({
            gestion_estado: gestionEstado,
            fecha_ultima_gestion: now,
        })
            .eq('inmueble_id', inmuebleId)
            .eq('cliente_id', clienteId)
            .select('gestion_estado, fecha_ultima_gestion')
            .maybeSingle();
        if (error) {
            this.logger.error(`Error updating gestión after WhatsApp for ${clienteId}: ${error.message}`);
            throw new common_1.InternalServerErrorException('Mensaje enviado pero no se pudo actualizar la gestión');
        }
        if (!data) {
            throw new common_1.InternalServerErrorException('Mensaje enviado pero no se encontró la relación cliente–inmueble');
        }
        await this.supabase
            .getAdmin()
            .from('clientes')
            .update({
            fecha_ultima_gestion: now,
            updated_at: now,
        })
            .eq('id', clienteId);
        return data;
    }
};
exports.WhatsAppService = WhatsAppService;
exports.WhatsAppService = WhatsAppService = WhatsAppService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService,
        supabase_service_1.SupabaseService])
], WhatsAppService);
//# sourceMappingURL=whatsapp.service.js.map