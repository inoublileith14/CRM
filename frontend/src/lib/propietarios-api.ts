import { Propietario, PropietarioFormData } from '@/types/propietario';
import { parseApiResponse } from './parse-api-error';
import { ApiError } from './api';

async function request<T>(url: string, init?: RequestInit): Promise<T> {
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

export function getPropietarios(): Promise<Propietario[]> {
  return request<Propietario[]>('/api/propietarios');
}

export function getPropietario(id: string): Promise<Propietario> {
  return request<Propietario>(`/api/propietarios/${id}`);
}

export function createPropietario(
  data: PropietarioFormData,
): Promise<Propietario> {
  return request<Propietario>('/api/propietarios', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
}

export function findOrCreatePropietario(data: {
  nombre: string;
  telf?: string | null;
  tipo_operacion?: 'alquiler' | 'venta';
}): Promise<Propietario> {
  return request<Propietario>('/api/propietarios/find-or-create', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
}

export function updatePropietario(
  id: string,
  data: Partial<PropietarioFormData>,
): Promise<Propietario> {
  return request<Propietario>(`/api/propietarios/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
}

export function deletePropietario(id: string): Promise<{ mensaje: string }> {
  return request<{ mensaje: string }>(`/api/propietarios/${id}`, {
    method: 'DELETE',
  });
}
