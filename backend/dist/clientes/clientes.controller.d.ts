import { ClienteImportService } from './cliente-import.service';
import { ClientesService } from './clientes.service';
import { BulkDeleteClientesDto } from './dto/bulk-delete-clientes.dto';
import { BulkAssignInmuebleDto } from './dto/bulk-assign-inmueble.dto';
import { BulkAssignWorkerDto } from './dto/bulk-assign-worker.dto';
import { BulkUnassignWorkerDto } from './dto/bulk-unassign-worker.dto';
import { BulkImportClientesDto } from './dto/bulk-import-clientes.dto';
import { CreateClienteDto } from './dto/create-cliente.dto';
import { CreateClientePerfilDto } from './dto/create-cliente-perfil.dto';
import { UpdateClienteDto } from './dto/update-cliente.dto';
import { UpdateClientePerfilDto } from './dto/update-cliente-perfil.dto';
export declare class ClientesController {
    private clientesService;
    private clienteImportService;
    constructor(clientesService: ClientesService, clienteImportService: ClienteImportService);
    findAll(): Promise<import("./interfaces/cliente.interface").Cliente[]>;
    bulkAssignWorker(dto: BulkAssignWorkerDto): Promise<{
        assigned: number;
    }>;
    bulkUnassignWorker(dto: BulkUnassignWorkerDto): Promise<{
        unassigned: number;
    }>;
    bulkAssignInmueble(dto: BulkAssignInmuebleDto): Promise<{
        assigned: number;
        skipped: number;
        phone_duplicates_skipped: number;
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
    createPerfil(id: string, dto: CreateClientePerfilDto): Promise<import("./interfaces/cliente-perfil.interface").ClientePerfil>;
    updatePerfil(id: string, perfilId: string, dto: UpdateClientePerfilDto): Promise<import("./interfaces/cliente-perfil.interface").ClientePerfil>;
    removePerfil(id: string, perfilId: string): Promise<void>;
    remove(id: string): Promise<{
        mensaje: string;
    }>;
}
