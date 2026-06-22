export class UpdateWorkerDto {
  nombre?: string;
  telf?: string;
  email?: string;
  rol?: 'admin' | 'asesor';
  activo?: boolean;
  notas?: string;
}
