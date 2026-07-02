import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuditLogsModule } from './audit-logs/audit-logs.module';
import { AuditLogsInterceptor } from './audit-logs/audit-logs.interceptor';
import { AuthModule } from './auth/auth.module';
import { CalendarModule } from './calendar/calendar.module';
import { ChatModule } from './chat/chat.module';
import { ClientesModule } from './clientes/clientes.module';
import { InmueblesModule } from './inmuebles/inmuebles.module';
import { PropietariosModule } from './propietarios/propietarios.module';
import { WorkersModule } from './workers/workers.module';
import { StorageModule } from './storage/storage.module';
import { SupabaseModule } from './supabase/supabase.module';
import { WhatsAppModule } from './whatsapp/whatsapp.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    SupabaseModule,
    AuditLogsModule,
    AuthModule,
    CalendarModule,
    ChatModule,
    ClientesModule,
    InmueblesModule,
    PropietariosModule,
    WorkersModule,
    StorageModule,
    WhatsAppModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    { provide: APP_INTERCEPTOR, useClass: AuditLogsInterceptor },
  ],
})
export class AppModule {}
