import { InmuebleFormData } from '@/types/inmueble';
import { normalizeInmuebleAmueblado } from '@/lib/inmueble-amueblado';

export const HEADER_ALIASES: Record<string, keyof InmuebleFormData> = {
  ref: 'ref',
  referencia: 'ref',
  'idealista ref': 'ref',
  'ref idealista': 'ref',
  'ref.': 'ref',
  'ref inmueble': 'ref',
  bcn: 'status',
  status: 'status',
  estado: 'status',
  'fecha entrada inmueble': 'fecha_entrada_inmueble',
  'fecha entrada venta': 'fecha_entrada_inmueble',
  fecha_entrada_inmueble: 'fecha_entrada_inmueble',
  'imagen real': 'imagen_real',
  imagen_real: 'imagen_real',
  'direccion piso real': 'direccion_piso_real',
  'dirección piso real': 'direccion_piso_real',
  'direccion real': 'direccion_piso_real',
  direccion_piso_real: 'direccion_piso_real',
  'foto espejo': 'foto_espejo',
  'foto piso espejo': 'foto_espejo',
  foto_espejo: 'foto_espejo',
  'espejo direccion': 'espejo_direccion',
  'espejo dirección': 'espejo_direccion',
  espejo_direccion: 'espejo_direccion',
  'barrio / distrito': 'barrio_distrito',
  'barrio distrito': 'barrio_distrito',
  barrio_distrito: 'barrio_distrito',
  'distrito / ciudad': 'distrito_ciudad',
  'distrito ciudad': 'distrito_ciudad',
  distrito_ciudad: 'distrito_ciudad',
  precio: 'precio',
  'precio espejo': 'precio_espejo',
  precio_espejo: 'precio_espejo',
  hab: 'hab',
  habitaciones: 'hab',
  banos: 'banos',
  baños: 'banos',
  metros: 'metros',
  'larga estancia (larga) // temporada (t)': 'larga_estancia_temporada',
  'larga estancia//temporada': 'larga_estancia_temporada',
  'larga estancia // temporada': 'larga_estancia_temporada',
  'larga estancia': 'larga_estancia_temporada',
  larga_estancia_temporada: 'larga_estancia_temporada',
  'fecha entrada alquiler': 'fecha_entrada_inmueble',
  'fecha de visitas': 'fecha_visitas',
  'fecha entrada al piso': 'fecha_visitas_entrada',
  'fecha de entrada al piso': 'fecha_visitas_entrada',
  'fecha entrada al crm': 'fecha_entrada_inmueble',
  'video link': 'fecha_visitas_entrada',
  'video coconut': 'fecha_visitas_entrada',
  'nombre propi': 'nombre_propi',
  'nombre propietario': 'nombre_propi',
  nombre_propi: 'nombre_propi',
  telf: 'telf',
  telefono: 'telf',
  teléfono: 'telf',
  telfefono: 'telf',
  'ficha del piso real': 'ficha_del_piso_real',
  'ficha piso real': 'ficha_del_piso_real',
  ficha_del_piso_real: 'ficha_del_piso_real',
  'link idealista o link espejo': 'link_idealista_espejo',
  'link idealista': 'link_idealista',
  link_idealista: 'link_idealista',
  'link espejo': 'link_espejo',
  link_espejo: 'link_espejo',
  link_idealista_espejo: 'link_idealista_espejo',
  'fecha de visitas // fecha de entrada': 'fecha_visitas_entrada',
  fecha_visitas_entrada: 'fecha_visitas_entrada',
  'video coconut // link otra agencia': 'fecha_visitas_entrada',
  observaciones: 'observaciones',
  requisitos_propietario: 'requisitos_propietario',
  'amueblado (si o no)': 'amueblado',
  amueblado: 'amueblado',
  'captador // alquilado por': 'captador_alquilado_por',
  'captador // vendido por': 'captador_alquilado_por',
  captador: 'captador',
  'alquilado por': 'alquilado_por',
  alquilado_por: 'alquilado_por',
  captador_alquilado_por: 'captador_alquilado_por',
  'alquiler o venta': 'tipo_operacion',
  'tipo operacion': 'tipo_operacion',
  tipo_operacion: 'tipo_operacion',
  operacion: 'tipo_operacion',
  rent: 'tipo_operacion',
  sell: 'tipo_operacion',
  alquiler: 'tipo_operacion',
  venta: 'tipo_operacion',
};

