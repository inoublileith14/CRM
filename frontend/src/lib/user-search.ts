import { normalizeWorkerRol, Worker, WorkerRol, workerAccountStatus } from '@/types/worker';
import { matchesWorkerSearch } from '@/lib/worker-search';

export type UserListFilter = 'all' | 'inactivo' | 'sin_cuenta';

export function matchesUserFilter(
  worker: Worker,
  filter: UserListFilter,
): boolean {
  if (filter === 'all') return true;
  if (filter === 'inactivo') return !worker.activo;
  if (filter === 'sin_cuenta') return !worker.profile_id;
  return true;
}

export function filterUsersByRole(
  workers: Worker[],
  rol: WorkerRol,
): Worker[] {
  return workers.filter((worker) => normalizeWorkerRol(worker.rol) === rol);
}

export function filterUsers(
  workers: Worker[],
  query: string,
  listFilter: UserListFilter,
): Worker[] {
  return workers.filter(
    (worker) =>
      matchesWorkerSearch(worker, query) && matchesUserFilter(worker, listFilter),
  );
}

export function userAccountTone(
  worker: Pick<Worker, 'profile_id' | 'invitation_sent_at'>,
): 'linked' | 'pending' | 'none' {
  return workerAccountStatus(worker).tone;
}
