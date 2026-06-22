import type { ClienteGestionEstado } from '@/lib/cliente-gestion-estado';
import { Inmueble, TipoOperacion } from '@/types/inmueble';
import { Worker } from '@/types/worker';

export type ClienteEstado = 'activo' | 'inactivo' | 'pendiente';
export type ClienteOrigen = 'email' | 'call' | 'otro';
export type { ClienteGestionEstado };

export interface Cliente {
  id: string;
  nombre: string;
  email: string | null;
  telefono: string | null;
  ciudad: string | null;
  estado: ClienteEstado;
  origen: ClienteOrigen | null;
  estado_contacto: string | null;
  descripcion: string | null;
  ref_cliente: string | null;
  mensaje: string | null;
  fecha_contacto: string | null;
  fecha_ultima_gestion: string | null;
  presupuesto_maximo: string | null;
  banos: number | null;
  notas: string | null;
  tipo_operacion: TipoOperacion | null;
  created_at: string;
  updated_at: string;
  inmueble_ids?: string[];
  worker_ids?: string[];
  inmuebles_count?: number;
  workers_count?: number;
  inmuebles?: Inmueble[];
  workers?: Worker[];
  gestion_estado?: ClienteGestionEstado | null;
}

export type ClienteFormData = {
  nombre: string;
  email: string | null;
  telefono: string | null;
  ciudad: string | null;
  estado: ClienteEstado;
  origen: ClienteOrigen | null;
  estado_contacto: string | null;
  descripcion: string | null;
  ref_cliente: string | null;
  mensaje: string | null;
  fecha_contacto: string | null;
  fecha_ultima_gestion: string | null;
  presupuesto_maximo: string | null;
  banos: number | null;
  notas: string | null;
  tipo_operacion: TipoOperacion | null;
  inmueble_ids: string[];
  worker_ids: string[];
};

export const CLIENTE_ESTADO_LABELS: Record<ClienteEstado, string> = {
  activo: 'Activo',
  inactivo: 'Inactivo',
  pendiente: 'Pendiente',
};

export const CLIENTE_ORIGEN_LABELS: Record<ClienteOrigen, string> = {
  email: 'Email',
  call: 'Llamada',
  otro: 'Otro',
};

export const CLIENTE_TABLE_FIELDS: {
  key: keyof ClienteFormData | 'inmuebles_count' | 'workers_count';
  label: string;
}[] = [
  { key: 'tipo_operacion', label: 'Tipo' },
  { key: 'origen', label: 'Origen' },
  { key: 'estado_contacto', label: 'Estado contacto' },
  { key: 'descripcion', label: 'Descripción' },
  { key: 'ref_cliente', label: 'Ref. cliente' },
  { key: 'nombre', label: 'Usuario' },
  { key: 'email', label: 'Email' },
  { key: 'telefono', label: 'Teléfono' },
  { key: 'mensaje', label: 'Mensaje' },
  { key: 'fecha_contacto', label: 'Fecha' },
  { key: 'estado', label: 'Estado CRM' },
  { key: 'inmuebles_count', label: 'Inmuebles' },
  { key: 'workers_count', label: 'Trabajadores' },
];

export const emptyClienteForm = (): ClienteFormData => ({
  nombre: '',
  email: null,
  telefono: null,
  ciudad: null,
  estado: 'pendiente',
  origen: null,
  estado_contacto: null,
  descripcion: null,
  ref_cliente: null,
  mensaje: null,
  fecha_contacto: null,
  fecha_ultima_gestion: null,
  presupuesto_maximo: null,
  banos: null,
  notas: null,
  tipo_operacion: null,
  inmueble_ids: [],
  worker_ids: [],
});
