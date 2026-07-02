import { Controller, Get, Query, Req, UseGuards } from '@nestjs/common';
import { Request } from 'express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { UserProfile } from '../auth/interfaces/user.interface';
import { AuditLogsService } from './audit-logs.service';

@Controller('audit-logs')
@UseGuards(JwtAuthGuard)
export class AuditLogsController {
  constructor(private auditLogs: AuditLogsService) {}

  @Get()
  async list(
    @Req() req: Request & { user: UserProfile },
    @Query('limit') limit?: string,
  ) {
    if (req.user.rol !== 'admin') {
      return [];
    }
    const parsed = Number.parseInt(limit ?? '200', 10);
    const safeLimit = Math.min(Math.max(Number.isFinite(parsed) ? parsed : 200, 1), 1000);
    return this.auditLogs.list({ limit: safeLimit });
  }
}

