import { ClienteImportService } from './cliente-import.service';
import { ClientesService } from './clientes.service';
import { BulkDeleteClientesDto } from './dto/bulk-delete-clientes.dto';
import { BulkAssignInmuebleDto } from './dto/bulk-assign-inmueble.dto';
import { BulkAssignWorkerDto } from './dto/bulk-assign-worker.dto';
import { BulkImportClientesDto } from './dto/bulk-import-clientes.dto';
import { CreateClienteDto } from './dto/create-cliente.dto';
import { UpdateClienteDto } from './dto/update-cliente.dto';
export declare class ClientesController {
    private clientesService;
    private clienteImportService;
    constructor(clientesService: ClientesService, clienteImportService: ClienteImportService);
    findAll(): Promise<import("./interfaces/cliente.interface").Cliente[]>;
    bulkAssignWorker(dto: BulkAssignWorkerDto): Promise<{
        assigned: number;
    }>;
    bulkAssignInmueble(dto: BulkAssignInmuebleDto): Promise<{
        assigned: number;
        skipped: number;
    }>;
    bulkRemove(dto: BulkDeleteClientesDto): Promise<{
        deleted: number;
    }>;
    bulkImport(dto: BulkImportClientesDto): Promise<{
        created: number;
        skipped: number;
        failed: number;
    }>;
    importUpload(file: Express.Multer.File, body: {
        inmueble_id?: string;
        worker_id?: string;
        tipo_operacion?: string;
        skip_duplicates?: string;
    }): Promise<{
        jobId: string;
    }>;
    getImportJob(jobId: string): Promise<import("./cliente-import.service").ClienteImportJob>;
    findOne(id: string): Promise<import("./interfaces/cliente.interface").Cliente>;
    create(dto: CreateClienteDto): Promise<import("./interfaces/cliente.interface").Cliente>;
    update(id: string, dto: UpdateClienteDto): Promise<import("./interfaces/cliente.interface").Cliente>;
    remove(id: string): Promise<{
        mensaje: string;
    }>;
}
