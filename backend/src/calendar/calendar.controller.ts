import {
  Controller,
  Delete,
  Get,
  Post,
  Body,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { Request } from 'express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { UserProfile } from '../auth/interfaces/user.interface';
import { CalendarService } from './calendar.service';
import { CreateCalendarEventDto } from './dto/create-calendar-event.dto';

@Controller('calendar')
@UseGuards(JwtAuthGuard)
export class CalendarController {
  constructor(private calendarService: CalendarService) {}

  @Get('connect')
  connect(@Req() req: Request & { user: UserProfile }) {
    return this.calendarService.getConnectUrl(req.user.id);
  }

  @Get('callback')
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
  status(@Req() req: Request & { user: UserProfile }) {
    return this.calendarService.getStatus(req.user.id);
  }

  @Get('events')
  events(@Req() req: Request & { user: UserProfile }) {
    return this.calendarService.listUpcomingEvents(req.user.id);
  }

  @Post('events')
  createEvent(
    @Req() req: Request & { user: UserProfile },
    @Body() dto: CreateCalendarEventDto,
  ) {
    return this.calendarService.createEvent(req.user.id, dto);
  }

  @Delete('disconnect')
  disconnect(@Req() req: Request & { user: UserProfile }) {
    return this.calendarService.disconnect(req.user.id);
  }
}
