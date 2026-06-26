import { CreateInmuebleDto } from './dto/create-inmueble.dto';
import { UpdateInmuebleDto } from './dto/update-inmueble.dto';

type SplitFieldsDto = CreateInmuebleDto | UpdateInmuebleDto;

function trimOrNull(value: string | null | undefined): string | null {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

function joinLegacyCaptador(
  captador: string | null,
  alquiladoPor: string | null,
): string | null {
  if (captador && alquiladoPor) return `${captador} // ${alquiladoPor}`;
  return captador ?? alquiladoPor ?? null;
}

function pickLegacyLink(
  linkIdealista: string | null,
  linkEspejo: string | null,
  fallback: string | null | undefined,
): string | null {
  return linkIdealista ?? linkEspejo ?? trimOrNull(fallback) ?? null;
}

export function normalizeInmuebleSplitFields<T extends SplitFieldsDto>(dto: T): T {
  const captador = trimOrNull(dto.captador);
  const alquilado_por = trimOrNull(dto.alquilado_por);
  const link_idealista = trimOrNull(dto.link_idealista);
  const link_espejo = trimOrNull(dto.link_espejo);
  const fecha_visitas = trimOrNull(dto.fecha_visitas);

  return {
    ...dto,
    captador,
    alquilado_por,
    link_idealista,
    link_espejo,
    fecha_visitas,
    captador_alquilado_por:
      joinLegacyCaptador(captador, alquilado_por) ??
      trimOrNull(dto.captador_alquilado_por),
    link_idealista_espejo: pickLegacyLink(
      link_idealista,
      link_espejo,
      dto.link_idealista_espejo,
    ),
    fecha_visitas_entrada: trimOrNull(dto.fecha_visitas_entrada),
  };
}
