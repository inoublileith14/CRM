import type { ClienteGestionEstado } from '@/lib/cliente-gestion-estado';
import type { ClienteTipoCliente } from '@/lib/cliente-tipo';
import { Inmueble, TipoOperacion } from '@/types/inmueble';
import { Worker } from '@/types/worker';

export interface ClientePerfil {
  id: string;
  cliente_id: string;
  orden: number;
  nombre: string | null;
  telefono: string | null;
  tipo_nomina: string | null;
  tipo_ingreso: string | null;
  ingreso_monto: number | null;
  pais: string | null;
  notas: string | null;
  created_at: string;
  updated_at: string;
}

export type ClientePerfilInput = Omit<
  ClientePerfil,
  'id' | 'cliente_id' | 'created_at' | 'updated_at'
>;

export type ClienteEstado = 'activo' | 'inactivo' | 'pendiente';
export type ClienteOrigen = 'email' | 'call' | 'otro';
export type { ClienteGestionEstado, ClienteTipoCliente };

export interface Cliente {
  id: string;
  nombre: string;
  email: string | null;
  telefono: string | null;
  telefonos_extra?: string[];
  ciudad: string | null;
  barrio: string[];
  distrito: string[];
  tipo_nomina: string | null;
  tipo_cliente: ClienteTipoCliente | null;
  estado: ClienteEstado;
  origen: ClienteOrigen | null;
  estado_contacto: string | null;
  descripcion: string | null;
  ref_cliente: string | null;
  mensaje: string | null;
  fecha_contacto: string | null;
  fecha_entrada_inmueble: string | null;
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
  inmueble_gestion_links?: Array<{
    inmueble_id: string;
    gestion_estado: ClienteGestionEstado | null;
    fecha_ultima_gestion?: string | null;
  }>;
  perfiles?: ClientePerfil[];
}

export type ClienteFormData = {
  nombre: string;
  email: string | null;
  telefono: string | null;
  telefonos_extra?: string[];
  ciudad: string | null;
  barrio: string[];
  distrito: string[];
  tipo_nomina: string | null;
  tipo_cliente: ClienteTipoCliente | null;
  estado: ClienteEstado;
  origen: ClienteOrigen | null;
  estado_contacto: string | null;
  descripcion: string | null;
  ref_cliente: string | null;
  mensaje: string | null;
  fecha_contacto: string | null;
  fecha_entrada_inmueble: string | null;
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
  { key: 'tipo_operacion', label: 'TIPO' },
  { key: 'origen', label: 'ORIGEN' },
  { key: 'estado_contacto', label: 'ESTADO CONTACTO' },
  { key: 'descripcion', label: 'DESCRIPCIÓN' },
  { key: 'ref_cliente', label: 'REF. CLIENTE' },
  { key: 'nombre', label: 'USUARIO' },
  { key: 'email', label: 'EMAIL' },
  { key: 'telefono', label: 'TELÉFONO' },
  { key: 'mensaje', label: 'MENSAJE' },
  { key: 'fecha_contacto', label: 'FECHA' },
  { key: 'estado', label: 'ESTADO CRM' },
  { key: 'inmuebles_count', label: 'INMUEBLES' },
  { key: 'workers_count', label: 'TRABAJADORES' },
];

export const emptyClienteForm = (): ClienteFormData => ({
  nombre: '',
  email: null,
  telefono: null,
  telefonos_extra: [],
  ciudad: null,
  barrio: [],
  distrito: [],
  tipo_nomina: null,
  tipo_cliente: null,
  estado: 'pendiente',
  origen: null,
  estado_contacto: null,
  descripcion: null,
  ref_cliente: null,
  mensaje: null,
  fecha_contacto: null,
  fecha_entrada_inmueble: null,
  fecha_ultima_gestion: null,
  presupuesto_maximo: null,
  banos: null,
  notas: null,
  tipo_operacion: null,
  inmueble_ids: [],
  worker_ids: [],
});
