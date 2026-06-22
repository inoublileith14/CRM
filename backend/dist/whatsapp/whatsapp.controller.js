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
exports.WhatsAppController = void 0;
const common_1 = require("@nestjs/common");
const jwt_auth_guard_1 = require("../auth/jwt-auth.guard");
const bulk_send_dto_1 = require("./dto/bulk-send.dto");
const whatsapp_service_1 = require("./whatsapp.service");
let WhatsAppController = class WhatsAppController {
    whatsappService;
    constructor(whatsappService) {
        this.whatsappService = whatsappService;
    }
    bulkSend(req, dto) {
        return this.whatsappService.bulkSend(dto.inmuebleId, dto.clienteIds ?? [], req.user.nombre);
    }
    async listConversations(req) {
        if (req.user.rol !== 'admin') {
            throw new common_1.ForbiddenException('Solo admin');
        }
        return this.whatsappService.listConversations();
    }
    async listMessages(req, conversationId) {
        if (req.user.rol !== 'admin') {
            throw new common_1.ForbiddenException('Solo admin');
        }
        return this.whatsappService.listMessages(conversationId);
    }
    async reply(req, conversationId, body) {
        if (req.user.rol !== 'admin') {
            throw new common_1.ForbiddenException('Solo admin');
        }
        return this.whatsappService.reply(conversationId, body.text ?? '');
    }
    verifyWebhook(mode, verifyToken, challenge) {
        const verified = this.whatsappService.verifyWebhook(mode, verifyToken, challenge);
        if (!verified) {
            throw new common_1.ForbiddenException('Verificación de webhook fallida');
        }
        return verified;
    }
    async handleWebhook(body) {
        await this.whatsappService.handleWebhookPayload(body);
        return { received: true };
    }
};
exports.WhatsAppController = WhatsAppController;
__decorate([
    (0, common_1.Post)('bulk-send'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, bulk_send_dto_1.BulkSendWhatsAppDto]),
    __metadata("design:returntype", void 0)
], WhatsAppController.prototype, "bulkSend", null);
__decorate([
    (0, common_1.Get)('conversations'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], WhatsAppController.prototype, "listConversations", null);
__decorate([
    (0, common_1.Get)('conversations/:id/messages'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], WhatsAppController.prototype, "listMessages", null);
__decorate([
    (0, common_1.Post)('conversations/:id/reply'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, Object]),
    __metadata("design:returntype", Promise)
], WhatsAppController.prototype, "reply", null);
__decorate([
    (0, common_1.Get)('webhook'),
    (0, common_1.Header)('Content-Type', 'text/plain; charset=utf-8'),
    __param(0, (0, common_1.Query)('hub.mode')),
    __param(1, (0, common_1.Query)('hub.verify_token')),
    __param(2, (0, common_1.Query)('hub.challenge')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", void 0)
], WhatsAppController.prototype, "verifyWebhook", null);
__decorate([
    (0, common_1.Post)('webhook'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], WhatsAppController.prototype, "handleWebhook", null);
exports.WhatsAppController = WhatsAppController = __decorate([
    (0, common_1.Controller)('whatsapp'),
    __metadata("design:paramtypes", [whatsapp_service_1.WhatsAppService])
], WhatsAppController);
//# sourceMappingURL=whatsapp.controller.js.map