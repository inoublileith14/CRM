import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { ClienteImportService } from './cliente-import.service';
import { ClientesController } from './clientes.controller';
import { ClientesService } from './clientes.service';

@Module({
  imports: [AuthModule],
  controllers: [ClientesController],
  providers: [ClientesService, ClienteImportService],
})
export class ClientesModule {}
