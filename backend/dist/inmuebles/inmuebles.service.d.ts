import { ClienteGestionEstado } from '../clientes/cliente-gestion-estado';
import { SupabaseService } from '../supabase/supabase.service';
import { CreateInmuebleDto } from './dto/create-inmueble.dto';
import { UpdateInmuebleDto } from './dto/update-inmueble.dto';
import { InmuebleClienteLinkRow } from './interfaces/inmueble-cliente-link.interface';
import { Inmueble } from './interfaces/inmueble.interface';
export declare class InmueblesService {
    private supabase;
    private readonly logger;
    constructor(supabase: SupabaseService);
    findAll(filters?: {
        tipo_operacion?: string;
        propietario_id?: string;
    }): Promise<Inmueble[]>;
    findClientesByTipoOperacion(tipoOperacion: 'alquiler' | 'venta'): Promise<InmuebleClienteLinkRow[]>;
    private mapCliente;
    findOne(id: string): Promise<Inmueble>;
    private findOneWithoutClientes;
    private isMissingClienteInmuebles;
    create(dto: CreateInmuebleDto): Promise<Inmueble>;
    update(id: string, dto: UpdateInmuebleDto): Promise<Inmueble>;
    updateClienteGestionEstado(inmuebleId: string, clienteId: string, gestionEstado: string): Promise<{
        gestion_estado: ClienteGestionEstado;
        fecha_ultima_gestion: string;
    }>;
    updateClienteFechaUltimaGestion(inmuebleId: string, clienteId: string, fechaUltimaGestion: string | null): Promise<{
        fecha_ultima_gestion: string | null;
    }>;
    remove(id: string): Promise<{
        mensaje: string;
    }>;
    private mapWithClientes;
}
