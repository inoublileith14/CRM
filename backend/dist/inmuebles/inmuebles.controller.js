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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.InmueblesController = void 0;
const common_1 = require("@nestjs/common");
const jwt_auth_guard_1 = require("../auth/jwt-auth.guard");
const create_inmueble_dto_1 = require("./dto/create-inmueble.dto");
const update_cliente_fecha_ultima_gestion_dto_1 = require("./dto/update-cliente-fecha-ultima-gestion.dto");
const update_cliente_gestion_estado_dto_1 = require("./dto/update-cliente-gestion-estado.dto");
const update_inmueble_dto_1 = require("./dto/update-inmueble.dto");
const inmuebles_service_1 = require("./inmuebles.service");
let InmueblesController = class InmueblesController {
    inmueblesService;
    constructor(inmueblesService) {
        this.inmueblesService = inmueblesService;
    }
    assertAdmin(req) {
        if (req.user.rol !== 'admin') {
            throw new common_1.ForbiddenException('Solo admin');
        }
    }
    findAll(tipo_operacion, propietario_id) {
        return this.inmueblesService.findAll({
            tipo_operacion,
            propietario_id,
        });
    }
    findClientesByTipoRefs(tipo_operacion, q) {
        if (tipo_operacion !== 'alquiler' && tipo_operacion !== 'venta') {
            throw new common_1.BadRequestException('tipo_operacion debe ser alquiler o venta');
        }
        return this.inmueblesService.findClientesByTipoRefs(tipo_operacion, q);
    }
    findClientesByTipo(tipo_operacion, page, limit, sort, dir, nombre, telefono, ref_cliente, entrada_prevista, presupuesto_maximo_min, presupuesto_maximo_max, presupuesto_peticion_min, presupuesto_peticion_max, habitaciones_min, habitaciones_max, banos_min, banos_max, metros_min, metros_max, barrio, distrito) {
        if (tipo_operacion !== 'alquiler' && tipo_operacion !== 'venta') {
            throw new common_1.BadRequestException('tipo_operacion debe ser alquiler o venta');
        }
        const pageNum = Math.max(1, Number.parseInt(page ?? '1', 10) || 1);
        const parsedLimit = Number.parseInt(limit ?? '100', 10);
        const limitNum = Math.min(Math.max(1, Number.isFinite(parsedLimit) ? parsedLimit : 100), 10_000);
        return this.inmueblesService.findClientesByTipoOperacionPaginated(tipo_operacion, {
            page: pageNum,
            limit: limitNum,
            sort: sort === 'fecha_entrada' ? 'fecha_entrada' : undefined,
            dir: dir === 'asc' || dir === 'desc' ? dir : undefined,
            nombre: nombre?.trim() || undefined,
            telefono: telefono?.trim() || undefined,
            ref_cliente: ref_cliente?.trim() || undefined,
            entrada_prevista: entrada_prevista?.trim() || undefined,
            presupuesto_maximo_min: presupuesto_maximo_min?.trim() || undefined,
            presupuesto_maximo_max: presupuesto_maximo_max?.trim() || undefined,
            presupuesto_peticion_min: presupuesto_peticion_min?.trim() || undefined,
            presupuesto_peticion_max: presupuesto_peticion_max?.trim() || undefined,
            habitaciones_min: habitaciones_min?.trim() || undefined,
            habitaciones_max: habitaciones_max?.trim() || undefined,
            banos_min: banos_min?.trim() || undefined,
            banos_max: banos_max?.trim() || undefined,
            metros_min: metros_min?.trim() || undefined,
            metros_max: metros_max?.trim() || undefined,
            barrio: barrio?.trim() || undefined,
            distrito: distrito?.trim() || undefined,
        });
    }
    updateClienteGestionEstado(inmuebleId, clienteId, dto) {
        return this.inmueblesService.updateClienteGestionEstado(inmuebleId, clienteId, dto.gestion_estado, dto.fecha_ultima_gestion);
    }
    updateClienteFechaUltimaGestion(inmuebleId, clienteId, dto) {
        return this.inmueblesService.updateClienteFechaUltimaGestion(inmuebleId, clienteId, dto.fecha_ultima_gestion);
    }
    findOne(id) {
        return this.inmueblesService.findOne(id);
    }
    create(req, dto) {
        this.assertAdmin(req);
        return this.inmueblesService.create(dto);
    }
    update(req, id, dto) {
        const patchKeys = Object.entries(dto).filter(([, value]) => value !== undefined);
        const allowedNonAdminKeys = new Set([
            'activo',
            'alquilado_codigo',
            'vendido_codigo',
            'status',
        ]);
        const nonAdminAllowed = patchKeys.length > 0 &&
            patchKeys.every(([key]) => allowedNonAdminKeys.has(key));
        if (!nonAdminAllowed) {
            this.assertAdmin(req);
        }
        return this.inmueblesService.update(id, dto);
    }
    remove(req, id) {
        this.assertAdmin(req);
        return this.inmueblesService.remove(id);
    }
};
exports.InmueblesController = InmueblesController;
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, common_1.Query)('tipo_operacion')),
    __param(1, (0, common_1.Query)('propietario_id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], InmueblesController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)('clientes/by-tipo/refs'),
    __param(0, (0, common_1.Query)('tipo_operacion')),
    __param(1, (0, common_1.Query)('q')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], InmueblesController.prototype, "findClientesByTipoRefs", null);
__decorate([
    (0, common_1.Get)('clientes/by-tipo'),
    __param(0, (0, common_1.Query)('tipo_operacion')),
    __param(1, (0, common_1.Query)('page')),
    __param(2, (0, common_1.Query)('limit')),
    __param(3, (0, common_1.Query)('sort')),
    __param(4, (0, common_1.Query)('dir')),
    __param(5, (0, common_1.Query)('nombre')),
    __param(6, (0, common_1.Query)('telefono')),
    __param(7, (0, common_1.Query)('ref_cliente')),
    __param(8, (0, common_1.Query)('entrada_prevista')),
    __param(9, (0, common_1.Query)('presupuesto_maximo_min')),
    __param(10, (0, common_1.Query)('presupuesto_maximo_max')),
    __param(11, (0, common_1.Query)('presupuesto_peticion_min')),
    __param(12, (0, common_1.Query)('presupuesto_peticion_max')),
    __param(13, (0, common_1.Query)('habitaciones_min')),
    __param(14, (0, common_1.Query)('habitaciones_max')),
    __param(15, (0, common_1.Query)('banos_min')),
    __param(16, (0, common_1.Query)('banos_max')),
    __param(17, (0, common_1.Query)('metros_min')),
    __param(18, (0, common_1.Query)('metros_max')),
    __param(19, (0, common_1.Query)('barrio')),
    __param(20, (0, common_1.Query)('distrito')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, String, String, String, String, String, String, String, String, String, String, String, String, String, String, String, String, String, String]),
    __metadata("design:returntype", void 0)
], InmueblesController.prototype, "findClientesByTipo", null);
__decorate([
    (0, common_1.Patch)(':inmuebleId/clientes/:clienteId/gestion-estado'),
    __param(0, (0, common_1.Param)('inmuebleId')),
    __param(1, (0, common_1.Param)('clienteId')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, update_cliente_gestion_estado_dto_1.UpdateClienteGestionEstadoDto]),
    __metadata("design:returntype", void 0)
], InmueblesController.prototype, "updateClienteGestionEstado", null);
__decorate([
    (0, common_1.Patch)(':inmuebleId/clientes/:clienteId/fecha-ultima-gestion'),
    __param(0, (0, common_1.Param)('inmuebleId')),
    __param(1, (0, common_1.Param)('clienteId')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, update_cliente_fecha_ultima_gestion_dto_1.UpdateClienteFechaUltimaGestionDto]),
    __metadata("design:returntype", void 0)
], InmueblesController.prototype, "updateClienteFechaUltimaGestion", null);
__decorate([
    (0, common_1.Get)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], InmueblesController.prototype, "findOne", null);
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, create_inmueble_dto_1.CreateInmuebleDto]),
    __metadata("design:returntype", void 0)
], InmueblesController.prototype, "create", null);
__decorate([
    (0, common_1.Patch)(':id'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, update_inmueble_dto_1.UpdateInmuebleDto]),
    __metadata("design:returntype", void 0)
], InmueblesController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':id'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], InmueblesController.prototype, "remove", null);
exports.InmueblesController = InmueblesController = __decorate([
    (0, common_1.Controller)('inmuebles'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __metadata("design:paramtypes", [inmuebles_service_1.InmueblesService])
], InmueblesController);
//# sourceMappingURL=inmuebles.controller.js.map