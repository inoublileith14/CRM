import {
  getWorkerRolLabel,
  normalizeWorkerRol,
  Worker,
  WorkerRol,
  workerAccountStatus,
} from '@/types/worker';

export type WorkerListFilter = 'all' | WorkerRol | 'inactivo' | 'sin_cuenta';

function workerSearchText(worker: Worker): string {
  const account = workerAccountStatus(worker);
  return [
    worker.nombre,
    worker.email,
    worker.telf,
    worker.notas,
    getWorkerRolLabel(worker.rol),
    worker.activo ? 'activo' : 'inactivo',
    account.label,
    String(worker.clientes_count ?? 0),
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();
}

export function matchesWorkerSearch(worker: Worker, query: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;

  const tokens = q.split(/\s+/).filter(Boolean);
  const haystack = workerSearchText(worker);
  return tokens.every((token) => haystack.includes(token));
}

export function matchesWorkerFilter(
  worker: Worker,
  filter: WorkerListFilter,
): boolean {
  if (filter === 'all') return true;
  if (filter === 'inactivo') return !worker.activo;
  if (filter === 'sin_cuenta') return !worker.profile_id;
  return normalizeWorkerRol(worker.rol) === filter;
}

export function filterWorkers(
  workers: Worker[],
  query: string,
  listFilter: WorkerListFilter,
): Worker[] {
  return workers.filter(
    (worker) =>
      matchesWorkerSearch(worker, query) &&
      matchesWorkerFilter(worker, listFilter),
  );
}
