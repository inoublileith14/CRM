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
exports.PropietariosController = void 0;
const common_1 = require("@nestjs/common");
const jwt_auth_guard_1 = require("../auth/jwt-auth.guard");
const create_propietario_dto_1 = require("./dto/create-propietario.dto");
const find_or_create_propietario_dto_1 = require("./dto/find-or-create-propietario.dto");
const update_propietario_dto_1 = require("./dto/update-propietario.dto");
const propietarios_service_1 = require("./propietarios.service");
let PropietariosController = class PropietariosController {
    propietariosService;
    constructor(propietariosService) {
        this.propietariosService = propietariosService;
    }
    findAll() {
        return this.propietariosService.findAll();
    }
    findOrCreate(dto) {
        return this.propietariosService.findOrCreate(dto);
    }
    findOne(id) {
        return this.propietariosService.findOne(id);
    }
    create(dto) {
        return this.propietariosService.create(dto);
    }
    update(id, dto) {
        return this.propietariosService.update(id, dto);
    }
    remove(id) {
        return this.propietariosService.remove(id);
    }
};
exports.PropietariosController = PropietariosController;
__decorate([
    (0, common_1.Get)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], PropietariosController.prototype, "findAll", null);
__decorate([
    (0, common_1.Post)('find-or-create'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [find_or_create_propietario_dto_1.FindOrCreatePropietarioDto]),
    __metadata("design:returntype", void 0)
], PropietariosController.prototype, "findOrCreate", null);
__decorate([
    (0, common_1.Get)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], PropietariosController.prototype, "findOne", null);
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_propietario_dto_1.CreatePropietarioDto]),
    __metadata("design:returntype", void 0)
], PropietariosController.prototype, "create", null);
__decorate([
    (0, common_1.Patch)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, update_propietario_dto_1.UpdatePropietarioDto]),
    __metadata("design:returntype", void 0)
], PropietariosController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], PropietariosController.prototype, "remove", null);
exports.PropietariosController = PropietariosController = __decorate([
    (0, common_1.Controller)('propietarios'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __metadata("design:paramtypes", [propietarios_service_1.PropietariosService])
], PropietariosController);
//# sourceMappingURL=propietarios.controller.js.map