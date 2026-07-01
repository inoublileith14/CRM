import { Request } from 'express';
import { UserProfile } from '../auth/interfaces/user.interface';
import { CreateInmuebleDto } from './dto/create-inmueble.dto';
import { UpdateClienteFechaUltimaGestionDto } from './dto/update-cliente-fecha-ultima-gestion.dto';
import { UpdateClienteGestionEstadoDto } from './dto/update-cliente-gestion-estado.dto';
import { UpdateInmuebleDto } from './dto/update-inmueble.dto';
import { InmueblesService } from './inmuebles.service';
export declare class InmueblesController {
    private inmueblesService;
    constructor(inmueblesService: InmueblesService);
    private assertAdmin;
    findAll(tipo_operacion?: string, propietario_id?: string): Promise<import("./interfaces/inmueble.interface").Inmueble[]>;
    findClientesByTipoRefs(tipo_operacion?: string, q?: string): Promise<{
        refs: string[];
    }>;
    findClientesByTipo(tipo_operacion?: string, page?: string, limit?: string, sort?: string, dir?: string, nombre?: string, telefono?: string, ref_cliente?: string, entrada_prevista?: string): Promise<import("./interfaces/clientes-by-tipo-page.interface").ClientesByTipoPageResult>;
    updateClienteGestionEstado(inmuebleId: string, clienteId: string, dto: UpdateClienteGestionEstadoDto): Promise<{
        gestion_estado: import("../clientes/cliente-gestion-estado").ClienteGestionEstado;
        fecha_ultima_gestion: string;
    }>;
    updateClienteFechaUltimaGestion(inmuebleId: string, clienteId: string, dto: UpdateClienteFechaUltimaGestionDto): Promise<{
        fecha_ultima_gestion: string | null;
    }>;
    findOne(id: string): Promise<import("./interfaces/inmueble.interface").Inmueble>;
    create(req: Request & {
        user: UserProfile;
    }, dto: CreateInmuebleDto): Promise<import("./interfaces/inmueble.interface").Inmueble>;
    update(req: Request & {
        user: UserProfile;
    }, id: string, dto: UpdateInmuebleDto): Promise<import("./interfaces/inmueble.interface").Inmueble>;
    remove(req: Request & {
        user: UserProfile;
    }, id: string): Promise<{
        mensaje: string;
    }>;
}
