import { Inmueble, InmuebleFormData } from '@/types/inmueble';

function trimOrNull(value: string | null | undefined): string | null {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

function splitLegacyCaptador(value: string | null | undefined): {
  captador: string | null;
  alquilado_por: string | null;
} {
  const raw = trimOrNull(value);
  if (!raw) return { captador: null, alquilado_por: null };
  if (!raw.includes('//')) return { captador: raw, alquilado_por: null };
  const [captador, alquilado_por] = raw.split('//').map((part) => part.trim());
  return {
    captador: captador || null,
    alquilado_por: alquilado_por || null,
  };
}

export function hydrateInmuebleSplitFields(
  inmueble: Inmueble | InmuebleFormData,
): InmuebleFormData {
  const captador =
    trimOrNull(inmueble.captador) ??
    splitLegacyCaptador(inmueble.captador_alquilado_por).captador;
  const alquilado_por =
    trimOrNull(inmueble.alquilado_por) ??
    splitLegacyCaptador(inmueble.captador_alquilado_por).alquilado_por;
  const link_idealista =
    trimOrNull(inmueble.link_idealista) ??
    trimOrNull(inmueble.link_idealista_espejo);
  const link_espejo = trimOrNull(inmueble.link_espejo);
  const fecha_visitas = trimOrNull(inmueble.fecha_visitas);
  const fecha_visitas_entrada = trimOrNull(inmueble.fecha_visitas_entrada);

  return {
    ...inmueble,
    captador,
    alquilado_por,
    link_idealista,
    link_espejo,
    fecha_visitas,
    fecha_visitas_entrada,
  };
}

export function normalizeInmuebleSplitFieldsForSave(
  data: InmuebleFormData,
): InmuebleFormData {
  const captador = trimOrNull(data.captador);
  const alquilado_por = trimOrNull(data.alquilado_por);
  const link_idealista = trimOrNull(data.link_idealista);
  const link_espejo = trimOrNull(data.link_espejo);
  const fecha_visitas = trimOrNull(data.fecha_visitas);
  const fecha_visitas_entrada = trimOrNull(data.fecha_visitas_entrada);

  const captador_alquilado_por =
    captador && alquilado_por
      ? `${captador} // ${alquilado_por}`
      : captador ?? alquilado_por ?? null;

  return {
    ...data,
    captador,
    alquilado_por,
    link_idealista,
    link_espejo,
    fecha_visitas,
    captador_alquilado_por,
    link_idealista_espejo: link_idealista ?? link_espejo ?? null,
    fecha_visitas_entrada,
  };
}

export function resolveInmueblePropertyLink(
  inmueble: Pick<
    Inmueble,
    'link_idealista' | 'link_espejo' | 'link_idealista_espejo' | 'ficha_del_piso_real'
  >,
): string | null {
  return (
    trimOrNull(inmueble.link_idealista) ??
    trimOrNull(inmueble.link_espejo) ??
    trimOrNull(inmueble.link_idealista_espejo) ??
    trimOrNull(inmueble.ficha_del_piso_real)
  );
}

/** Dense alquiler table: P → Idealista link; I / I-M → espejo link. */
export function resolveInmuebleStatusListingLink(
  inmueble: Pick<
    Inmueble,
    'status' | 'link_idealista' | 'link_espejo' | 'link_idealista_espejo'
  >,
): string | null {
  const link_idealista =
    trimOrNull(inmueble.link_idealista) ??
    trimOrNull(inmueble.link_idealista_espejo);
  const link_espejo = trimOrNull(inmueble.link_espejo);

  if (inmueble.status === 'P') {
    return link_idealista;
  }
  if (inmueble.status === 'I' || inmueble.status === 'I-M') {
    return link_espejo;
  }

  return link_idealista ?? link_espejo;
}
