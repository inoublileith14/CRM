import {
  BadRequestException,
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
import { CreateInmuebleDto } from './dto/create-inmueble.dto';
import { UpdateClienteFechaUltimaGestionDto } from './dto/update-cliente-fecha-ultima-gestion.dto';
import { UpdateClienteGestionEstadoDto } from './dto/update-cliente-gestion-estado.dto';
import { UpdateInmuebleDto } from './dto/update-inmueble.dto';
import { InmueblesService } from './inmuebles.service';

@Controller('inmuebles')
@UseGuards(JwtAuthGuard)
export class InmueblesController {
  constructor(private inmueblesService: InmueblesService) {}

  private assertAdmin(req: Request & { user: UserProfile }) {
    if (req.user.rol !== 'admin') {
      throw new ForbiddenException('Solo admin');
    }
  }

  @Get()
  findAll(
    @Query('tipo_operacion') tipo_operacion?: string,
    @Query('propietario_id') propietario_id?: string,
  ) {
    return this.inmueblesService.findAll({
      tipo_operacion,
      propietario_id,
    });
  }

  @Get('clientes/by-tipo')
  findClientesByTipo(
    @Query('tipo_operacion') tipo_operacion?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('sort') sort?: string,
    @Query('dir') dir?: string,
  ) {
    if (tipo_operacion !== 'alquiler' && tipo_operacion !== 'venta') {
      throw new BadRequestException(
        'tipo_operacion debe ser alquiler o venta',
      );
    }

    const pageNum = Math.max(1, Number.parseInt(page ?? '1', 10) || 1);
    const parsedLimit = Number.parseInt(limit ?? '100', 10);
    const limitNum = Math.min(
      Math.max(1, Number.isFinite(parsedLimit) ? parsedLimit : 100),
      10_000,
    );

    return this.inmueblesService.findClientesByTipoOperacionPaginated(
      tipo_operacion,
      {
        page: pageNum,
        limit: limitNum,
        sort: sort === 'fecha_entrada' ? 'fecha_entrada' : undefined,
        dir: dir === 'asc' || dir === 'desc' ? dir : undefined,
      },
    );
  }

  @Patch(':inmuebleId/clientes/:clienteId/gestion-estado')
  updateClienteGestionEstado(
    @Param('inmuebleId') inmuebleId: string,
    @Param('clienteId') clienteId: string,
    @Body() dto: UpdateClienteGestionEstadoDto,
  ) {
    return this.inmueblesService.updateClienteGestionEstado(
      inmuebleId,
      clienteId,
      dto.gestion_estado,
    );
  }

  @Patch(':inmuebleId/clientes/:clienteId/fecha-ultima-gestion')
  updateClienteFechaUltimaGestion(
    @Param('inmuebleId') inmuebleId: string,
    @Param('clienteId') clienteId: string,
    @Body() dto: UpdateClienteFechaUltimaGestionDto,
  ) {
    return this.inmueblesService.updateClienteFechaUltimaGestion(
      inmuebleId,
      clienteId,
      dto.fecha_ultima_gestion,
    );
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.inmueblesService.findOne(id);
  }

  @Post()
  create(
    @Req() req: Request & { user: UserProfile },
    @Body() dto: CreateInmuebleDto,
  ) {
    this.assertAdmin(req);
    return this.inmueblesService.create(dto);
  }

  @Patch(':id')
  update(
    @Req() req: Request & { user: UserProfile },
    @Param('id') id: string,
    @Body() dto: UpdateInmuebleDto,
  ) {
    this.assertAdmin(req);
    return this.inmueblesService.update(id, dto);
  }

  @Delete(':id')
  remove(
    @Req() req: Request & { user: UserProfile },
    @Param('id') id: string,
  ) {
    this.assertAdmin(req);
    return this.inmueblesService.remove(id);
  }
}
