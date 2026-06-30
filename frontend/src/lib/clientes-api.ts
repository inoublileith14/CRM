import { Cliente, ClienteFormData, ClientePerfil, ClientePerfilInput } from '@/types/cliente';
import { TipoOperacion } from '@/types/inmueble';
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

export function getClientes(): Promise<Cliente[]> {
  return request<Cliente[]>('/api/clientes');
}

export function getCliente(id: string): Promise<Cliente> {
  return request<Cliente>(`/api/clientes/${id}`);
}

export function createCliente(data: ClienteFormData): Promise<Cliente> {
  return request<Cliente>('/api/clientes', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
}

export function bulkAssignWorker(data: {
  worker_id: string;
  assignments: { cliente_id: string; inmueble_id: string }[];
}): Promise<{ assigned: number }> {
  return request<{ assigned: number }>('/api/clientes/bulk-assign-worker', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
}

export function bulkUnassignWorker(data: {
  cliente_ids: string[];
}): Promise<{ unassigned: number }> {
  return request<{ unassigned: number }>('/api/clientes/bulk-unassign-worker', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
}

export function bulkAssignInmueble(data: {
  inmueble_id: string;
  cliente_ids: string[];
}): Promise<{ assigned: number; skipped: number }> {
  return request<{ assigned: number; skipped: number }>(
    '/api/clientes/bulk-assign-inmueble',
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    },
  );
}

export function bulkDeleteClientes(data: {
  cliente_ids: string[];
}): Promise<{ deleted: number }> {
  return request<{ deleted: number }>('/api/clientes/bulk-delete', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
}

export interface BulkImportClientesOptions {
  inmueble_id?: string;
  worker_id?: string;
  tipo_operacion?: TipoOperacion;
  skip_duplicates?: boolean;
}

export interface BulkImportClientesResult {
  created: number;
  skipped: number;
  failed: number;
}

export type ClienteImportJobStatus =
  | 'pending'
  | 'processing'
  | 'completed'
  | 'failed';

export interface ClienteImportJob {
  id: string;
  status: ClienteImportJobStatus;
  total_rows: number;
  processed_rows: number;
  created_count: number;
  skipped_count: number;
  failed_count: number;
  error_message: string | null;
  options: BulkImportClientesOptions;
  created_at: string;
  updated_at: string;
}

export function bulkImportClientes(
  clientes: ClienteFormData[],
  options?: BulkImportClientesOptions,
): Promise<BulkImportClientesResult> {
  return request<BulkImportClientesResult>('/api/clientes/bulk-import', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ clientes, options }),
  });
}

export function uploadClienteImportJob(
  file: File,
  options?: BulkImportClientesOptions,
): Promise<{ jobId: string }> {
  const formData = new FormData();
  formData.append('file', file);
  if (options?.inmueble_id) {
    formData.append('inmueble_id', options.inmueble_id);
  }
  if (options?.worker_id) {
    formData.append('worker_id', options.worker_id);
  }
  if (options?.tipo_operacion) {
    formData.append('tipo_operacion', options.tipo_operacion);
  }
  if (options?.skip_duplicates === false) {
    formData.append('skip_duplicates', 'false');
  }

  return request<{ jobId: string }>('/api/clientes/import/upload', {
    method: 'POST',
    body: formData,
  });
}

export function getClienteImportJob(jobId: string): Promise<ClienteImportJob> {
  return request<ClienteImportJob>(`/api/clientes/import/${jobId}`);
}

export function updateCliente(
  id: string,
  data: Partial<ClienteFormData>,
): Promise<Cliente> {
  return request<Cliente>(`/api/clientes/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
}

export function deleteCliente(id: string): Promise<{ mensaje: string }> {
  return request<{ mensaje: string }>(`/api/clientes/${id}`, {
    method: 'DELETE',
  });
}

export function createClientePerfil(
  clienteId: string,
  data: Partial<ClientePerfilInput>,
): Promise<ClientePerfil> {
  return request<ClientePerfil>(`/api/clientes/${clienteId}/perfiles`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
}

export function updateClientePerfil(
  clienteId: string,
  perfilId: string,
  data: Partial<ClientePerfilInput>,
): Promise<ClientePerfil> {
  return request<ClientePerfil>(
    `/api/clientes/${clienteId}/perfiles/${perfilId}`,
    {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    },
  );
}