export const IMAGE_FIELDS = new Set<keyof InmuebleFormData>([
  'imagen_real',
  'foto_espejo',
]);

export function normalizeHeader(header: string): string {
  return header
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[-–—]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function emptyInmuebleRow(): InmuebleFormData {
  return {
    ref: null,
    fecha_entrada_inmueble: null,
    imagen_real: null,
    direccion_piso_real: null,
    foto_espejo: null,
    espejo_direccion: null,
    barrio_distrito: null,
    distrito_ciudad: null,
    precio: null,
    precio_espejo: null,
    hab: null,
    banos: null,
    metros: null,
    larga_estancia_temporada: null,
    propietario_id: null,
    propietarios_contactos: [],
    nombre_propi: null,
    telf: null,
    ficha_del_piso_real: null,
    link_idealista: null,
    link_espejo: null,
    link_idealista_espejo: null,
    fecha_visitas: null,
    fecha_visitas_entrada: null,
    observaciones: null,
    requisitos_propietario: null,
    amueblado: null,
    captador: null,
    alquilado_por: null,
    captador_alquilado_por: null,
    status: null,
    activo: true,
    alquilado_codigo: null,
    vendido_codigo: null,
    row_color: null,
    tipo_operacion: null,
  };
}

function parseNumber(value: string): number | null {
  const cleaned = value
    .replace(/[€\s]/g, '')
    .replace(/\./g, '')
    .replace(',', '.');
  const num = Number(cleaned);
  return Number.isFinite(num) ? num : null;
}

function parsePrecio(value: string): number | null {
  const trimmed = value.trim().toUpperCase();
  if (!trimmed) return null;

  const kMatch = /^([\d.,]+)\s*K$/.exec(trimmed);
  if (kMatch) {
    const base = parseNumber(kMatch[1]);
    return base !== null ? base * 1000 : null;
  }

  return parseNumber(trimmed);
}

function excelSerialToIso(serial: number): string | null {
  if (!Number.isFinite(serial) || serial < 1 || serial > 200000) return null;
  const utc = new Date(Math.round((serial - 25569) * 86400 * 1000));
  if (Number.isNaN(utc.getTime())) return null;
  return utc.toISOString().split('T')[0];
}

function parseDate(value: string): string | null {
  const trimmed = value.trim();
  if (!trimmed) return null;

  const asNumber = Number(trimmed);
  if (Number.isFinite(asNumber) && /^\d+(\.\d+)?$/.test(trimmed)) {
    const fromSerial = excelSerialToIso(asNumber);
    if (fromSerial) return fromSerial;
  }

  const iso = /^\d{4}-\d{2}-\d{2}/.exec(trimmed);
  if (iso) return iso[0];

  const dmy = /^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})/.exec(trimmed);
  if (dmy) {
    const [, d, m, y] = dmy;
    return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
  }

  const parsed = Date.parse(trimmed);
  if (!Number.isNaN(parsed)) {
    return new Date(parsed).toISOString().split('T')[0];
  }

  return null;
}

function parseLargaEstancia(value: string): 'larga' | 't' | null {
  const v = value.toLowerCase().trim();
  if (!v) return null;
  if (v === 'larga' || v === 'l') return 'larga';
  if (v === 't' || v === 'temporada') return 't';
  return null;
}

function parseAmueblado(value: string): InmuebleFormData['amueblado'] {
  return normalizeInmuebleAmueblado(value);
}

function parseStatus(value: string): 'I' | 'P' | 'I-M' | null {
  const v = value.trim().toUpperCase();
  if (v === 'I' || v === 'P' || v === 'I-M') return v;
  if (v === 'R') return null;
  return null;
}

