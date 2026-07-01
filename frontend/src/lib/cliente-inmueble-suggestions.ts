import { formatClienteZonasLabel } from '@/lib/cliente-zonas';
import { parseBudgetAmount } from '@/lib/cliente-venta-range-filters';
import type { ClienteTipoCliente } from '@/lib/cliente-tipo';
import {
  parseRefCliente,
  refsMatchForInmueble,
} from '@/lib/parse-ref-cliente';
import { Cliente } from '@/types/cliente';
import { Inmueble, TipoOperacion } from '@/types/inmueble';

/** Number of inmuebles shown in the cliente area. */
export const CLIENTE_SUGGESTION_TOP_N = 4;

const BUDGET_HARD_REJECT_RATIO = 1.18;
const MIN_SCORE_RICH_PROFILE = 38;
const MIN_SCORE_SPARSE_PROFILE = 22;
const RELATIVE_TO_TOP_RICH = 0.58;
const RELATIVE_TO_TOP_SPARSE = 0.4;
const DIVERSITY_SCORE_RATIO = 0.88;

const LOCATION_STOP_WORDS = new Set([
  'de',
  'la',
  'el',
  'los',
  'las',
  'del',
  'y',
  'en',
  'con',
  'por',
  'para',
  'madrid',
  'espana',
  'esp',
  'espanol',
]);

export interface ClienteSearchProfile {
  tipoOperacion: TipoOperacion | null;
  tipoCliente: ClienteTipoCliente | null;
  presupuestoMax: number | null;
  presupuestoPeticion: number | null;
  habitacionesMin: number | null;
  banosMin: number | null;
  metrosMin: number | null;
  barrio: string | null;
  distrito: string | null;
  ciudad: string | null;
  refCliente: string | null;
  locationTokens: string[];
  criteriaCount: number;
  linkedInmuebleIds: Set<string>;
}

export interface InmuebleSuggestion {
  inmueble: Inmueble;
  score: number;
  matchReasons: string[];
}

function normalizeText(value: string | null | undefined): string {
  if (!value?.trim()) return '';
  return value
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{M}/gu, '');
}

function extractLocationTokens(
  ...sources: Array<string | null | undefined>
): string[] {
  const tokens = new Set<string>();

  for (const source of sources) {
    const normalized = normalizeText(source);
    if (!normalized) continue;

    for (const part of normalized.split(/[\s,/\-().]+/)) {
      if (part.length >= 3 && !LOCATION_STOP_WORDS.has(part)) {
        tokens.add(part);
      }
    }
  }

  return [...tokens];
}

function locationContainsToken(
  haystack: string | null | undefined,
  token: string,
): boolean {
  const normalized = normalizeText(haystack);
  if (!normalized) return false;
  return normalized.includes(token);
}

function scoreLocationMatch(
  profileTokens: string[],
  inmueble: Inmueble,
): { score: number; reasons: string[] } {
  if (profileTokens.length === 0) {
    return { score: 0, reasons: [] };
  }

  const fields = [
    inmueble.barrio_distrito,
    inmueble.distrito_ciudad,
    inmueble.direccion_piso_real,
    inmueble.espejo_direccion,
  ];

  let matched = 0;
  for (const token of profileTokens) {
    if (fields.some((field) => locationContainsToken(field, token))) {
      matched += 1;
    }
  }

  const ratio = matched / profileTokens.length;
  const reasons: string[] = [];

  if (ratio >= 0.75) {
    reasons.push('Zona muy compatible');
  } else if (ratio >= 0.4) {
    reasons.push('Zona compatible');
  } else if (matched > 0) {
    reasons.push('Zona parcialmente compatible');
  }

  return {
    score: Math.round(ratio * 22),
    reasons,
  };
}

