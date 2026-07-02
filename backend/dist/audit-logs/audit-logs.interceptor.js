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
exports.AuditLogsInterceptor = void 0;
const common_1 = require("@nestjs/common");
const operators_1 = require("rxjs/operators");
const audit_logs_service_1 = require("./audit-logs.service");
function isMutation(method) {
    return method === 'POST' || method === 'PATCH' || method === 'PUT' || method === 'DELETE';
}
function pickEntity(req) {
    const path = (req.baseUrl || '') + (req.path || '');
    const params = req.params ?? {};
    if (path.startsWith('/inmuebles')) {
        return { entity_type: 'inmueble', entity_id: params.id ?? params.inmuebleId };
    }
    if (path.startsWith('/clientes')) {
        return { entity_type: 'cliente', entity_id: params.id ?? params.clienteId };
    }
    if (path.startsWith('/workers')) {
        return { entity_type: 'worker', entity_id: params.id ?? undefined };
    }
    if (path.startsWith('/propietarios')) {
        return { entity_type: 'propietario', entity_id: params.id ?? undefined };
    }
    if (path.startsWith('/whatsapp')) {
        return { entity_type: 'whatsapp', entity_id: params.id ?? undefined };
    }
    return {};
}
let AuditLogsInterceptor = class AuditLogsInterceptor {
    auditLogs;
    constructor(auditLogs) {
        this.auditLogs = auditLogs;
    }
    intercept(context, next) {
        const http = context.switchToHttp();
        const req = http.getRequest();
        const res = http.getResponse();
        const method = (req.method || '').toUpperCase();
        if (!isMutation(method))
            return next.handle();
        const fullPath = (req.baseUrl || '') + (req.path || '');
        if (fullPath.startsWith('/auth'))
            return next.handle();
        if (fullPath === '/' || fullPath.startsWith('/chat'))
            return next.handle();
        const user = req.user;
        const start = Date.now();
        const entity = pickEntity(req);
        return next.handle().pipe((0, operators_1.finalize)(() => {
            const statusCode = res?.statusCode ?? undefined;
            const duration_ms = Date.now() - start;
            void this.auditLogs.create({
                actor_id: user?.id ?? null,
                actor_nombre: user?.nombre ?? null,
                actor_rol: user?.rol ?? null,
                action: `${method} ${fullPath}`,
                entity_type: entity.entity_type ?? null,
                entity_id: entity.entity_id ?? null,
                route: fullPath,
                method,
                status_code: typeof statusCode === 'number' ? statusCode : null,
                metadata: {
                    params: req.params ?? {},
                    duration_ms,
                },
            });
        }));
    }
};
exports.AuditLogsInterceptor = AuditLogsInterceptor;
exports.AuditLogsInterceptor = AuditLogsInterceptor = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [audit_logs_service_1.AuditLogsService])
], AuditLogsInterceptor);
//# sourceMappingURL=audit-logs.interceptor.js.map