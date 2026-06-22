import { Cliente } from '@/types/cliente';

export type WorkerRol = 'admin' | 'asesor';

export interface Worker {
  id: string;
  nombre: string;
  telf: string | null;
  email: string | null;
  rol: WorkerRol;
  activo: boolean;
  notas: string | null;
  profile_id: string | null;
  invitation_sent_at: string | null;
  created_at: string;
  updated_at: string;
  clientes_count?: number;
  clientes?: Cliente[];
}

export type WorkerFormData = Pick<
  Worker,
  'nombre' | 'telf' | 'email' | 'rol' | 'activo' | 'notas'
>;

export const WORKER_ROL_LABELS: Record<WorkerRol, string> = {
  admin: 'Admin',
  asesor: 'Asesor',
};

/** Compatibilidad con roles antiguos en BD sin migrar. */
export function normalizeWorkerRol(rol: string): WorkerRol {
  if (rol === 'admin' || rol === 'administracion') return 'admin';
  return 'asesor';
}

export function getWorkerRolLabel(rol: string): string {
  return WORKER_ROL_LABELS[normalizeWorkerRol(rol)];
}

export function workerAccountStatus(worker: Pick<
  Worker,
  'profile_id' | 'invitation_sent_at'
>): { label: string; tone: 'linked' | 'pending' | 'none' } {
  if (!worker.profile_id) {
    return { label: 'Sin usuario', tone: 'none' };
  }
  if (worker.invitation_sent_at) {
    return { label: 'Invitación enviada', tone: 'pending' };
  }
  return { label: 'Cuenta activa', tone: 'linked' };
}

export const emptyWorkerForm = (): WorkerFormData => ({
  nombre: '',
  telf: null,
  email: null,
  rol: 'asesor',
  activo: true,
  notas: null,
});
