import { InmuebleClienteLinkRow } from './inmueble-cliente-link.interface';
export interface ClientesByTipoPageResult {
    rows: InmuebleClienteLinkRow[];
    total: number;
    page: number;
    limit: number;
}
export interface ClientesByTipoPageQuery {
    page: number;
    limit: number;
    sort?: 'fecha_entrada';
    dir?: 'asc' | 'desc';
}
