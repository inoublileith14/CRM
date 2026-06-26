import { InmuebleClienteLinkRow } from '@/types/inmueble-cliente-link';

export interface ClientesByTipoPageResult {
  rows: InmuebleClienteLinkRow[];
  total: number;
  page: number;
  limit: number;
}

export interface ClientesByTipoListParams {
  page: number;
  limit: number;
  sort?: 'fecha_entrada';
  dir?: 'asc' | 'desc';
}
