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
  nombre?: string;
  telefono?: string;
  ref_cliente?: string;
  /** Comma-separated entrada prevista codes (ya, semana, …). */
  entrada_prevista?: string;

  // Range filters (strings to preserve user input; parsing happens server-side)
  presupuesto_maximo_min?: string;
  presupuesto_maximo_max?: string;
  presupuesto_peticion_min?: string;
  presupuesto_peticion_max?: string;
  habitaciones_min?: string;
  habitaciones_max?: string;
  banos_min?: string;
  banos_max?: string;
  metros_min?: string;
  metros_max?: string;
  barrio?: string;
  distrito?: string;
}
