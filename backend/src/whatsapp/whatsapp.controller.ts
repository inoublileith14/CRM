import {
  Body,
  Controller,
  ForbiddenException,
  Get,
  Header,
  Param,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { Request } from 'express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { UserProfile } from '../auth/interfaces/user.interface';
import { BulkSendWhatsAppDto } from './dto/bulk-send.dto';
import { WhatsAppService } from './whatsapp.service';

@Controller('whatsapp')
export class WhatsAppController {
  constructor(private whatsappService: WhatsAppService) {}

  @Post('bulk-send')
  @UseGuards(JwtAuthGuard)
  bulkSend(
    @Req() req: Request & { user: UserProfile },
    @Body() dto: BulkSendWhatsAppDto,
  ) {
    return this.whatsappService.bulkSend(
      dto.inmuebleId,
      dto.clienteIds ?? [],
      req.user.nombre,
    );
  }

  @Get('conversations')
  @UseGuards(JwtAuthGuard)
  async listConversations(@Req() req: Request & { user: UserProfile }) {
    if (req.user.rol !== 'admin') {
      throw new ForbiddenException('Solo admin');
    }
    return this.whatsappService.listConversations();
  }

  @Get('conversations/:id/messages')
  @UseGuards(JwtAuthGuard)
  async listMessages(
    @Req() req: Request & { user: UserProfile },
    @Param('id') conversationId: string,
  ) {
    if (req.user.rol !== 'admin') {
      throw new ForbiddenException('Solo admin');
    }
    return this.whatsappService.listMessages(conversationId);
  }

  @Post('conversations/:id/reply')
  @UseGuards(JwtAuthGuard)
  async reply(
    @Req() req: Request & { user: UserProfile },
    @Param('id') conversationId: string,
    @Body() body: { text?: string },
  ) {
    if (req.user.rol !== 'admin') {
      throw new ForbiddenException('Solo admin');
    }
    return this.whatsappService.reply(conversationId, body.text ?? '');
  }

  @Get('webhook')
  @Header('Content-Type', 'text/plain; charset=utf-8')
  verifyWebhook(
    @Query('hub.mode') mode: string,
    @Query('hub.verify_token') verifyToken: string,
    @Query('hub.challenge') challenge: string,
  ) {
    const verified = this.whatsappService.verifyWebhook(
      mode,
      verifyToken,
      challenge,
    );

    if (!verified) {
      throw new ForbiddenException('Verificación de webhook fallida');
    }

    return verified;
  }

  @Post('webhook')
  async handleWebhook(@Body() body: unknown) {
    await this.whatsappService.handleWebhookPayload(body);
    return { received: true };
  }
}
