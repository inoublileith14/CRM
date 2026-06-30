import { SupabaseService } from '../supabase/supabase.service';
import { BulkAssignInmuebleDto } from './dto/bulk-assign-inmueble.dto';
import { BulkAssignWorkerDto } from './dto/bulk-assign-worker.dto';
import { BulkImportClientesDto } from './dto/bulk-import-clientes.dto';
import { CreateClienteDto } from './dto/create-cliente.dto';
import { CreateClientePerfilDto } from './dto/create-cliente-perfil.dto';
import { UpdateClienteDto } from './dto/update-cliente.dto';
import { UpdateClientePerfilDto } from './dto/update-cliente-perfil.dto';
import { Cliente } from './interfaces/cliente.interface';
import { ClientePerfil } from './interfaces/cliente-perfil.interface';
export declare class ClientesService {
    private supabase;
    private readonly logger;
    constructor(supabase: SupabaseService);
    findAll(): Promise<Cliente[]>;
    findOne(id: string): Promise<Cliente>;
    create(dto: CreateClienteDto): Promise<Cliente>;
    update(id: string, dto: UpdateClienteDto): Promise<Cliente>;
    createPerfil(clienteId: string, dto: CreateClientePerfilDto): Promise<ClientePerfil>;
    updatePerfil(clienteId: string, perfilId: string, dto: UpdateClientePerfilDto): Promise<ClientePerfil>;
    removePerfil(clienteId: string, perfilId: string): Promise<void>;
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
    private sanitizeClienteWriteData;
    private buildClienteInsertPayload;
    private mapCliente;
    private mapPerfil;
}