function scoreBudgetFit(
  price: number,
  budget: number,
): { score: number; reason: string | null; reject: boolean } {
  const ratio = price / budget;

  if (ratio > BUDGET_HARD_REJECT_RATIO) {
    return { score: 0, reason: null, reject: true };
  }

  if (ratio <= 1) {
    const closeness =
      ratio >= 0.82 ? 1 : 0.65 + (0.35 * ratio) / 0.82;
    return {
      score: Math.round(26 * closeness),
      reason: 'Dentro del presupuesto',
      reject: false,
    };
  }

  if (ratio <= 1.08) {
    return {
      score: 14,
      reason: 'Cerca del presupuesto',
      reject: false,
    };
  }

  if (ratio <= 1.15) {
    return {
      score: 6,
      reason: 'Ligeramente por encima del presupuesto',
      reject: false,
    };
  }

  return {
    score: 2,
    reason: 'Por encima del presupuesto',
    reject: false,
  };
}

function scoreSpecs(
  inmueble: Inmueble,
  profile: ClienteSearchProfile,
): { score: number; reasons: string[] } {
  let score = 0;
  const reasons: string[] = [];

  if (profile.habitacionesMin != null && inmueble.hab != null) {
    const diff = inmueble.hab - profile.habitacionesMin;
    if (diff >= 0) {
      score += diff === 0 ? 10 : 8;
      reasons.push('Habitaciones suficientes');
    } else if (diff === -1) {
      score += 3;
    }
  }

  if (profile.banosMin != null && inmueble.banos != null) {
    if (inmueble.banos >= profile.banosMin) {
      score += 5;
      reasons.push('Baños suficientes');
    }
  }

  if (profile.metrosMin != null && inmueble.metros != null) {
    const diff = Math.abs(inmueble.metros - profile.metrosMin);
    const tolerance = Math.max(profile.metrosMin * 0.25, 8);
    if (diff <= tolerance) {
      score += 6;
      reasons.push('Metros similares');
    } else if (inmueble.metros >= profile.metrosMin) {
      score += 2;
    }
  }

  return { score: Math.min(score, 21), reasons };
}

function scoreClienteTypeFit(
  inmueble: Inmueble,
  tipoCliente: ClienteTipoCliente | null,
  budget: number | null,
): { score: number; reasons: string[] } {
  if (!tipoCliente) {
    return { score: 0, reasons: [] };
  }

  const hab = inmueble.hab;
  const price = inmueble.precio;
  let score = 0;
  const reasons: string[] = [];

  switch (tipoCliente) {
    case 'estudiante':
      if (hab != null && hab <= 2) {
        score += 3;
        reasons.push('Adecuado para estudiante');
      }
      if (inmueble.larga_estancia_temporada === 't') {
        score += 1;
      }
      if (price != null && budget != null && price <= budget * 0.9) {
        score += 1;
      }
      break;
    case 'parejas':
      if (hab != null && hab >= 1 && hab <= 2) {
        score += 3;
        reasons.push('Adecuado para parejas');
      }
      break;
    case 'familia_con_hijos':
      if (hab != null && hab >= 3) {
        score += 3;
        reasons.push('Adecuado para familia');
      }
      if (inmueble.larga_estancia_temporada === 'larga') {
        score += 1;
      }
      break;
    case 'compartir':
      if (hab != null && hab <= 2) {
        score += 2;
        reasons.push('Adecuado para compartir');
      }
      if (price != null && budget != null && price <= budget * 0.85) {
        score += 2;
      }
      break;
    default:
      break;
  }

  return { score: Math.min(score, 5), reasons };
}

function scoreListingQuality(inmueble: Inmueble): {
  score: number;
  reasons: string[];
} {
  let score = 0;
  const reasons: string[] = [];

  if (inmueble.status === 'P') {
    score += 2;
    reasons.push('Publicado');
  }

  if (inmueble.imagen_real?.trim() || inmueble.foto_espejo?.trim()) {
    score += 2;
  }

  if (inmueble.precio != null && inmueble.ref?.trim()) {
    score += 1;
  }

  return { score: Math.min(score, 5), reasons };
}

function isAvailableForSuggestion(inmueble: Inmueble): boolean {
  if (!inmueble.ref?.trim()) return false;
  if (inmueble.alquilado_por?.trim()) return false;
  return true;
}

