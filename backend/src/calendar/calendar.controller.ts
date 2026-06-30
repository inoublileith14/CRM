import {
  Controller,
  Delete,
  Get,
  HttpCode,
  Patch,
  Post,
  Body,
  Param,
  Query,
  Req,
  Res,
  Headers,
  UseGuards,
} from '@nestjs/common';
import { Request } from 'express';
import type { Response } from 'express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { UserProfile } from '../auth/interfaces/user.interface';
import { CalendarService } from './calendar.service';
import { CreateCalendarEventDto } from './dto/create-calendar-event.dto';
import { UpdateCalendarEventDto } from './dto/update-calendar-event.dto';

@Controller('calendar')
export class CalendarController {
  constructor(private calendarService: CalendarService) {}

  @Post('webhook')
  @HttpCode(200)
  async handleWebhook(
    @Headers() headers: Record<string, string | string[] | undefined>,
  ) {
    await this.calendarService.handleWatchNotification(headers);
    return { received: true };
  }

  @Get('stream')
  @UseGuards(JwtAuthGuard)
  stream(
    @Req() req: Request & { user: UserProfile },
    @Res() res: Response,
  ) {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache, no-transform');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');
    res.flushHeaders();

    const unsubscribe = this.calendarService.subscribeToStream(
      req.user.id,
      res,
    );

    req.on('close', () => {
      unsubscribe();
      res.end();
    });
  }

  @Get('connect')
  @UseGuards(JwtAuthGuard)
  connect(@Req() req: Request & { user: UserProfile }) {
    return this.calendarService.getConnectUrl(req.user.id);
  }

  @Get('callback')
  @UseGuards(JwtAuthGuard)
  callback(
    @Req() req: Request & { user: UserProfile },
    @Query('code') code: string,
    @Query('state') state: string,
  ) {
    if (!code || !state) {
      return { connected: false, error: 'missing_params' };
    }
    return this.calendarService.handleCallback(req.user.id, code, state);
  }

  @Get('status')
  @UseGuards(JwtAuthGuard)
  status(@Req() req: Request & { user: UserProfile }) {
    return this.calendarService.getStatus(req.user.id);
  }

  @Get('watch-support')
  @UseGuards(JwtAuthGuard)
  watchSupport() {
    return this.calendarService.getWatchSupport();
  }

  @Get('events')
  @UseGuards(JwtAuthGuard)
  events(
    @Req() req: Request & { user: UserProfile },
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    return this.calendarService.listEvents(req.user.id, { from, to });
  }

  @Post('events')
  @UseGuards(JwtAuthGuard)
  createEvent(
    @Req() req: Request & { user: UserProfile },
    @Body() dto: CreateCalendarEventDto,
  ) {
    return this.calendarService.createEvent(req.user.id, dto);
  }

  @Patch('events/:eventId')
  @UseGuards(JwtAuthGuard)
  updateEvent(
    @Req() req: Request & { user: UserProfile },
    @Param('eventId') eventId: string,
    @Body() dto: UpdateCalendarEventDto,
  ) {
    return this.calendarService.updateEvent(req.user.id, eventId, dto);
  }

  @Delete('disconnect')
  @UseGuards(JwtAuthGuard)
  disconnect(@Req() req: Request & { user: UserProfile }) {
    return this.calendarService.disconnect(req.user.id);
  }
}
