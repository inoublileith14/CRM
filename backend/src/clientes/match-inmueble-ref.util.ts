import {
  normalizeRefForMatch,
  refsMatchForInmueble,
} from './parse-ref-cliente.util';

export interface InmuebleRefCandidate {
  id: string;
  ref: string | null;
  tipo_operacion: string | null;
}

export function findInmuebleIdByClienteRef(
  refCliente: string | null | undefined,
  inmuebles: InmuebleRefCandidate[],
  tipoOperacion: 'alquiler' | 'venta',
): string | null {
  if (!refCliente?.trim()) return null;

  const candidates = inmuebles.filter(
    (inmueble) =>
      inmueble.tipo_operacion === tipoOperacion && inmueble.ref?.trim(),
  );

  if (candidates.length === 0) return null;

  const normalizedCliente = normalizeRefForMatch(refCliente);

  for (const inmueble of candidates) {
    if (normalizeRefForMatch(inmueble.ref) === normalizedCliente) {
      return inmueble.id;
    }
  }

  const byRefLength = [...candidates].sort(
    (a, b) =>
      normalizeRefForMatch(b.ref).length -
      normalizeRefForMatch(a.ref).length,
  );

  for (const inmueble of byRefLength) {
    if (refsMatchForInmueble(refCliente, inmueble.ref)) {
      return inmueble.id;
    }
  }

  return null;
}
