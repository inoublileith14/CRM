import * as XLSX from 'xlsx';
import { normalizeClienteZonas } from '@/lib/cliente-zonas';
import { ClienteFormData, ClienteOrigen } from '@/types/cliente';

const HEADER_MAP: Record<string, keyof ClienteFormData> = {
  origen: 'origen',
  estado: 'estado_contacto',
  'estado contacto': 'estado_contacto',
  descripcion: 'descripcion',
  descripción: 'descripcion',
  'ref. cliente': 'ref_cliente',
  'ref cliente': 'ref_cliente',
  usuario: 'nombre',
  nombre: 'nombre',
  email: 'email',
  correo: 'email',
  telefono: 'telefono',
  teléfono: 'telefono',
  telf: 'telefono',
  mensaje: 'mensaje',
  fecha: 'fecha_contacto',
  barrio: 'barrio',
  distrito: 'distrito',
  ciudad: 'ciudad',
};

function normalizeHeader(value: unknown): string {
  return String(value ?? '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{M}/gu, '');
}

function parseOrigen(value: string): ClienteOrigen | null {
  const v = value.trim().toLowerCase();
  if (v === 'email') return 'email';
  if (v === 'call' || v === 'llamada') return 'call';
  if (!v) return null;
  return 'otro';
}

function parseFecha(value: unknown): string | null {
  if (value == null || value === '') return null;

  if (typeof value === 'number') {
    const parsed = XLSX.SSF.parse_date_code(value);
    if (parsed) {
      const d = new Date(
        parsed.y,
        parsed.m - 1,
        parsed.d,
        parsed.H,
        parsed.M,
        Math.floor(parsed.S),
      );
      return d.toISOString();
    }
  }

  const str = String(value).trim();
  if (!str) return null;

  const m = str.match(
    /^(\d{1,2})\/(\d{1,2})\/(\d{4})(?:\s+(\d{1,2}):(\d{2})(?::(\d{2}))?)?$/,
  );
  if (m) {
    const [, day, month, year, h = '0', min = '0', sec = '0'] = m;
    const d = new Date(
      Number(year),
      Number(month) - 1,
      Number(day),
      Number(h),
      Number(min),
      Number(sec),
    );
    if (!Number.isNaN(d.getTime())) return d.toISOString();
  }

  const d = new Date(str);
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
}

function cellStr(value: unknown): string | null {
  if (value == null) return null;
  const s = String(value).trim();
  return s || null;
}

export function parseClienteExcel(buffer: ArrayBuffer): ClienteFormData[] {
  const wb = XLSX.read(buffer, { type: 'array', cellDates: true });
  const sheet = wb.Sheets[wb.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json<unknown[]>(sheet, {
    header: 1,
    defval: '',
    raw: false,
  }) as unknown[][];

  if (rows.length < 2) return [];

  const headerRow = rows[0].map(normalizeHeader);
  const colIndex = new Map<keyof ClienteFormData, number>();

  headerRow.forEach((h, i) => {
    const key = HEADER_MAP[h];
    if (key) colIndex.set(key, i);
  });

  const results: ClienteFormData[] = [];

  for (let r = 1; r < rows.length; r++) {
    const row = rows[r];
    if (!row || row.every((c) => !String(c ?? '').trim())) continue;

    const get = (key: keyof ClienteFormData) => {
      const idx = colIndex.get(key);
      if (idx === undefined) return null;
      return row[idx];
    };

    const telefono = cellStr(get('telefono'));
    const email = cellStr(get('email'));
    const nombre =
      cellStr(get('nombre')) ||
      telefono ||
      email ||
      'Cliente sin nombre';

    const origenRaw = cellStr(get('origen'));

    results.push({
      nombre,
      email,
      telefono,
      ciudad: cellStr(get('ciudad')),
      barrio: normalizeClienteZonas(cellStr(get('barrio'))),
      distrito: normalizeClienteZonas(cellStr(get('distrito'))),
      tipo_nomina: null,
      tipo_cliente: null,
      estado: 'pendiente',
      origen: parseOrigen(origenRaw ?? ''),
      estado_contacto: cellStr(get('estado_contacto')),
      descripcion: cellStr(get('descripcion')),
      ref_cliente: cellStr(get('ref_cliente')),
      mensaje: cellStr(get('mensaje')),
      fecha_contacto: parseFecha(get('fecha_contacto')),
      fecha_entrada_inmueble: null,
      presupuesto_maximo: null,
      banos: null,
      fecha_ultima_gestion: null,
      notas: null,
      tipo_operacion: null,
      inmueble_ids: [],
      worker_ids: [],
    });
  }

  return results;
}
