import { CreateInmuebleDto } from './dto/create-inmueble.dto';
import { UpdateClienteFechaUltimaGestionDto } from './dto/update-cliente-fecha-ultima-gestion.dto';
import { UpdateClienteGestionEstadoDto } from './dto/update-cliente-gestion-estado.dto';
import { UpdateInmuebleDto } from './dto/update-inmueble.dto';
import { InmueblesService } from './inmuebles.service';
export declare class InmueblesController {
    private inmueblesService;
    constructor(inmueblesService: InmueblesService);
    findAll(tipo_operacion?: string, propietario_id?: string): Promise<import("./interfaces/inmueble.interface").Inmueble[]>;
    findClientesByTipo(tipo_operacion?: string): Promise<import("./interfaces/inmueble-cliente-link.interface").InmuebleClienteLinkRow[]>;
    updateClienteGestionEstado(inmuebleId: string, clienteId: string, dto: UpdateClienteGestionEstadoDto): Promise<{
        gestion_estado: import("../clientes/cliente-gestion-estado").ClienteGestionEstado;
        fecha_ultima_gestion: string;
    }>;
    updateClienteFechaUltimaGestion(inmuebleId: string, clienteId: string, dto: UpdateClienteFechaUltimaGestionDto): Promise<{
        fecha_ultima_gestion: string | null;
    }>;
    findOne(id: string): Promise<import("./interfaces/inmueble.interface").Inmueble>;
    create(dto: CreateInmuebleDto): Promise<import("./interfaces/inmueble.interface").Inmueble>;
    update(id: string, dto: UpdateInmuebleDto): Promise<import("./interfaces/inmueble.interface").Inmueble>;
    remove(id: string): Promise<{
        mensaje: string;
    }>;
}
