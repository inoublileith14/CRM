import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CreateInmuebleDto } from './dto/create-inmueble.dto';
import { UpdateClienteFechaUltimaGestionDto } from './dto/update-cliente-fecha-ultima-gestion.dto';
import { UpdateClienteGestionEstadoDto } from './dto/update-cliente-gestion-estado.dto';
import { UpdateInmuebleDto } from './dto/update-inmueble.dto';
import { InmueblesService } from './inmuebles.service';

@Controller('inmuebles')
@UseGuards(JwtAuthGuard)
export class InmueblesController {
  constructor(private inmueblesService: InmueblesService) {}

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
  findClientesByTipo(@Query('tipo_operacion') tipo_operacion?: string) {
    if (tipo_operacion !== 'alquiler' && tipo_operacion !== 'venta') {
      throw new BadRequestException(
        'tipo_operacion debe ser alquiler o venta',
      );
    }
    return this.inmueblesService.findClientesByTipoOperacion(tipo_operacion);
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
  create(@Body() dto: CreateInmuebleDto) {
    return this.inmueblesService.create(dto);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateInmuebleDto) {
    return this.inmueblesService.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.inmueblesService.remove(id);
  }
}
