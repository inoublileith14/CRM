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
exports.WorkersController = void 0;
const common_1 = require("@nestjs/common");
const jwt_auth_guard_1 = require("../auth/jwt-auth.guard");
const create_worker_dto_1 = require("./dto/create-worker.dto");
const update_worker_dto_1 = require("./dto/update-worker.dto");
const workers_service_1 = require("./workers.service");
let WorkersController = class WorkersController {
    workersService;
    constructor(workersService) {
        this.workersService = workersService;
    }
    assertAdmin(req) {
        if (req.user.rol !== 'admin') {
            throw new common_1.ForbiddenException('Solo admin');
        }
    }
    findAll(activo) {
        const activoOnly = activo === 'true';
        return this.workersService.findAll(activoOnly);
    }
    async findMe(req) {
        const worker_id = await this.workersService.findIdByProfileId(req.user.id);
        return { worker_id };
    }
    findOne(req, id) {
        this.assertAdmin(req);
        return this.workersService.findOne(id);
    }
    create(req, dto) {
        this.assertAdmin(req);
        return this.workersService.create(dto);
    }
    resendInvitation(req, id) {
        this.assertAdmin(req);
        return this.workersService.resendInvitation(id);
    }
    update(req, id, dto) {
        this.assertAdmin(req);
        return this.workersService.update(id, dto);
    }
    remove(req, id) {
        this.assertAdmin(req);
        return this.workersService.remove(id);
    }
};
exports.WorkersController = WorkersController;
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, common_1.Query)('activo')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], WorkersController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)('me'),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], WorkersController.prototype, "findMe", null);
__decorate([
    (0, common_1.Get)(':id'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], WorkersController.prototype, "findOne", null);
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, create_worker_dto_1.CreateWorkerDto]),
    __metadata("design:returntype", void 0)
], WorkersController.prototype, "create", null);
__decorate([
    (0, common_1.Post)(':id/reenviar-invitacion'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], WorkersController.prototype, "resendInvitation", null);
__decorate([
    (0, common_1.Patch)(':id'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, update_worker_dto_1.UpdateWorkerDto]),
    __metadata("design:returntype", void 0)
], WorkersController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':id'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], WorkersController.prototype, "remove", null);
exports.WorkersController = WorkersController = __decorate([
    (0, common_1.Controller)('workers'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __metadata("design:paramtypes", [workers_service_1.WorkersService])
], WorkersController);
//# sourceMappingURL=workers.controller.js.map