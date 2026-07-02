import { Inmueble } from '@/types/inmueble';
import { formatInmuebleCell } from '@/lib/inmueble-table-utils';

export function getInmuebleAssignLabel(
  inmueble: Pick<
    Inmueble,
    | 'ref'
    | 'precio'
    | 'hab'
    | 'banos'
    | 'direccion_piso_real'
    | 'barrio_distrito'
  >,
): string {
  const ref = inmueble.ref?.trim();
  const parts: string[] = [];

  if (inmueble.precio != null) {
    parts.push(formatInmuebleCell('precio', inmueble.precio));
  }
  if (inmueble.hab != null) parts.push(`${inmueble.hab}h`);
  if (inmueble.banos != null) parts.push(`${inmueble.banos}b`);

  const location =
    inmueble.direccion_piso_real?.trim() ||
    inmueble.barrio_distrito?.trim();
  if (location) parts.push(location);

  if (parts.length > 0) return parts.join(' ');
  return ref || 'NR';
}

export function getAssignableInmuebles(inmuebles: Inmueble[]): Inmueble[] {
  return inmuebles.filter((inmueble) => Boolean(inmueble.ref?.trim()));
}

export function getInmuebleAssignSublabel(
  inmueble: Pick<Inmueble, 'ref'>,
): string | undefined {
  const ref = inmueble.ref?.trim();
  return ref || undefined;
}

export function getInmuebleAssignTriggerLabel(
  inmueble: Pick<Inmueble, 'ref' | 'precio' | 'hab' | 'banos' | 'direccion_piso_real' | 'barrio_distrito'>,
): string {
  return inmueble.ref?.trim() || getInmuebleAssignLabel(inmueble);
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
    const location = [
      inmueble.direccion_piso_real,
      inmueble.barrio_distrito,
      inmueble.distrito_ciudad,
    ]
      .filter(Boolean)
      .join(' ')
      .toLowerCase();
    const rooms = [
      inmueble.hab != null ? `${inmueble.hab}h` : '',
      inmueble.banos != null ? `${inmueble.banos}b` : '',
    ]
      .filter(Boolean)
      .join(' ');

    return (
      ref.includes(q) ||
      price.includes(q) ||
      priceFormatted.includes(q) ||
      location.includes(q) ||
      rooms.includes(q) ||
      getInmuebleAssignLabel(inmueble).toLowerCase().includes(q)
    );
  });
}
