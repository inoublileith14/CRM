import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { InmueblesController } from './inmuebles.controller';
import { InmueblesService } from './inmuebles.service';

@Module({
  imports: [AuthModule],
  controllers: [InmueblesController],
  providers: [InmueblesService],
})
export class InmueblesModule {}
