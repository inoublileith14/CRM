import { SupabaseService } from '../supabase/supabase.service';
import { BulkAssignInmuebleDto } from './dto/bulk-assign-inmueble.dto';
import { BulkAssignWorkerDto } from './dto/bulk-assign-worker.dto';
import { BulkImportClientesDto } from './dto/bulk-import-clientes.dto';
import { CreateClienteDto } from './dto/create-cliente.dto';
import { UpdateClienteDto } from './dto/update-cliente.dto';
import { Cliente } from './interfaces/cliente.interface';
export declare class ClientesService {
    private supabase;
    private readonly logger;
    constructor(supabase: SupabaseService);
    findAll(): Promise<Cliente[]>;
    findOne(id: string): Promise<Cliente>;
    create(dto: CreateClienteDto): Promise<Cliente>;
    update(id: string, dto: UpdateClienteDto): Promise<Cliente>;
    bulkAssignWorker(dto: BulkAssignWorkerDto): Promise<{
        assigned: number;
    }>;
    bulkUnassignWorker(dto: {
        cliente_ids: string[];
    }): Promise<{
        unassigned: number;
    }>;
    bulkAssignInmueble(dto: BulkAssignInmuebleDto): Promise<{
        assigned: number;
        skipped: number;
    }>;
    bulkImport(dto: BulkImportClientesDto): Promise<{
        created: number;
        skipped: number;
        failed: number;
    }>;
    remove(id: string): Promise<{
        mensaje: string;
    }>;
    bulkRemove(dto: {
        cliente_ids: string[];
    }): Promise<{
        deleted: number;
    }>;
    private syncRelations;
    private findDuplicateByPhoneDateAndInmuebles;
    private buildClienteInsertPayload;
    private mapCliente;
}
