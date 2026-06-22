import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ClienteImportService } from './cliente-import.service';
import { ClientesService } from './clientes.service';
import { BulkDeleteClientesDto } from './dto/bulk-delete-clientes.dto';
import { BulkAssignInmuebleDto } from './dto/bulk-assign-inmueble.dto';
import { BulkAssignWorkerDto } from './dto/bulk-assign-worker.dto';
import { BulkImportClientesDto } from './dto/bulk-import-clientes.dto';
import { CreateClienteDto } from './dto/create-cliente.dto';
import { UpdateClienteDto } from './dto/update-cliente.dto';

const IMPORT_FILE_LIMIT_BYTES = 50 * 1024 * 1024;

@Controller('clientes')
@UseGuards(JwtAuthGuard)
export class ClientesController {
  constructor(
    private clientesService: ClientesService,
    private clienteImportService: ClienteImportService,
  ) {}

  @Get()
  findAll() {
    return this.clientesService.findAll();
  }

  @Post('bulk-assign-worker')
  bulkAssignWorker(@Body() dto: BulkAssignWorkerDto) {
    return this.clientesService.bulkAssignWorker(dto);
  }

  @Post('bulk-assign-inmueble')
  bulkAssignInmueble(@Body() dto: BulkAssignInmuebleDto) {
    return this.clientesService.bulkAssignInmueble(dto);
  }

  @Post('bulk-delete')
  bulkRemove(@Body() dto: BulkDeleteClientesDto) {
    return this.clientesService.bulkRemove(dto);
  }

  @Post('bulk-import')
  bulkImport(@Body() dto: BulkImportClientesDto) {
    return this.clientesService.bulkImport(dto);
  }

  @Post('import/upload')
  @UseInterceptors(
    FileInterceptor('file', {
      limits: { fileSize: IMPORT_FILE_LIMIT_BYTES },
    }),
  )
  importUpload(
    @UploadedFile() file: Express.Multer.File,
    @Body()
    body: {
      inmueble_id?: string;
      worker_id?: string;
      tipo_operacion?: string;
      skip_duplicates?: string;
    },
  ) {
    return this.clienteImportService.startUploadImport(file, {
      inmueble_id: body.inmueble_id,
      worker_id: body.worker_id,
      tipo_operacion:
        body.tipo_operacion === 'alquiler' || body.tipo_operacion === 'venta'
          ? body.tipo_operacion
          : undefined,
      skip_duplicates: body.skip_duplicates !== 'false',
    });
  }

  @Get('import/:jobId')
  getImportJob(@Param('jobId') jobId: string) {
    return this.clienteImportService.getJob(jobId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.clientesService.findOne(id);
  }

  @Post()
  create(@Body() dto: CreateClienteDto) {
    return this.clientesService.create(dto);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateClienteDto) {
    return this.clientesService.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.clientesService.remove(id);
  }
}
