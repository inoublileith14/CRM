import { TipoOperacion } from '@/types/inmueble';

export function getPropietariosListPath(tipo: TipoOperacion | null | undefined) {
  return tipo === 'venta'
    ? '/dashboard/propietarios-venta'
    : '/dashboard/propietarios-alquiler';
}
