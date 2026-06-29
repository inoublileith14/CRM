import { normalizeWorkerRol, WorkerRol } from '@/types/worker';

export function getUsersListHref(rol: string): string {
  return normalizeWorkerRol(rol) === 'admin'
    ? '/dashboard/usuarios/admins'
    : '/dashboard/usuarios/asesores';
}

export function getUserStatsHref(id: string): string {
  return `/dashboard/usuarios/${id}`;
}

export function getUserClientesHref(id: string): string {
  return `/dashboard/usuarios/${id}/clientes`;
}

export function getUserEditHref(id: string): string {
  return `/dashboard/usuarios/${id}/edit`;
}

export const USER_LIST_META: Record<
  WorkerRol,
  { title: string; description: string; addLabel: string; entityLabel: string }
> = {
  admin: {
    title: 'Admins',
    description:
      'Administradores del sistema con acceso completo a la gestión.',
    addLabel: 'Añadir admin',
    entityLabel: 'admins',
  },
  asesor: {
    title: 'Asesores',
    description:
      'Asesores comerciales asignados a clientes e inmuebles.',
    addLabel: 'Añadir asesor',
    entityLabel: 'asesores',
  },
};
