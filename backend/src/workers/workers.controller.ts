import {
  Body,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { Request } from 'express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { UserProfile } from '../auth/interfaces/user.interface';
import { CreateWorkerDto } from './dto/create-worker.dto';
import { UpdateWorkerDto } from './dto/update-worker.dto';
import { WorkersService } from './workers.service';

@Controller('workers')
@UseGuards(JwtAuthGuard)
export class WorkersController {
  constructor(private workersService: WorkersService) {}

  private assertAdmin(req: Request & { user: UserProfile }) {
    if (req.user.rol !== 'admin') {
      throw new ForbiddenException('Solo admin');
    }
  }

  @Get()
  findAll(@Query('activo') activo?: string) {
    const activoOnly = activo === 'true';
    return this.workersService.findAll(activoOnly);
  }

  @Get('me')
  async findMe(@Req() req: Request & { user: UserProfile }) {
    const worker_id = await this.workersService.findIdByProfileId(req.user.id);
    return { worker_id };
  }

  @Get(':id')
  findOne(
    @Req() req: Request & { user: UserProfile },
    @Param('id') id: string,
  ) {
    this.assertAdmin(req);
    return this.workersService.findOne(id);
  }

  @Post()
  create(
    @Req() req: Request & { user: UserProfile },
    @Body() dto: CreateWorkerDto,
  ) {
    this.assertAdmin(req);
    return this.workersService.create(dto);
  }

  @Post(':id/reenviar-invitacion')
  resendInvitation(
    @Req() req: Request & { user: UserProfile },
    @Param('id') id: string,
  ) {
    this.assertAdmin(req);
    return this.workersService.resendInvitation(id);
  }

  @Patch(':id')
  update(
    @Req() req: Request & { user: UserProfile },
    @Param('id') id: string,
    @Body() dto: UpdateWorkerDto,
  ) {
    this.assertAdmin(req);
    return this.workersService.update(id, dto);
  }

  @Delete(':id')
  remove(
    @Req() req: Request & { user: UserProfile },
    @Param('id') id: string,
  ) {
    this.assertAdmin(req);
    return this.workersService.remove(id);
  }
}
