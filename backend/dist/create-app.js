"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createApp = createApp;
exports.getExpressInstance = getExpressInstance;
require("reflect-metadata");
const core_1 = require("@nestjs/core");
const platform_express_1 = require("@nestjs/platform-express");
const express_1 = __importDefault(require("express"));
const app_module_1 = require("./app.module");
let cachedApp = null;
async function createApp() {
    if (cachedApp) {
        return cachedApp;
    }
    const expressApp = (0, express_1.default)();
    expressApp.use(express_1.default.json({ limit: '10mb' }));
    expressApp.use(express_1.default.urlencoded({ limit: '10mb', extended: true }));
    const app = await core_1.NestFactory.create(app_module_1.AppModule, new platform_express_1.ExpressAdapter(expressApp));
    app.enableCors({
        origin: process.env.FRONTEND_URL ?? 'http://localhost:3000',
        credentials: true,
    });
    await app.init();
    cachedApp = app;
    return app;
}
async function getExpressInstance() {
    const app = await createApp();
    return app.getHttpAdapter().getInstance();
}
//# sourceMappingURL=create-app.js.map