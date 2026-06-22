import { Worker, WorkerFormData } from '@/types/worker';
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

export function getWorkers(activoOnly = false): Promise<Worker[]> {
  const qs = activoOnly ? '?activo=true' : '';
  return request<Worker[]>(`/api/workers${qs}`);
}

export function getWorker(id: string): Promise<Worker> {
  return request<Worker>(`/api/workers/${id}`);
}

export function getMyWorkerId(): Promise<string | null> {
  return request<{ worker_id: string | null }>('/api/workers/me').then(
    (data) => data.worker_id,
  );
}

export function createWorker(data: WorkerFormData): Promise<Worker> {
  return request<Worker>('/api/workers', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
}

export function updateWorker(
  id: string,
  data: Partial<WorkerFormData>,
): Promise<Worker> {
  return request<Worker>(`/api/workers/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
}

export function deleteWorker(id: string): Promise<{ mensaje: string }> {
  return request<{ mensaje: string }>(`/api/workers/${id}`, {
    method: 'DELETE',
  });
}

export function resendWorkerInvitation(
  id: string,
): Promise<{ mensaje: string }> {
  return request<{ mensaje: string }>(
    `/api/workers/${id}/reenviar-invitacion`,
    { method: 'POST' },
  );
}
