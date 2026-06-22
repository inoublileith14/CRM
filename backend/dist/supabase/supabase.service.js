"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var SupabaseService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.SupabaseService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const supabase_js_1 = require("@supabase/supabase-js");
let SupabaseService = SupabaseService_1 = class SupabaseService {
    config;
    logger = new common_1.Logger(SupabaseService_1.name);
    adminClient;
    anonClient;
    constructor(config) {
        this.config = config;
        const url = SupabaseService_1.normalizeUrl(this.config.getOrThrow('SUPABASE_URL'));
        const serviceKey = this.config.getOrThrow('SUPABASE_SERVICE_ROLE_KEY');
        const anonKey = this.config.getOrThrow('SUPABASE_ANON_KEY');
        this.adminClient = (0, supabase_js_1.createClient)(url, serviceKey, {
            auth: { autoRefreshToken: false, persistSession: false },
        });
        this.anonClient = (0, supabase_js_1.createClient)(url, anonKey, {
            auth: { autoRefreshToken: false, persistSession: false },
        });
        if (serviceKey === anonKey) {
            this.logger.error('SUPABASE_SERVICE_ROLE_KEY es igual a SUPABASE_ANON_KEY. ' +
                'Copia la clave "service_role" (secreta) en Supabase → Settings → API.');
        }
        else if (SupabaseService_1.decodeJwtRole(serviceKey) !== 'service_role') {
            this.logger.error('SUPABASE_SERVICE_ROLE_KEY no es una clave service_role válida. ' +
                'Usa la clave "service_role" de Supabase → Settings → API.');
        }
    }
    onModuleInit() {
        const serviceKey = this.config.getOrThrow('SUPABASE_SERVICE_ROLE_KEY');
        if (SupabaseService_1.decodeJwtRole(serviceKey) === 'service_role') {
            this.logger.log('Clave service_role de Supabase configurada correctamente');
        }
    }
    getAdmin() {
        return this.adminClient;
    }
    getAnon() {
        return this.anonClient;
    }
    static normalizeUrl(raw) {
        return raw.replace(/\/+$/, '').replace(/\/rest\/v1\/?$/, '');
    }
    static decodeJwtRole(token) {
        try {
            const payload = token.split('.')[1];
            const json = Buffer.from(payload, 'base64url').toString('utf8');
            return JSON.parse(json).role ?? null;
        }
        catch {
            return null;
        }
    }
};
exports.SupabaseService = SupabaseService;
exports.SupabaseService = SupabaseService = SupabaseService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], SupabaseService);
//# sourceMappingURL=supabase.service.js.map