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
    findAll(tipo_operacion, propietario_id) {
        return this.inmueblesService.findAll({
            tipo_operacion,
            propietario_id,
        });
    }
    findClientesByTipo(tipo_operacion) {
        if (tipo_operacion !== 'alquiler' && tipo_operacion !== 'venta') {
            throw new common_1.BadRequestException('tipo_operacion debe ser alquiler o venta');
        }
        return this.inmueblesService.findClientesByTipoOperacion(tipo_operacion);
    }
    updateClienteGestionEstado(inmuebleId, clienteId, dto) {
        return this.inmueblesService.updateClienteGestionEstado(inmuebleId, clienteId, dto.gestion_estado);
    }
    updateClienteFechaUltimaGestion(inmuebleId, clienteId, dto) {
        return this.inmueblesService.updateClienteFechaUltimaGestion(inmuebleId, clienteId, dto.fecha_ultima_gestion);
    }
    findOne(id) {
        return this.inmueblesService.findOne(id);
    }
    create(dto) {
        return this.inmueblesService.create(dto);
    }
    update(id, dto) {
        return this.inmueblesService.update(id, dto);
    }
    remove(id) {
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
    (0, common_1.Get)('clientes/by-tipo'),
    __param(0, (0, common_1.Query)('tipo_operacion')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
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
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_inmueble_dto_1.CreateInmuebleDto]),
    __metadata("design:returntype", void 0)
], InmueblesController.prototype, "create", null);
__decorate([
    (0, common_1.Patch)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, update_inmueble_dto_1.UpdateInmuebleDto]),
    __metadata("design:returntype", void 0)
], InmueblesController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], InmueblesController.prototype, "remove", null);
exports.InmueblesController = InmueblesController = __decorate([
    (0, common_1.Controller)('inmuebles'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __metadata("design:paramtypes", [inmuebles_service_1.InmueblesService])
], InmueblesController);
//# sourceMappingURL=inmuebles.controller.js.map