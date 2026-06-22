const fs = require('fs');
const path = require('path');

// Resolve xlsx from the frontend workspace (where it's installed)
const XLSX = require(require.resolve('xlsx', {
  paths: [path.join(__dirname, '..', 'frontend')],
}));

const input = 'c:/Users/inoub/Downloads/estadísticas (1).xls';
const out = 'c:/Users/inoub/Desktop/projects/n8n/supabase/seed-clientes-venta-from-excel.sql';

function normHeader(v) {
  return String(v ?? '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

const HEADER_MAP = {
  origen: 'origen',
  estado: 'estado_contacto',
  'estado contacto': 'estado_contacto',
  descripcion: 'descripcion',
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
};

function cellStr(v) {
  if (v === null || v === undefined) return null;
  const s = String(v).trim();
  return s ? s : null;
}

function parseOrigen(value) {
  const v = String(value ?? '').trim().toLowerCase();
  if (v === 'email') return 'email';
  if (v === 'call' || v === 'llamada') return 'call';
  if (!v) return null;
  return 'otro';
}

function parseFecha(value) {
  if (value == null || value === '') return null;

  if (typeof value === 'number') {
    const parsed = XLSX.SSF.parse_date_code(value);
    if (parsed) {
      const d = new Date(Date.UTC(parsed.y, parsed.m - 1, parsed.d));
      return d.toISOString();
    }
  }

  const s = String(value).trim();
  if (!s) return null;
  const d = new Date(s);
  if (!Number.isNaN(d.getTime())) return d.toISOString();
  return null;
}

function sqlString(v) {
  if (v === null || v === undefined) return 'NULL';
  return "'" + String(v).replace(/'/g, "''") + "'";
}

function main() {
  const wb = XLSX.readFile(input, { cellDates: false });
  const sheetName = wb.SheetNames[0];
  const sheet = wb.Sheets[sheetName];
  const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' });
  if (!rows.length) throw new Error('Empty sheet');

  const headers = rows[0].map(normHeader);
  const keys = headers.map((h) => HEADER_MAP[h] ?? null);

  const clientes = [];
  for (let r = 1; r < rows.length; r++) {
    const row = rows[r];
    const get = (k) => {
      const idx = keys.indexOf(k);
      if (idx === -1) return null;
      return row[idx];
    };

    const telefono = cellStr(get('telefono'));
    const email = cellStr(get('email'));
    const nombre =
      cellStr(get('nombre')) || telefono || email || 'Cliente sin nombre';
    const origen = parseOrigen(cellStr(get('origen')));

    const anyValue = [
      telefono,
      email,
      cellStr(get('mensaje')),
      cellStr(get('descripcion')),
      cellStr(get('ref_cliente')),
      cellStr(get('estado_contacto')),
    ].some(Boolean);
    if (!anyValue && !cellStr(get('nombre'))) continue;

    clientes.push({
      nombre,
      email,
      telefono,
      ciudad: null,
      estado: 'pendiente',
      origen,
      estado_contacto: cellStr(get('estado_contacto')),
      descripcion: cellStr(get('descripcion')),
      ref_cliente: cellStr(get('ref_cliente')),
      mensaje: cellStr(get('mensaje')),
      fecha_contacto: parseFecha(get('fecha_contacto')),
      notas: null,
      tipo_operacion: 'venta',
    });
  }

  const cols = [
    'nombre',
    'email',
    'telefono',
    'ciudad',
    'estado',
    'origen',
    'estado_contacto',
    'descripcion',
    'ref_cliente',
    'mensaje',
    'fecha_contacto',
    'notas',
    'tipo_operacion',
  ];

  let sql = '';
  sql += '-- Auto-generated from estadísticas (1).xls\n';
  sql += '-- Sheet: ' + sheetName + '\n';
  sql += '-- Rows inserted: ' + String(clientes.length) + '\n\n';
  sql += 'BEGIN;\n\n';

  for (const c of clientes) {
    const values = cols.map((col) => sqlString(c[col]));
    sql +=
      'INSERT INTO public.clientes (' +
      cols.join(', ') +
      ') VALUES (' +
      values.join(', ') +
      ');\n';
  }

  sql += '\nCOMMIT;\n';
  fs.writeFileSync(out, sql, 'utf8');
  console.log('Wrote', out, 'rows:', clientes.length);
}

main();

