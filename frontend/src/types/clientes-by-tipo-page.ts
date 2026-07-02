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
  nombre?: string;
  telefono?: string;
  ref_cliente?: string;
  entrada_prevista?: string;

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
