import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { randomUUID } from 'crypto';
import { SupabaseService } from '../supabase/supabase.service';

const BUCKET = 'images';
const MAX_BYTES = 5 * 1024 * 1024;
const ALLOWED_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
]);

@Injectable()
export class StorageService {
  private readonly logger = new Logger(StorageService.name);

  constructor(private supabase: SupabaseService) {}

  async uploadImage(file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException({
        message: 'No se recibió ningún archivo',
        code: 'FILE_REQUIRED',
      });
    }

    if (!ALLOWED_TYPES.has(file.mimetype)) {
      throw new BadRequestException({
        message: 'Solo se permiten imágenes (JPEG, PNG, WebP, GIF)',
        code: 'INVALID_FILE_TYPE',
      });
    }

    if (file.size > MAX_BYTES) {
      throw new BadRequestException({
        message: 'La imagen no puede superar 5 MB',
        code: 'FILE_TOO_LARGE',
      });
    }

    const ext = this.extensionFromMime(file.mimetype);
    const path = `inmuebles/${randomUUID()}.${ext}`;

    const { error } = await this.supabase
      .getAdmin()
      .storage.from(BUCKET)
      .upload(path, file.buffer, {
        contentType: file.mimetype,
        upsert: false,
      });

    if (error) {
      this.logger.error(`Error al subir imagen: ${error.message}`);
      throw new InternalServerErrorException({
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

  private extensionFromMime(mime: string): string {
    const map: Record<string, string> = {
      'image/jpeg': 'jpg',
      'image/png': 'png',
      'image/webp': 'webp',
      'image/gif': 'gif',
    };
    return map[mime] ?? 'jpg';
  }
}
