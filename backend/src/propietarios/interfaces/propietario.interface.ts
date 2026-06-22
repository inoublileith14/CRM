import { Inmueble } from '../../inmuebles/interfaces/inmueble.interface';

export interface Propietario {
  id: string;
  nombre: string;
  telf: string | null;
  email: string | null;
  notas: string | null;
  tipo_operacion: 'alquiler' | 'venta' | null;
  created_at: string;
  updated_at: string;
  inmuebles_count?: number;
  inmuebles?: Inmueble[];
}

export type PropietarioInput = Omit<
  Propietario,
  'id' | 'created_at' | 'updated_at' | 'inmuebles_count' | 'inmuebles'
>;
