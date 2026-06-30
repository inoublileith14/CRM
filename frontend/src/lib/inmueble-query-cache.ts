import { QueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/lib/query-keys';
import { Inmueble } from '@/types/inmueble';

function compareInmuebleListOrder(a: Inmueble, b: Inmueble): number {
  return (
    new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );
}

function toNumberOrNull(value: unknown): number | null {
  if (value == null || value === '') return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function toStringOrNull(value: unknown): string | null {
  if (value == null) return null;
  const text = String(value).trim();
  return text ? text : null;
}

export function mapRealtimeRowToInmueble(
  row: Record<string, unknown>,
): Inmueble | null {
  const id = toStringOrNull(row.id);
  if (!id) return null;

  const tipoOperacion = row.tipo_operacion;
  const tipo_operacion =
    tipoOperacion === 'alquiler' || tipoOperacion === 'venta'
      ? tipoOperacion
      : null;

  const contactos = row.propietarios_contactos;
  const propietarios_contactos = Array.isArray(contactos)
    ? contactos
        .filter((item): item is Record<string, unknown> => Boolean(item))
        .map((item) => ({
          nombre: String(item.nombre ?? ''),
          telf: toStringOrNull(item.telf),
        }))
    : [];

  return {
    id,
    ref: toStringOrNull(row.ref),
    fecha_entrada_inmueble: toStringOrNull(row.fecha_entrada_inmueble),
    imagen_real: toStringOrNull(row.imagen_real),
    direccion_piso_real: toStringOrNull(row.direccion_piso_real),
    foto_espejo: toStringOrNull(row.foto_espejo),
    espejo_direccion: toStringOrNull(row.espejo_direccion),
    barrio_distrito: toStringOrNull(row.barrio_distrito),
    distrito_ciudad: toStringOrNull(row.distrito_ciudad),
    precio: toNumberOrNull(row.precio),
    precio_espejo: toNumberOrNull(row.precio_espejo),
    hab: toNumberOrNull(row.hab),
    banos: toNumberOrNull(row.banos),
    metros: toNumberOrNull(row.metros),
    larga_estancia_temporada:
      row.larga_estancia_temporada === 'larga' ||
      row.larga_estancia_temporada === 't'
        ? row.larga_estancia_temporada
        : null,
    propietario_id: toStringOrNull(row.propietario_id),
    propietarios_contactos,
    nombre_propi: toStringOrNull(row.nombre_propi),
    telf: toStringOrNull(row.telf),
    ficha_del_piso_real: toStringOrNull(row.ficha_del_piso_real),
    link_idealista: toStringOrNull(row.link_idealista),
    link_espejo: toStringOrNull(row.link_espejo),
    link_idealista_espejo: toStringOrNull(row.link_idealista_espejo),
    fecha_visitas: toStringOrNull(row.fecha_visitas),
    fecha_visitas_entrada: toStringOrNull(row.fecha_visitas_entrada),
    observaciones: toStringOrNull(row.observaciones),
    requisitos_propietario: toStringOrNull(row.requisitos_propietario),
    amueblado:
      row.amueblado === 'si' || row.amueblado === 'no' ? row.amueblado : null,
    captador: toStringOrNull(row.captador),
    alquilado_por: toStringOrNull(row.alquilado_por),
    captador_alquilado_por: toStringOrNull(row.captador_alquilado_por),
    status:
      row.status === 'I' || row.status === 'P' || row.status === 'I-M'
        ? row.status
        : null,
    activo: row.activo !== false,
    row_color: toStringOrNull(row.row_color),
    tipo_operacion,
    created_at: String(row.created_at ?? new Date().toISOString()),
    updated_at: String(row.updated_at ?? new Date().toISOString()),
  };
}

function patchList(
  queryClient: QueryClient,
  tipoOperacion: 'alquiler' | 'venta',
  updater: (rows: Inmueble[]) => Inmueble[],
): void {
  queryClient.setQueryData<Inmueble[]>(
    queryKeys.inmuebles.all({ tipo_operacion: tipoOperacion }),
    (prev) => updater(prev ?? []),
  );
}

function patchDetail(queryClient: QueryClient, inmueble: Inmueble): void {
  queryClient.setQueryData<Inmueble>(
    queryKeys.inmuebles.detail(inmueble.id),
    (prev) => (prev ? { ...prev, ...inmueble } : inmueble),
  );
}

export function applyInmuebleInsertToCache(
  queryClient: QueryClient,
  inmueble: Inmueble,
): void {
  const tipo = inmueble.tipo_operacion;
  if (!tipo) return;

  patchList(queryClient, tipo, (rows) => {
    if (rows.some((row) => row.id === inmueble.id)) return rows;
    return [...rows, inmueble].sort(compareInmuebleListOrder);
  });
  patchDetail(queryClient, inmueble);
}

export function applyInmuebleUpdateToCache(
  queryClient: QueryClient,
  inmueble: Inmueble,
  previousTipoOperacion?: 'alquiler' | 'venta' | null,
): void {
  const nextTipo = inmueble.tipo_operacion;
  const tiposToClear = new Set<'alquiler' | 'venta'>();
  if (previousTipoOperacion) tiposToClear.add(previousTipoOperacion);
  if (nextTipo) tiposToClear.add(nextTipo);

  for (const tipo of tiposToClear) {
    patchList(queryClient, tipo, (rows) => {
      const without = rows.filter((row) => row.id !== inmueble.id);
      if (nextTipo === tipo) {
        return [...without, inmueble].sort(compareInmuebleListOrder);
      }
      return without;
    });
  }

  patchDetail(queryClient, inmueble);
}

export function applyInmuebleDeleteFromCache(
  queryClient: QueryClient,
  inmuebleId: string,
  tipoOperacion?: 'alquiler' | 'venta' | null,
): void {
  const tipos: Array<'alquiler' | 'venta'> = tipoOperacion
    ? [tipoOperacion]
    : ['alquiler', 'venta'];

  for (const tipo of tipos) {
    patchList(queryClient, tipo, (rows) =>
      rows.filter((row) => row.id !== inmuebleId),
    );
  }

  queryClient.removeQueries({
    queryKey: queryKeys.inmuebles.detail(inmuebleId),
  });
}
