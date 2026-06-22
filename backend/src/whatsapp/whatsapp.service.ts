import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SupabaseService } from '../supabase/supabase.service';
import { formatWhatsAppRecipient } from './whatsapp-phone.util';
import { parseWhatsAppWebhookPayload } from './whatsapp-webhook.util';

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

interface MetaSendResponse {
  messages?: Array<{ id: string }>;
  error?: { message?: string; code?: number };
}

@Injectable()
export class WhatsAppService {
  private readonly logger = new Logger(WhatsAppService.name);

  constructor(
    private config: ConfigService,
    private supabase: SupabaseService,
  ) {}

  verifyWebhook(
    mode: string | undefined,
    verifyToken: string | undefined,
    challenge: string | undefined,
  ): string | null {
    const expectedToken = this.config
      .get<string>('WHATSAPP_WEBHOOK_VERIFY_TOKEN')
      ?.trim();

    if (!expectedToken) {
      this.logger.error(
        'WHATSAPP_WEBHOOK_VERIFY_TOKEN no está configurado',
      );
      return null;
    }

    if (mode !== 'subscribe' || verifyToken !== expectedToken || !challenge) {
      return null;
    }

    return challenge;
  }

  async handleWebhookPayload(body: unknown): Promise<void> {
    const messages = parseWhatsAppWebhookPayload(body);
    if (messages.length === 0) return;

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

      this.logger.log(
        `WhatsApp inbound from ${message.from}${cliente?.nombre ? ` (${cliente.nombre})` : ''}: ${text || `[${message.type}]`}`,
      );
    }
  }

  async listConversations(): Promise<WhatsAppConversationListItem[]> {
    const { data, error } = await this.supabase
      .getAdmin()
      .from('whatsapp_conversations')
      .select('id, wa_from, cliente_id, last_message_at, last_message_preview')
      .order('last_message_at', { ascending: false })
      .limit(200);

    if (error) {
      this.logger.error(`Error loading conversations: ${error.message}`);
      throw new InternalServerErrorException('No se pudieron cargar los chats');
    }

    const rows = data ?? [];

    // Resolve client names in one extra query (small list)
    const clienteIds = [
      ...new Set(rows.map((r) => r.cliente_id).filter(Boolean)),
    ] as string[];

    const clienteNameById = new Map<string, string>();
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
      id: r.id as string,
      wa_from: r.wa_from as string,
      cliente_id: (r.cliente_id as string | null) ?? null,
      cliente_nombre: r.cliente_id
        ? clienteNameById.get(r.cliente_id as string) ?? null
        : null,
      last_message_at: r.last_message_at as string,
      last_message_preview: (r.last_message_preview as string | null) ?? null,
    }));
  }

  async listMessages(conversationId: string): Promise<WhatsAppMessageItem[]> {
    const { data, error } = await this.supabase
      .getAdmin()
      .from('whatsapp_messages')
      .select('id, direction, from_phone, body, created_at')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true })
      .limit(500);

    if (error) {
      this.logger.error(`Error loading messages: ${error.message}`);
      throw new InternalServerErrorException(
        'No se pudieron cargar los mensajes',
      );
    }

    return (data ?? []).map((m) => ({
      id: m.id as string,
      direction: m.direction as 'inbound' | 'outbound',
      from_phone: (m.from_phone as string | null) ?? null,
      body: (m.body as string | null) ?? null,
      created_at: m.created_at as string,
    }));
  }

  async reply(conversationId: string, text: string): Promise<{ ok: true }> {
    const message = text.trim();
    if (!message) {
      throw new BadRequestException('El mensaje no puede estar vacío');
    }

    const { data: convo, error } = await this.supabase
      .getAdmin()
      .from('whatsapp_conversations')
      .select('id, wa_from')
      .eq('id', conversationId)
      .maybeSingle();

    if (error) {
      this.logger.error(`Error loading conversation: ${error.message}`);
      throw new InternalServerErrorException('No se pudo cargar el chat');
    }
    if (!convo?.wa_from) {
      throw new BadRequestException('Chat no encontrado');
    }

    const token = this.config.get<string>('TOKEN_WHATSAPP')?.trim();
    const phoneNumberId =
      this.config.get<string>('WHATSAPP_PHONE_NUMBER_ID')?.trim() ||
      this.config.get<string>('PHONE_NUMBER')?.trim();

    if (!token || !phoneNumberId) {
      throw new ServiceUnavailableException('WhatsApp no configurado');
    }

    const graphVersion =
      this.config.get<string>('WHATSAPP_GRAPH_VERSION')?.trim() || 'v22.0';

    const body = {
      messaging_product: 'whatsapp',
      to: convo.wa_from,
      type: 'text',
      text: { body: message },
    };

    let response: Response;
    try {
      response = await fetch(
        `https://graph.facebook.com/${graphVersion}/${phoneNumberId}/messages`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(body),
        },
      );
    } catch (err) {
      this.logger.error(`Meta API network error: ${err}`);
      throw new ServiceUnavailableException('No se pudo conectar con WhatsApp');
    }

    const data = (await response.json().catch(() => ({}))) as MetaSendResponse;
    if (!response.ok) {
      const detail = data.error?.message ?? `HTTP ${response.status}`;
      throw new BadRequestException(detail);
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

  private async findClienteByPhone(
    waFrom: string,
  ): Promise<{ id: string; nombre: string } | null> {
    const { data, error } = await this.supabase
      .getAdmin()
      .from('clientes')
      .select('id, nombre, telefono')
      .not('telefono', 'is', null);

    if (error || !data?.length) return null;

    const target = waFrom.replace(/\D/g, '');
    for (const cliente of data) {
      const normalized = formatWhatsAppRecipient(cliente.telefono);
      if (normalized === target) {
        return { id: cliente.id as string, nombre: cliente.nombre as string };
      }
    }

    return null;
  }

  private async upsertConversation(params: {
    waFrom: string;
    clienteId: string | null;
    lastMessageAt: string;
    lastMessagePreview: string;
  }): Promise<string> {
    const { data: existing, error: existingError } = await this.supabase
      .getAdmin()
      .from('whatsapp_conversations')
      .select('id')
      .eq('wa_from', params.waFrom)
      .maybeSingle();

    if (existingError) {
      this.logger.error(
        `Error reading whatsapp_conversations: ${existingError.message}`,
      );
      throw new InternalServerErrorException('No se pudo guardar el chat');
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
        .eq('id', existing.id as string);
      if (error) {
        this.logger.error(
          `Error updating whatsapp_conversations: ${error.message}`,
        );
        throw new InternalServerErrorException('No se pudo guardar el chat');
      }
      return existing.id as string;
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
      this.logger.error(
        `Error inserting whatsapp_conversations: ${error?.message ?? 'unknown'}`,
      );
      throw new InternalServerErrorException('No se pudo guardar el chat');
    }

    return data.id as string;
  }

  private async insertMessage(params: {
    conversationId: string;
    direction: 'inbound' | 'outbound';
    fromPhone: string | null;
    body: string | null;
    waMessageId: string | null;
  }): Promise<void> {
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
      throw new InternalServerErrorException('No se pudo guardar el mensaje');
    }
  }

  async bulkSend(
    inmuebleId: string,
    clienteIds: string[],
    senderName?: string,
  ): Promise<BulkSendWhatsAppResponse> {
    const ids = [...new Set(clienteIds.map((id) => id.trim()).filter(Boolean))];
    if (ids.length === 0) {
      throw new BadRequestException('No hay clientes para enviar');
    }

    const token = this.config.get<string>('TOKEN_WHATSAPP')?.trim();
    const phoneNumberId =
      this.config.get<string>('WHATSAPP_PHONE_NUMBER_ID')?.trim() ||
      this.config.get<string>('PHONE_NUMBER')?.trim();

    if (!token) {
      throw new ServiceUnavailableException(
        'WhatsApp no configurado (falta TOKEN_WHATSAPP)',
      );
    }
    if (!phoneNumberId) {
      throw new ServiceUnavailableException(
        'WhatsApp no configurado (falta WHATSAPP_PHONE_NUMBER_ID o PHONE_NUMBER)',
      );
    }

    const templateName =
      this.config.get<string>('WHATSAPP_TEMPLATE_NAME')?.trim() ||
      'coconut_luxury_flats';
    const templateLanguage =
      this.config.get<string>('WHATSAPP_TEMPLATE_LANGUAGE')?.trim() || 'es';
    const agentName =
      senderName?.trim() ||
      this.config.get<string>('WHATSAPP_SENDER_NAME')?.trim() ||
      'Coconut Luxury Flats';

    const { data: inmueble, error: inmuebleError } = await this.supabase
      .getAdmin()
      .from('inmuebles')
      .select(
        'id, tipo_operacion, link_idealista_espejo, ficha_del_piso_real, imagen_real, foto_espejo',
      )
      .eq('id', inmuebleId)
      .maybeSingle();

    if (inmuebleError) {
      this.logger.error(
        `Error loading inmueble for WhatsApp: ${inmuebleError.message}`,
      );
      throw new InternalServerErrorException('No se pudo cargar el inmueble');
    }

    if (!inmueble) {
      throw new BadRequestException('Inmueble no encontrado');
    }

    const propertyLink =
      (inmueble.link_idealista_espejo as string | null)?.trim() ||
      (inmueble.ficha_del_piso_real as string | null)?.trim() ||
      '';

    if (!propertyLink) {
      throw new BadRequestException(
        'El inmueble no tiene link de Idealista ni ficha del piso real',
      );
    }

    const headerImageUrl =
      (inmueble.imagen_real as string | null)?.trim() ||
      (inmueble.foto_espejo as string | null)?.trim() ||
      '';

    if (!headerImageUrl.startsWith('https://')) {
      throw new BadRequestException(
        'El inmueble necesita imagen real o foto espejo con URL HTTPS pública para enviar la plantilla de WhatsApp',
      );
    }

    const { data, error } = await this.supabase
      .getAdmin()
      .from('cliente_inmuebles')
      .select('cliente_id, clientes!inner(id, nombre, telefono)')
      .eq('inmueble_id', inmuebleId)
      .in('cliente_id', ids);

    if (error) {
      this.logger.error(`Error loading clientes for WhatsApp: ${error.message}`);
      throw new InternalServerErrorException(
        'No se pudieron cargar los clientes del inmueble',
      );
    }

    const rows = data ?? [];
    if (rows.length === 0) {
      throw new BadRequestException(
        'Ningún cliente pertenece a este inmueble',
      );
    }

    const tipoOperacion = inmueble.tipo_operacion as string;
    if (tipoOperacion !== 'alquiler' && tipoOperacion !== 'venta') {
      throw new BadRequestException('Tipo de inmueble no válido');
    }

    const results: WhatsAppSendResult[] = [];

    for (const row of rows) {
      const rawCliente = row.clientes;
      const cliente = (
        Array.isArray(rawCliente) ? rawCliente[0] : rawCliente
      ) as
        | { id: string; nombre: string; telefono: string | null }
        | null
        | undefined;

      if (!cliente) continue;

      const waTo = formatWhatsAppRecipient(cliente.telefono);
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
        const gestionUpdate = await this.setClienteGestionandoAfterWhatsApp(
          inmuebleId,
          cliente.id,
          tipoOperacion,
        );
        results.push({
          clienteId: cliente.id,
          nombre: cliente.nombre,
          telefono: cliente.telefono,
          ok: true,
          messageId,
          gestionEstado: gestionUpdate.gestion_estado,
          fechaUltimaGestion: gestionUpdate.fecha_ultima_gestion,
        });
      } catch (err) {
        const message =
          err instanceof Error ? err.message : 'Error al enviar mensaje';
        this.logger.warn(
          `WhatsApp send failed for ${cliente.id} (${waTo}): ${message}`,
        );
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

  private async sendTemplateMessage(params: {
    token: string;
    phoneNumberId: string;
    to: string;
    templateName: string;
    templateLanguage: string;
    headerImageUrl?: string;
    bodyParameters?: string[];
    /** @deprecated Use bodyParameters for link placeholders ({{3}}) instead */
    urlButtonParameter?: string;
  }): Promise<string> {
    const graphVersion =
      this.config.get<string>('WHATSAPP_GRAPH_VERSION')?.trim() || 'v22.0';
    const urlButtonIndex =
      this.config.get<string>('WHATSAPP_TEMPLATE_URL_BUTTON_INDEX')?.trim() ||
      '0';
    const useUrlButton =
      this.config.get<string>('WHATSAPP_TEMPLATE_HAS_URL_BUTTON')?.trim() ===
      'true';

    const template: Record<string, unknown> = {
      name: params.templateName,
      language: { code: params.templateLanguage },
    };

    const components: Record<string, unknown>[] = [];

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

    let response: Response;
    try {
      response = await fetch(
        `https://graph.facebook.com/${graphVersion}/${params.phoneNumberId}/messages`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${params.token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(body),
        },
      );
    } catch (err) {
      this.logger.error(`Meta API network error: ${err}`);
      throw new ServiceUnavailableException('No se pudo conectar con WhatsApp');
    }

    const data = (await response.json().catch(() => ({}))) as MetaSendResponse;

    if (!response.ok) {
      const detail = data.error?.message ?? `HTTP ${response.status}`;
      throw new BadRequestException(detail);
    }

    const messageId = data.messages?.[0]?.id;
    if (!messageId) {
      throw new InternalServerErrorException(
        'WhatsApp no devolvió id de mensaje',
      );
    }

    return messageId;
  }

  private async recordOutboundTemplateMessage(params: {
    waTo: string;
    clienteId: string;
    clienteNombre: string;
    agentName: string;
    propertyLink: string;
    waMessageId: string;
  }): Promise<void> {
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
    } catch (err) {
      this.logger.warn(
        `WhatsApp sent but inbox log failed for ${params.clienteId}: ${err}`,
      );
    }
  }

  private async setClienteGestionandoAfterWhatsApp(
    inmuebleId: string,
    clienteId: string,
    tipoOperacion: 'alquiler' | 'venta',
  ): Promise<{ gestion_estado: string; fecha_ultima_gestion: string }> {
    const gestionEstado =
      tipoOperacion === 'alquiler' ? 'gestionando' : 'gestionando_w';
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
      this.logger.error(
        `Error updating gestión after WhatsApp for ${clienteId}: ${error.message}`,
      );
      throw new InternalServerErrorException(
        'Mensaje enviado pero no se pudo actualizar la gestión',
      );
    }

    if (!data) {
      throw new InternalServerErrorException(
        'Mensaje enviado pero no se encontró la relación cliente–inmueble',
      );
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
}
