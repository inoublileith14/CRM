import { Inmueble } from '@/types/inmueble';
import { formatInmuebleCell } from '@/lib/inmueble-table-utils';

export function getInmuebleAssignLabel(
  inmueble: Pick<Inmueble, 'ref' | 'direccion_piso_real'>,
): string {
  return inmueble.ref?.trim() || 'NR';
}

export function getAssignableInmuebles(inmuebles: Inmueble[]): Inmueble[] {
  return inmuebles.filter((inmueble) => Boolean(inmueble.ref?.trim()));
}

export function getInmuebleAssignSublabel(
  inmueble: Pick<Inmueble, 'precio'>,
): string | undefined {
  if (inmueble.precio == null) return undefined;
  return formatInmuebleCell('precio', inmueble.precio);
}

export function filterInmueblesForAssignSearch(
  inmuebles: Inmueble[],
  query: string,
): Inmueble[] {
  const withRef = getAssignableInmuebles(inmuebles);
  const q = query.trim().toLowerCase();
  if (!q) return withRef;

  return withRef.filter((inmueble) => {
    const ref = inmueble.ref?.toLowerCase() ?? '';
    const price = inmueble.precio != null ? String(inmueble.precio) : '';
    const priceFormatted =
      inmueble.precio != null
        ? formatInmuebleCell('precio', inmueble.precio).toLowerCase()
        : '';

    return ref.includes(q) || price.includes(q) || priceFormatted.includes(q);
  });
}
