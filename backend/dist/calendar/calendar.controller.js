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
exports.CalendarController = void 0;
const common_1 = require("@nestjs/common");
const jwt_auth_guard_1 = require("../auth/jwt-auth.guard");
const calendar_service_1 = require("./calendar.service");
let CalendarController = class CalendarController {
    calendarService;
    constructor(calendarService) {
        this.calendarService = calendarService;
    }
    connect(req) {
        return this.calendarService.getConnectUrl(req.user.id);
    }
    callback(req, code, state) {
        if (!code || !state) {
            return { connected: false, error: 'missing_params' };
        }
        return this.calendarService.handleCallback(req.user.id, code, state);
    }
    status(req) {
        return this.calendarService.getStatus(req.user.id);
    }
    events(req) {
        return this.calendarService.listUpcomingEvents(req.user.id);
    }
    disconnect(req) {
        return this.calendarService.disconnect(req.user.id);
    }
};
exports.CalendarController = CalendarController;
__decorate([
    (0, common_1.Get)('connect'),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], CalendarController.prototype, "connect", null);
__decorate([
    (0, common_1.Get)('callback'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Query)('code')),
    __param(2, (0, common_1.Query)('state')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String]),
    __metadata("design:returntype", void 0)
], CalendarController.prototype, "callback", null);
__decorate([
    (0, common_1.Get)('status'),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], CalendarController.prototype, "status", null);
__decorate([
    (0, common_1.Get)('events'),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], CalendarController.prototype, "events", null);
__decorate([
    (0, common_1.Delete)('disconnect'),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], CalendarController.prototype, "disconnect", null);
exports.CalendarController = CalendarController = __decorate([
    (0, common_1.Controller)('calendar'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __metadata("design:paramtypes", [calendar_service_1.CalendarService])
], CalendarController);
//# sourceMappingURL=calendar.controller.js.map