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
var StorageService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.StorageService = void 0;
const common_1 = require("@nestjs/common");
const crypto_1 = require("crypto");
const supabase_service_1 = require("../supabase/supabase.service");
const BUCKET = 'images';
const MAX_BYTES = 5 * 1024 * 1024;
const ALLOWED_TYPES = new Set([
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/gif',
]);
let StorageService = StorageService_1 = class StorageService {
    supabase;
    logger = new common_1.Logger(StorageService_1.name);
    constructor(supabase) {
        this.supabase = supabase;
    }
    async uploadImage(file) {
        if (!file) {
            throw new common_1.BadRequestException({
                message: 'No se recibió ningún archivo',
                code: 'FILE_REQUIRED',
            });
        }
        if (!ALLOWED_TYPES.has(file.mimetype)) {
            throw new common_1.BadRequestException({
                message: 'Solo se permiten imágenes (JPEG, PNG, WebP, GIF)',
                code: 'INVALID_FILE_TYPE',
            });
        }
        if (file.size > MAX_BYTES) {
            throw new common_1.BadRequestException({
                message: 'La imagen no puede superar 5 MB',
                code: 'FILE_TOO_LARGE',
            });
        }
        const ext = this.extensionFromMime(file.mimetype);
        const path = `inmuebles/${(0, crypto_1.randomUUID)()}.${ext}`;
        const { error } = await this.supabase
            .getAdmin()
            .storage.from(BUCKET)
            .upload(path, file.buffer, {
            contentType: file.mimetype,
            upsert: false,
        });
        if (error) {
            this.logger.error(`Error al subir imagen: ${error.message}`);
            throw new common_1.InternalServerErrorException({
                message: 'No se pudo subir la imagen',
                code: 'UPLOAD_ERROR',
            });
        }
        const { data } = this.supabase
            .getAdmin()
            .storage.from(BUCKET)
            .getPublicUrl(path);
        return { url: data.publicUrl, path };
    }
    extensionFromMime(mime) {
        const map = {
            'image/jpeg': 'jpg',
            'image/png': 'png',
            'image/webp': 'webp',
            'image/gif': 'gif',
        };
        return map[mime] ?? 'jpg';
    }
};
exports.StorageService = StorageService;
exports.StorageService = StorageService = StorageService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [supabase_service_1.SupabaseService])
], StorageService);
//# sourceMappingURL=storage.service.js.map