function countProfileCriteria(profile: ClienteSearchProfile): number {
  let count = 0;
  if (profile.presupuestoMax != null || profile.presupuestoPeticion != null) {
    count += 1;
  }
  if (profile.habitacionesMin != null) count += 1;
  if (profile.banosMin != null) count += 1;
  if (profile.metrosMin != null) count += 1;
  if (profile.locationTokens.length > 0) count += 1;
  if (profile.tipoCliente) count += 1;
  return count;
}

function compareSuggestions(a: InmuebleSuggestion, b: InmuebleSuggestion): number {
  if (b.score !== a.score) return b.score - a.score;

  const priceA = a.inmueble.precio ?? Number.MAX_SAFE_INTEGER;
  const priceB = b.inmueble.precio ?? Number.MAX_SAFE_INTEGER;
  if (priceA !== priceB) return priceA - priceB;

  const imageA = a.inmueble.imagen_real?.trim() ? 1 : 0;
  const imageB = b.inmueble.imagen_real?.trim() ? 1 : 0;
  if (imageB !== imageA) return imageB - imageA;

  const refA = a.inmueble.ref ?? '';
  const refB = b.inmueble.ref ?? '';
  return refA.localeCompare(refB);
}

function pickTopWithDiversity(
  ranked: InmuebleSuggestion[],
  limit: number,
): InmuebleSuggestion[] {
  if (ranked.length <= limit) return ranked;

  const picked: InmuebleSuggestion[] = [];
  const usedLocations = new Set<string>();
  const topScore = ranked[0]?.score ?? 0;

  for (const candidate of ranked) {
    if (picked.length >= limit) break;

    const locationKey = normalizeText(
      candidate.inmueble.barrio_distrito ??
        candidate.inmueble.distrito_ciudad ??
        candidate.inmueble.direccion_piso_real,
    );

    const isDuplicateLocation =
      locationKey.length > 0 && usedLocations.has(locationKey);
    const hasBetterAlternative =
      isDuplicateLocation &&
      candidate.score < topScore * DIVERSITY_SCORE_RATIO &&
      ranked.some(
        (other) =>
          !picked.includes(other) &&
          !usedLocations.has(
            normalizeText(
              other.inmueble.barrio_distrito ??
                other.inmueble.distrito_ciudad ??
                other.inmueble.direccion_piso_real,
            ),
          ),
      );

    if (hasBetterAlternative) continue;

    picked.push(candidate);
    if (locationKey) usedLocations.add(locationKey);
  }

  if (picked.length < limit) {
    for (const candidate of ranked) {
      if (picked.length >= limit) break;
      if (!picked.includes(candidate)) {
        picked.push(candidate);
      }
    }
  }

  return picked;
}

/**
 * Builds a normalized search profile from any cliente record so suggestions
 * work consistently for every user.
 */
export class ClienteInmuebleSuggestionService {
  static buildProfile(cliente: Cliente): ClienteSearchProfile {
    const parsedRef = parseRefCliente(cliente.ref_cliente);
    const presupuestoMax =
      parseBudgetAmount(cliente.presupuesto_maximo) ??
      parseBudgetAmount(parsedRef.presupuesto);
    const presupuestoPeticion = parseBudgetAmount(parsedRef.presupuesto);
    const barrioLabel =
      formatClienteZonasLabel(cliente.barrio, '') || parsedRef.zona || null;
    const distritoLabel = formatClienteZonasLabel(cliente.distrito, '') || null;
    const locationTokens = extractLocationTokens(
      barrioLabel,
      distritoLabel,
      ...cliente.barrio,
      ...cliente.distrito,
      cliente.ciudad,
      parsedRef.zona,
      cliente.descripcion,
      cliente.notas,
    );

    const profile: ClienteSearchProfile = {
      tipoOperacion: cliente.tipo_operacion,
      tipoCliente: cliente.tipo_cliente,
      presupuestoMax,
      presupuestoPeticion,
      habitacionesMin: parsedRef.habitaciones,
      banosMin: cliente.banos ?? parsedRef.banos,
      metrosMin: parsedRef.metros,
      barrio: barrioLabel,
      distrito: distritoLabel,
      ciudad: cliente.ciudad,
      refCliente: cliente.ref_cliente,
      locationTokens,
      criteriaCount: 0,
      linkedInmuebleIds: new Set(cliente.inmueble_ids ?? []),
    };

    profile.criteriaCount = countProfileCriteria(profile);
    return profile;
  }

