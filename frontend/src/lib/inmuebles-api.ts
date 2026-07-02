import { ClienteGestionEstado } from '@/types/cliente';
import { Inmueble, InmuebleFormData } from '@/types/inmueble';
import {
  ClientesByTipoListParams,
  ClientesByTipoPageResult,
} from '@/types/clientes-by-tipo-page';
import { InmuebleClienteLinkRow } from '@/types/inmueble-cliente-link';
import { parseApiResponse } from './parse-api-error';
import { ApiError } from './api';

async function request<T>(
  url: string,
  init?: RequestInit,
): Promise<T> {
  let res: Response;

  try {
    res = await fetch(url, init);
  } catch {
    throw new ApiError(
      'No se pudo conectar con el servidor',
      0,
      'NETWORK_ERROR',
    );
  }

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw parseApiResponse(data, res);
  }

  return data as T;
}

export interface InmueblesFilters {
  tipo_operacion?: 'alquiler' | 'venta';
  propietario_id?: string;
}

export function getInmuebles(
  filters?: InmueblesFilters,
): Promise<Inmueble[]> {
  const params = new URLSearchParams();
  if (filters?.tipo_operacion) {
    params.set('tipo_operacion', filters.tipo_operacion);
  }
  if (filters?.propietario_id) {
    params.set('propietario_id', filters.propietario_id);
  }
  const qs = params.toString();
  return request<Inmueble[]>(`/api/inmuebles${qs ? `?${qs}` : ''}`);
}

export function getInmuebleClienteRefsByTipo(
  tipo_operacion: 'alquiler' | 'venta',
  search?: string,
): Promise<{ refs: string[] }> {
  const params = new URLSearchParams({ tipo_operacion });
  if (search?.trim()) {
    params.set('q', search.trim());
  }
  return request<{ refs: string[] }>(
    `/api/inmuebles/clientes/by-tipo/refs?${params.toString()}`,
  );
}

export function getInmuebleClientesByTipo(
  tipo_operacion: 'alquiler' | 'venta',
  params: ClientesByTipoListParams,
): Promise<ClientesByTipoPageResult> {
  const search = new URLSearchParams({
    tipo_operacion,
    page: String(params.page),
    limit: String(params.limit),
  });
  if (params.sort) {
    search.set('sort', params.sort);
  }
  if (params.dir) {
    search.set('dir', params.dir);
  }
  if (params.nombre) {
    search.set('nombre', params.nombre);
  }
  if (params.telefono) {
    search.set('telefono', params.telefono);
  }
  if (params.ref_cliente) {
    search.set('ref_cliente', params.ref_cliente);
  }
  if (params.entrada_prevista !== undefined) {
    search.set('entrada_prevista', params.entrada_prevista);
  }
  if (params.presupuesto_maximo_min) search.set('presupuesto_maximo_min', params.presupuesto_maximo_min);
  if (params.presupuesto_maximo_max) search.set('presupuesto_maximo_max', params.presupuesto_maximo_max);
  if (params.presupuesto_peticion_min) search.set('presupuesto_peticion_min', params.presupuesto_peticion_min);
  if (params.presupuesto_peticion_max) search.set('presupuesto_peticion_max', params.presupuesto_peticion_max);
  if (params.habitaciones_min) search.set('habitaciones_min', params.habitaciones_min);
  if (params.habitaciones_max) search.set('habitaciones_max', params.habitaciones_max);
  if (params.banos_min) search.set('banos_min', params.banos_min);
  if (params.banos_max) search.set('banos_max', params.banos_max);
  if (params.metros_min) search.set('metros_min', params.metros_min);
  if (params.metros_max) search.set('metros_max', params.metros_max);
  if (params.barrio) search.set('barrio', params.barrio);
  if (params.distrito) search.set('distrito', params.distrito);
  return request<ClientesByTipoPageResult>(
    `/api/inmuebles/clientes/by-tipo?${search.toString()}`,
  );
}

const CLIENTES_BY_TIPO_FETCH_ALL_LIMIT = 10_000;

/** Loads every page so client-side filters can run on the full dataset. */
export async function fetchAllInmuebleClientesByTipo(
  tipo_operacion: 'alquiler' | 'venta',
  sortParams?: Pick<ClientesByTipoListParams, 'sort' | 'dir'>,
): Promise<ClientesByTipoPageResult> {
  const baseParams: ClientesByTipoListParams = {
    page: 1,
    limit: CLIENTES_BY_TIPO_FETCH_ALL_LIMIT,
    ...sortParams,
  };
  const first = await getInmuebleClientesByTipo(tipo_operacion, baseParams);
  if (first.total <= first.rows.length) {
    return first;
  }

  const rows = [...first.rows];
  const totalPages = Math.ceil(first.total / CLIENTES_BY_TIPO_FETCH_ALL_LIMIT);
  for (let page = 2; page <= totalPages; page++) {
    const next = await getInmuebleClientesByTipo(tipo_operacion, {
      ...baseParams,
      page,
    });
    rows.push(...next.rows);
  }

  return {
    rows,
    total: first.total,
    page: 1,
    limit: rows.length,
  };
}

/** @deprecated Use getInmuebleClientesByTipo with pagination params */
export function getInmuebleClientesByTipoAll(
  tipo_operacion: 'alquiler' | 'venta',
): Promise<InmuebleClienteLinkRow[]> {
  return getInmuebleClientesByTipo(tipo_operacion, {
    page: 1,
    limit: 10_000,
  }).then((result) => result.rows);
}

export function getInmueble(id: string): Promise<Inmueble> {
  return request<Inmueble>(`/api/inmuebles/${id}`);
}

export function createInmueble(data: InmuebleFormData): Promise<Inmueble> {
  return request<Inmueble>('/api/inmuebles', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
}

export function updateInmueble(
  id: string,
  data: Partial<InmuebleFormData>,
): Promise<Inmueble> {
  return request<Inmueble>(`/api/inmuebles/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
}

export function updateClienteGestionEstado(
  inmuebleId: string,
  clienteId: string,
  gestion_estado: ClienteGestionEstado,
  fecha_ultima_gestion?: string,
): Promise<{
  gestion_estado: ClienteGestionEstado;
  fecha_ultima_gestion: string;
}> {
  return request<{
    gestion_estado: ClienteGestionEstado;
    fecha_ultima_gestion: string;
  }>(
    `/api/inmuebles/${inmuebleId}/clientes/${clienteId}/gestion-estado`,
    {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        gestion_estado,
        ...(fecha_ultima_gestion ? { fecha_ultima_gestion } : {}),
      }),
    },
  );
}

export function updateClienteFechaUltimaGestion(
  inmuebleId: string,
  clienteId: string,
  fecha_ultima_gestion: string | null,
): Promise<{ fecha_ultima_gestion: string | null }> {
  return request<{ fecha_ultima_gestion: string | null }>(
    `/api/inmuebles/${inmuebleId}/clientes/${clienteId}/fecha-ultima-gestion`,
    {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fecha_ultima_gestion }),
    },
  );
}

export function deleteInmueble(id: string): Promise<{ mensaje: string }> {
  return request<{ mensaje: string }>(`/api/inmuebles/${id}`, {
    method: 'DELETE',
  });
}
