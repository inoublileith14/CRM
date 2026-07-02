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
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuditLogsService = void 0;
const common_1 = require("@nestjs/common");
const supabase_service_1 = require("../supabase/supabase.service");
let AuditLogsService = class AuditLogsService {
    supabase;
    constructor(supabase) {
        this.supabase = supabase;
    }
    async create(params) {
        const admin = this.supabase.getAdmin();
        const payload = {
            actor_id: params.actor_id ?? null,
            actor_nombre: params.actor_nombre ?? null,
            actor_rol: params.actor_rol ?? null,
            action: params.action,
            entity_type: params.entity_type ?? null,
            entity_id: params.entity_id ?? null,
            route: params.route ?? null,
            method: params.method ?? null,
            status_code: params.status_code ?? null,
            metadata: params.metadata ?? {},
        };
        void admin.from('audit_logs').insert(payload);
    }
    async list(params) {
        const admin = this.supabase.getAdmin();
        const { data, error } = await admin
            .from('audit_logs')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(params.limit);
        if (error) {
            throw new Error(error.message);
        }
        return data ?? [];
    }
};
exports.AuditLogsService = AuditLogsService;
exports.AuditLogsService = AuditLogsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [supabase_service_1.SupabaseService])
], AuditLogsService);
//# sourceMappingURL=audit-logs.service.js.map