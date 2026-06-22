import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import { ClientesService } from './clientes.service';
import { BulkImportClientesOptionsDto } from './dto/bulk-import-clientes.dto';
import { parseClienteExcelBuffer } from './parse-cliente-excel';

export type ClienteImportJobStatus =
  | 'pending'
  | 'processing'
  | 'completed'
  | 'failed';

export interface ClienteImportJob {
  id: string;
  status: ClienteImportJobStatus;
  total_rows: number;
  processed_rows: number;
  created_count: number;
  skipped_count: number;
  failed_count: number;
  error_message: string | null;
  options: BulkImportClientesOptionsDto;
  created_at: string;
  updated_at: string;
}

const PROCESS_BATCH_SIZE = 150;
const MAX_FILE_BYTES = 50 * 1024 * 1024;

@Injectable()
export class ClienteImportService {
  private readonly logger = new Logger(ClienteImportService.name);
  private readonly runningJobs = new Set<string>();

  constructor(
    private supabase: SupabaseService,
    private clientesService: ClientesService,
  ) {}

  async startUploadImport(
    file: Express.Multer.File,
    options: BulkImportClientesOptionsDto,
  ): Promise<{ jobId: string }> {
    if (!file?.buffer?.length) {
      throw new BadRequestException('Debes subir un archivo Excel');
    }

    if (file.size > MAX_FILE_BYTES) {
      throw new BadRequestException(
        'El archivo es demasiado grande (máximo 50 MB)',
      );
    }

    const lower = file.originalname.toLowerCase();
    if (!lower.endsWith('.xls') && !lower.endsWith('.xlsx')) {
      throw new BadRequestException(
        'Selecciona un archivo Excel (.xls o .xlsx)',
      );
    }

    const normalizedOptions: BulkImportClientesOptionsDto = {
      inmueble_id: options.inmueble_id?.trim() || undefined,
      worker_id: options.worker_id?.trim() || undefined,
      tipo_operacion:
        options.tipo_operacion === 'alquiler' ||
        options.tipo_operacion === 'venta'
          ? options.tipo_operacion
          : undefined,
      skip_duplicates: options.skip_duplicates !== false,
    };

    const { data, error } = await this.supabase
      .getAdmin()
      .from('cliente_import_jobs')
      .insert({
        status: 'pending',
        options: normalizedOptions,
      })
      .select('id')
      .single();

    if (error || !data) {
      this.logger.error(`Error al crear job de importación: ${error?.message}`);
      throw new InternalServerErrorException(
        'No se pudo iniciar la importación',
      );
    }

    const jobId = data.id as string;
    const fileBuffer = Buffer.from(file.buffer);

    setImmediate(() => {
      void this.runJob(jobId, fileBuffer, normalizedOptions);
    });

    return { jobId };
  }

  async getJob(jobId: string): Promise<ClienteImportJob> {
    const { data, error } = await this.supabase
      .getAdmin()
      .from('cliente_import_jobs')
      .select(
        'id, status, total_rows, processed_rows, created_count, skipped_count, failed_count, error_message, options, created_at, updated_at',
      )
      .eq('id', jobId)
      .maybeSingle();

    if (error) {
      this.logger.error(`Error al leer job ${jobId}: ${error.message}`);
      throw new InternalServerErrorException(
        'No se pudo consultar la importación',
      );
    }

    if (!data) {
      throw new NotFoundException('Importación no encontrada');
    }

    return data as ClienteImportJob;
  }

  private async runJob(
    jobId: string,
    fileBuffer: Buffer,
    options: BulkImportClientesOptionsDto,
  ): Promise<void> {
    if (this.runningJobs.has(jobId)) return;
    this.runningJobs.add(jobId);

    try {
      await this.patchJob(jobId, { status: 'processing' });

      const rows = parseClienteExcelBuffer(fileBuffer);

      if (rows.length === 0) {
        await this.patchJob(jobId, {
          status: 'failed',
          error_message: 'El Excel no contiene clientes válidos',
        });
        return;
      }

      await this.patchJob(jobId, { total_rows: rows.length });

      let processedRows = 0;
      let createdCount = 0;
      let skippedCount = 0;
      let failedCount = 0;

      for (let index = 0; index < rows.length; index += PROCESS_BATCH_SIZE) {
        const chunk = rows.slice(index, index + PROCESS_BATCH_SIZE);

        try {
          const result = await this.clientesService.bulkImport({
            clientes: chunk,
            options,
          });
          createdCount += result.created;
          skippedCount += result.skipped;
          failedCount += result.failed;
        } catch (err) {
          const message =
            err instanceof Error ? err.message : 'Error en lote de importación';
          this.logger.warn(
            `Import job ${jobId} batch failed at row ${index}: ${message}`,
          );
          failedCount += chunk.length;
        }

        processedRows = Math.min(index + chunk.length, rows.length);

        await this.patchJob(jobId, {
          processed_rows: processedRows,
          created_count: createdCount,
          skipped_count: skippedCount,
          failed_count: failedCount,
        });
      }

      await this.patchJob(jobId, {
        status: 'completed',
        processed_rows: rows.length,
        created_count: createdCount,
        skipped_count: skippedCount,
        failed_count: failedCount,
        error_message: null,
      });
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Error al procesar el Excel';
      this.logger.error(`Import job ${jobId} failed: ${message}`);
      await this.patchJob(jobId, {
        status: 'failed',
        error_message: message,
      });
    } finally {
      this.runningJobs.delete(jobId);
    }
  }

  private async patchJob(
    jobId: string,
    patch: Record<string, unknown>,
  ): Promise<void> {
    const { error } = await this.supabase
      .getAdmin()
      .from('cliente_import_jobs')
      .update({
        ...patch,
        updated_at: new Date().toISOString(),
      })
      .eq('id', jobId);

    if (error) {
      this.logger.error(
        `Error al actualizar job ${jobId}: ${error.message}`,
      );
    }
  }
}
