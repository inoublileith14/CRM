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
exports.ClientesController = void 0;
const common_1 = require("@nestjs/common");
const platform_express_1 = require("@nestjs/platform-express");
const jwt_auth_guard_1 = require("../auth/jwt-auth.guard");
const cliente_import_service_1 = require("./cliente-import.service");
const clientes_service_1 = require("./clientes.service");
const bulk_delete_clientes_dto_1 = require("./dto/bulk-delete-clientes.dto");
const bulk_assign_inmueble_dto_1 = require("./dto/bulk-assign-inmueble.dto");
const bulk_assign_worker_dto_1 = require("./dto/bulk-assign-worker.dto");
const bulk_unassign_worker_dto_1 = require("./dto/bulk-unassign-worker.dto");
const bulk_import_clientes_dto_1 = require("./dto/bulk-import-clientes.dto");
const create_cliente_dto_1 = require("./dto/create-cliente.dto");
const update_cliente_dto_1 = require("./dto/update-cliente.dto");
const IMPORT_FILE_LIMIT_BYTES = 50 * 1024 * 1024;
let ClientesController = class ClientesController {
    clientesService;
    clienteImportService;
    constructor(clientesService, clienteImportService) {
        this.clientesService = clientesService;
        this.clienteImportService = clienteImportService;
    }
    findAll() {
        return this.clientesService.findAll();
    }
    bulkAssignWorker(dto) {
        return this.clientesService.bulkAssignWorker(dto);
    }
    bulkUnassignWorker(dto) {
        return this.clientesService.bulkUnassignWorker(dto);
    }
    bulkAssignInmueble(dto) {
        return this.clientesService.bulkAssignInmueble(dto);
    }
    bulkRemove(dto) {
        return this.clientesService.bulkRemove(dto);
    }
    bulkImport(dto) {
        return this.clientesService.bulkImport(dto);
    }
    importUpload(file, body) {
        return this.clienteImportService.startUploadImport(file, {
            inmueble_id: body.inmueble_id,
            worker_id: body.worker_id,
            tipo_operacion: body.tipo_operacion === 'alquiler' || body.tipo_operacion === 'venta'
                ? body.tipo_operacion
                : undefined,
            skip_duplicates: body.skip_duplicates !== 'false',
        });
    }
    getImportJob(jobId) {
        return this.clienteImportService.getJob(jobId);
    }
    findOne(id) {
        return this.clientesService.findOne(id);
    }
    create(dto) {
        return this.clientesService.create(dto);
    }
    update(id, dto) {
        return this.clientesService.update(id, dto);
    }
    remove(id) {
        return this.clientesService.remove(id);
    }
};
exports.ClientesController = ClientesController;
__decorate([
    (0, common_1.Get)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], ClientesController.prototype, "findAll", null);
__decorate([
    (0, common_1.Post)('bulk-assign-worker'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [bulk_assign_worker_dto_1.BulkAssignWorkerDto]),
    __metadata("design:returntype", void 0)
], ClientesController.prototype, "bulkAssignWorker", null);
__decorate([
    (0, common_1.Post)('bulk-unassign-worker'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [bulk_unassign_worker_dto_1.BulkUnassignWorkerDto]),
    __metadata("design:returntype", void 0)
], ClientesController.prototype, "bulkUnassignWorker", null);
__decorate([
    (0, common_1.Post)('bulk-assign-inmueble'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [bulk_assign_inmueble_dto_1.BulkAssignInmuebleDto]),
    __metadata("design:returntype", void 0)
], ClientesController.prototype, "bulkAssignInmueble", null);
__decorate([
    (0, common_1.Post)('bulk-delete'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [bulk_delete_clientes_dto_1.BulkDeleteClientesDto]),
    __metadata("design:returntype", void 0)
], ClientesController.prototype, "bulkRemove", null);
__decorate([
    (0, common_1.Post)('bulk-import'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [bulk_import_clientes_dto_1.BulkImportClientesDto]),
    __metadata("design:returntype", void 0)
], ClientesController.prototype, "bulkImport", null);
__decorate([
    (0, common_1.Post)('import/upload'),
    (0, common_1.UseInterceptors)((0, platform_express_1.FileInterceptor)('file', {
        limits: { fileSize: IMPORT_FILE_LIMIT_BYTES },
    })),
    __param(0, (0, common_1.UploadedFile)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], ClientesController.prototype, "importUpload", null);
__decorate([
    (0, common_1.Get)('import/:jobId'),
    __param(0, (0, common_1.Param)('jobId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], ClientesController.prototype, "getImportJob", null);
__decorate([
    (0, common_1.Get)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], ClientesController.prototype, "findOne", null);
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_cliente_dto_1.CreateClienteDto]),
    __metadata("design:returntype", void 0)
], ClientesController.prototype, "create", null);
__decorate([
    (0, common_1.Patch)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, update_cliente_dto_1.UpdateClienteDto]),
    __metadata("design:returntype", void 0)
], ClientesController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], ClientesController.prototype, "remove", null);
exports.ClientesController = ClientesController = __decorate([
    (0, common_1.Controller)('clientes'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __metadata("design:paramtypes", [clientes_service_1.ClientesService,
        cliente_import_service_1.ClienteImportService])
], ClientesController);
//# sourceMappingURL=clientes.controller.js.map