import { Inmueble, TipoOperacion } from '@/types/inmueble';

export interface Propietario {
  id: string;
  nombre: string;
  telf: string | null;
  email: string | null;
  notas: string | null;
  tipo_operacion: TipoOperacion | null;
  created_at: string;
  updated_at: string;
  inmuebles_count?: number;
  inmuebles?: Inmueble[];
}

export type PropietarioFormData = Pick<
  Propietario,
  'nombre' | 'telf' | 'email' | 'notas' | 'tipo_operacion'
>;

export const emptyPropietarioForm = (
  tipoOperacion: TipoOperacion | null = null,
): PropietarioFormData => ({
  nombre: '',
  telf: null,
  email: null,
  notas: null,
  tipo_operacion: tipoOperacion,
});