function parseTipoOperacion(value: string): 'alquiler' | 'venta' | null {
  const v = value.toLowerCase().trim();
  if (!v) return null;
  if (v === 'alquiler' || v === 'rent' || v === 'alquilar') return 'alquiler';
  if (v === 'venta' || v === 'sell' || v === 'vender') return 'venta';
  return null;
}

export function resolveHeaderKey(header: string): keyof InmuebleFormData | null {
  const norm = normalizeHeader(header);
  if (!norm) return null;
  if (/^columna \d+$/.test(norm)) return null;

  const exact = HEADER_ALIASES[norm];
  if (exact) return exact;

  if (norm.includes('fecha') && norm.includes('entrada')) {
    return 'fecha_entrada_inmueble';
  }
  if (norm.includes('imagen') && norm.includes('real')) return 'imagen_real';
  if (
    norm.includes('direccion') &&
    norm.includes('real') &&
    !norm.includes('espejo')
  ) {
    return 'direccion_piso_real';
  }
  if (norm.includes('foto') && norm.includes('espejo')) return 'foto_espejo';
  if (norm.includes('espejo') && norm.includes('direccion')) {
    return 'espejo_direccion';
  }
  if (norm.includes('distrito') && norm.includes('ciudad')) {
    return 'distrito_ciudad';
  }
  if (norm.includes('barrio') || norm.includes('distrito')) {
    return 'barrio_distrito';
  }
  if (norm.includes('idealista') || (norm.includes('link') && norm.includes('espejo'))) {
    return 'link_idealista_espejo';
  }
  if (norm.includes('ficha') && norm.includes('piso')) {
    return 'ficha_del_piso_real';
  }
  if (norm.includes('captador') || norm.includes('vendido') || norm.includes('alquilado')) {
    return 'captador_alquilado_por';
  }
  if (
    norm.includes('larga') &&
    (norm.includes('temporada') || norm.includes('estancia'))
  ) {
    return 'larga_estancia_temporada';
  }
  if (norm.includes('fecha') && norm.includes('visitas')) {
    return 'fecha_visitas_entrada';
  }
  if (norm.includes('video') || norm.includes('coconut')) {
    return 'fecha_visitas_entrada';
  }
  if (norm.includes('telf') || norm.includes('telefono')) return 'telf';
  if (norm.includes('requisit') && norm.includes('propi')) {
    return 'requisitos_propietario';
  }
  if (norm.includes('observ')) return 'observaciones';

  return null;
}

export function parseCell(
  key: keyof InmuebleFormData,
  raw: string,
): string | number | null {
  const value = raw.trim();
  if (!value || value === '[object Object]') return null;

  if (IMAGE_FIELDS.has(key)) return null;

  switch (key) {
    case 'precio':
    case 'precio_espejo':
      return parsePrecio(value);
    case 'metros':
      return parseNumber(value);
    case 'hab':
    case 'banos': {
      const n = parseNumber(value);
      return n !== null ? Math.trunc(n) : null;
    }
    case 'fecha_entrada_inmueble':
      return parseDate(value);
    case 'larga_estancia_temporada':
      return parseLargaEstancia(value);
    case 'amueblado':
      return parseAmueblado(value);
    case 'status':
      return parseStatus(value);
    case 'tipo_operacion':
      return parseTipoOperacion(value);
    default:
      return value;
  }
}

export function isRowEmpty(row: InmuebleFormData): boolean {
  return Object.values(row).every(
    (v) => v === null || v === undefined || v === '',
  );
}

export function rowHasContent(
  row: InmuebleFormData,
  hasPendingImages = false,
): boolean {
  if (hasPendingImages || row.imagen_real || row.foto_espejo) return true;

  const hasCore =
    Boolean(row.direccion_piso_real?.trim()) ||
    Boolean(row.nombre_propi?.trim()) ||
    row.precio != null;

  if (!hasCore) return false;
  return !isRowEmpty(row);
}
