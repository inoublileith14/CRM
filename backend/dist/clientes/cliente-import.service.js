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
var ClienteImportService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ClienteImportService = void 0;
const common_1 = require("@nestjs/common");
const supabase_service_1 = require("../supabase/supabase.service");
const clientes_service_1 = require("./clientes.service");
const parse_cliente_excel_1 = require("./parse-cliente-excel");
const PROCESS_BATCH_SIZE = 150;
const MAX_FILE_BYTES = 50 * 1024 * 1024;
let ClienteImportService = ClienteImportService_1 = class ClienteImportService {
    supabase;
    clientesService;
    logger = new common_1.Logger(ClienteImportService_1.name);
    runningJobs = new Set();
    constructor(supabase, clientesService) {
        this.supabase = supabase;
        this.clientesService = clientesService;
    }
    async startUploadImport(file, options) {
        if (!file?.buffer?.length) {
            throw new common_1.BadRequestException('Debes subir un archivo Excel');
        }
        if (file.size > MAX_FILE_BYTES) {
            throw new common_1.BadRequestException('El archivo es demasiado grande (máximo 50 MB)');
        }
        const lower = file.originalname.toLowerCase();
        if (!lower.endsWith('.xls') && !lower.endsWith('.xlsx')) {
            throw new common_1.BadRequestException('Selecciona un archivo Excel (.xls o .xlsx)');
        }
        const normalizedOptions = {
            inmueble_id: options.inmueble_id?.trim() || undefined,
            worker_id: options.worker_id?.trim() || undefined,
            tipo_operacion: options.tipo_operacion === 'alquiler' ||
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
            throw new common_1.InternalServerErrorException('No se pudo iniciar la importación');
        }
        const jobId = data.id;
        const fileBuffer = Buffer.from(file.buffer);
        setImmediate(() => {
            void this.runJob(jobId, fileBuffer, normalizedOptions);
        });
        return { jobId };
    }
    async getJob(jobId) {
        const { data, error } = await this.supabase
            .getAdmin()
            .from('cliente_import_jobs')
            .select('id, status, total_rows, processed_rows, created_count, skipped_count, failed_count, error_message, options, created_at, updated_at')
            .eq('id', jobId)
            .maybeSingle();
        if (error) {
            this.logger.error(`Error al leer job ${jobId}: ${error.message}`);
            throw new common_1.InternalServerErrorException('No se pudo consultar la importación');
        }
        if (!data) {
            throw new common_1.NotFoundException('Importación no encontrada');
        }
        return data;
    }
    async runJob(jobId, fileBuffer, options) {
        if (this.runningJobs.has(jobId))
            return;
        this.runningJobs.add(jobId);
        try {
            await this.patchJob(jobId, { status: 'processing' });
            const rows = (0, parse_cliente_excel_1.parseClienteExcelBuffer)(fileBuffer);
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
                }
                catch (err) {
                    const message = err instanceof Error ? err.message : 'Error en lote de importación';
                    this.logger.warn(`Import job ${jobId} batch failed at row ${index}: ${message}`);
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
        }
        catch (err) {
            const message = err instanceof Error ? err.message : 'Error al procesar el Excel';
            this.logger.error(`Import job ${jobId} failed: ${message}`);
            await this.patchJob(jobId, {
                status: 'failed',
                error_message: message,
            });
        }
        finally {
            this.runningJobs.delete(jobId);
        }
    }
    async patchJob(jobId, patch) {
        const { error } = await this.supabase
            .getAdmin()
            .from('cliente_import_jobs')
            .update({
            ...patch,
            updated_at: new Date().toISOString(),
        })
            .eq('id', jobId);
        if (error) {
            this.logger.error(`Error al actualizar job ${jobId}: ${error.message}`);
        }
    }
};
exports.ClienteImportService = ClienteImportService;
exports.ClienteImportService = ClienteImportService = ClienteImportService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [supabase_service_1.SupabaseService,
        clientes_service_1.ClientesService])
], ClienteImportService);
//# sourceMappingURL=cliente-import.service.js.map