  static scoreInmueble(
    inmueble: Inmueble,
    profile: ClienteSearchProfile,
  ): InmuebleSuggestion | null {
    if (profile.linkedInmuebleIds.has(inmueble.id)) {
      return null;
    }

    if (
      profile.tipoOperacion &&
      inmueble.tipo_operacion &&
      profile.tipoOperacion !== inmueble.tipo_operacion
    ) {
      return null;
    }

    if (!isAvailableForSuggestion(inmueble)) {
      return null;
    }

    const reasons: string[] = [];
    let score = 8;

    if (refsMatchForInmueble(profile.refCliente, inmueble.ref)) {
      score += 28;
      reasons.push('Referencia compatible');
    }

    const budget =
      profile.presupuestoMax ?? profile.presupuestoPeticion ?? null;
    if (budget != null && inmueble.precio != null) {
      const budgetFit = scoreBudgetFit(inmueble.precio, budget);
      if (budgetFit.reject) return null;
      score += budgetFit.score;
      if (budgetFit.reason) reasons.push(budgetFit.reason);
    } else if (budget != null && inmueble.precio == null) {
      score -= 6;
    }

    const specs = scoreSpecs(inmueble, profile);
    score += specs.score;
    reasons.push(...specs.reasons);

    const location = scoreLocationMatch(profile.locationTokens, inmueble);
    score += location.score;
    reasons.push(...location.reasons);

    const clienteType = scoreClienteTypeFit(
      inmueble,
      profile.tipoCliente,
      budget,
    );
    score += clienteType.score;
    reasons.push(...clienteType.reasons);

    const quality = scoreListingQuality(inmueble);
    score += quality.score;
    reasons.push(...quality.reasons);

    const isRichProfile = profile.criteriaCount >= 2;
    const minScore = isRichProfile
      ? MIN_SCORE_RICH_PROFILE
      : MIN_SCORE_SPARSE_PROFILE;

    if (score < minScore) return null;

    const uniqueReasons = [...new Set(reasons)];

    return {
      inmueble,
      score,
      matchReasons:
        uniqueReasons.length > 0
          ? uniqueReasons
          : ['Disponible para este tipo de operación'],
    };
  }

  static suggestForCliente(
    cliente: Cliente,
    inmuebles: Inmueble[],
    options?: {
      tipoOperacion?: TipoOperacion | null;
      limit?: number;
    },
  ): InmuebleSuggestion[] {
    const profile = this.buildProfile(cliente);
    const tipo =
      options?.tipoOperacion ?? profile.tipoOperacion ?? null;
    const effectiveProfile: ClienteSearchProfile = {
      ...profile,
      tipoOperacion: tipo,
    };

    const scored = inmuebles
      .map((inmueble) => this.scoreInmueble(inmueble, effectiveProfile))
      .filter((item): item is InmuebleSuggestion => item != null)
      .sort(compareSuggestions);

    if (scored.length === 0) return [];

    const isRichProfile = effectiveProfile.criteriaCount >= 2;
    const topScore = scored[0].score;
    const relativeFloor = isRichProfile
      ? RELATIVE_TO_TOP_RICH
      : RELATIVE_TO_TOP_SPARSE;
    const minRelativeScore = topScore * relativeFloor;

    const qualified = scored.filter((item) => item.score >= minRelativeScore);
    const pool = qualified.length > 0 ? qualified : scored;

    const limit = options?.limit ?? CLIENTE_SUGGESTION_TOP_N;
    return pickTopWithDiversity(pool, limit);
  }
}
