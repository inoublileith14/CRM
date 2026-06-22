"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const app_controller_1 = require("./app.controller");
const app_service_1 = require("./app.service");
const auth_module_1 = require("./auth/auth.module");
const calendar_module_1 = require("./calendar/calendar.module");
const chat_module_1 = require("./chat/chat.module");
const clientes_module_1 = require("./clientes/clientes.module");
const inmuebles_module_1 = require("./inmuebles/inmuebles.module");
const propietarios_module_1 = require("./propietarios/propietarios.module");
const workers_module_1 = require("./workers/workers.module");
const storage_module_1 = require("./storage/storage.module");
const supabase_module_1 = require("./supabase/supabase.module");
const whatsapp_module_1 = require("./whatsapp/whatsapp.module");
let AppModule = class AppModule {
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        imports: [
            config_1.ConfigModule.forRoot({ isGlobal: true }),
            supabase_module_1.SupabaseModule,
            auth_module_1.AuthModule,
            calendar_module_1.CalendarModule,
            chat_module_1.ChatModule,
            clientes_module_1.ClientesModule,
            inmuebles_module_1.InmueblesModule,
            propietarios_module_1.PropietariosModule,
            workers_module_1.WorkersModule,
            storage_module_1.StorageModule,
            whatsapp_module_1.WhatsAppModule,
        ],
        controllers: [app_controller_1.AppController],
        providers: [app_service_1.AppService],
    })
], AppModule);
//# sourceMappingURL=app.module.js.map