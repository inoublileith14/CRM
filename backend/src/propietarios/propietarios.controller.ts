import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CreatePropietarioDto } from './dto/create-propietario.dto';
import { FindOrCreatePropietarioDto } from './dto/find-or-create-propietario.dto';
import { UpdatePropietarioDto } from './dto/update-propietario.dto';
import { PropietariosService } from './propietarios.service';

@Controller('propietarios')
@UseGuards(JwtAuthGuard)
export class PropietariosController {
  constructor(private propietariosService: PropietariosService) {}

  @Get()
  findAll() {
    return this.propietariosService.findAll();
  }

  @Post('find-or-create')
  findOrCreate(@Body() dto: FindOrCreatePropietarioDto) {
    return this.propietariosService.findOrCreate(dto);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.propietariosService.findOne(id);
  }

  @Post()
  create(@Body() dto: CreatePropietarioDto) {
    return this.propietariosService.create(dto);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdatePropietarioDto) {
    return this.propietariosService.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.propietariosService.remove(id);
  }
}
