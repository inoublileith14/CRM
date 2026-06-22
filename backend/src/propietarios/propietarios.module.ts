import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { PropietariosController } from './propietarios.controller';
import { PropietariosService } from './propietarios.service';

@Module({
  imports: [AuthModule],
  controllers: [PropietariosController],
  providers: [PropietariosService],
  exports: [PropietariosService],
})
export class PropietariosModule {}
