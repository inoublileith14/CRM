import { CreateInmuebleDto } from './dto/create-inmueble.dto';
import { UpdateInmuebleDto } from './dto/update-inmueble.dto';
type SplitFieldsDto = CreateInmuebleDto | UpdateInmuebleDto;
export declare function normalizeInmuebleSplitFields<T extends SplitFieldsDto>(dto: T): T;
export {};
