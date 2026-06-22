import { CreatePropietarioDto } from './dto/create-propietario.dto';
import { FindOrCreatePropietarioDto } from './dto/find-or-create-propietario.dto';
import { UpdatePropietarioDto } from './dto/update-propietario.dto';
import { PropietariosService } from './propietarios.service';
export declare class PropietariosController {
    private propietariosService;
    constructor(propietariosService: PropietariosService);
    findAll(): Promise<import("./interfaces/propietario.interface").Propietario[]>;
    findOrCreate(dto: FindOrCreatePropietarioDto): Promise<import("./interfaces/propietario.interface").Propietario>;
    findOne(id: string): Promise<import("./interfaces/propietario.interface").Propietario>;
    create(dto: CreatePropietarioDto): Promise<import("./interfaces/propietario.interface").Propietario>;
    update(id: string, dto: UpdatePropietarioDto): Promise<import("./interfaces/propietario.interface").Propietario>;
    remove(id: string): Promise<{
        mensaje: string;
    }>;
}
