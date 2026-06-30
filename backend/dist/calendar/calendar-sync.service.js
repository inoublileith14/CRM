"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var CalendarSyncService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.CalendarSyncService = void 0;
const common_1 = require("@nestjs/common");
let CalendarSyncService = CalendarSyncService_1 = class CalendarSyncService {
    logger = new common_1.Logger(CalendarSyncService_1.name);
    subscribers = new Map();
    addSubscriber(userId, res) {
        const heartbeat = setInterval(() => {
            try {
                res.write(': ping\n\n');
            }
            catch {
                clearInterval(heartbeat);
            }
        }, 25_000);
        const subscriber = { res, heartbeat };
        const bucket = this.subscribers.get(userId) ?? new Set();
        bucket.add(subscriber);
        this.subscribers.set(userId, bucket);
        try {
            res.write(`event: connected\ndata: ${JSON.stringify({ ok: true })}\n\n`);
        }
        catch {
            this.removeSubscriber(userId, subscriber);
        }
        return () => this.removeSubscriber(userId, subscriber);
    }
    notifyUser(userId) {
        const bucket = this.subscribers.get(userId);
        if (!bucket?.size)
            return;
        const payload = `event: calendar-updated\ndata: ${JSON.stringify({
            at: Date.now(),
        })}\n\n`;
        for (const subscriber of bucket) {
            try {
                subscriber.res.write(payload);
            }
            catch (error) {
                this.logger.warn(`Calendar SSE write failed for user ${userId}: ${String(error)}`);
                this.removeSubscriber(userId, subscriber);
            }
        }
    }
    removeSubscriber(userId, subscriber) {
        clearInterval(subscriber.heartbeat);
        const bucket = this.subscribers.get(userId);
        if (!bucket)
            return;
        bucket.delete(subscriber);
        if (bucket.size === 0) {
            this.subscribers.delete(userId);
        }
    }
};
exports.CalendarSyncService = CalendarSyncService;
exports.CalendarSyncService = CalendarSyncService = CalendarSyncService_1 = __decorate([
    (0, common_1.Injectable)()
], CalendarSyncService);
//# sourceMappingURL=calendar-sync.service.js.map