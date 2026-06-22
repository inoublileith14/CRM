"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseClienteExcelBuffer = parseClienteExcelBuffer;
const XLSX = __importStar(require("xlsx"));
const HEADER_MAP = {
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
};
function normalizeHeader(value) {
    return String(value ?? '')
        .trim()
        .toLowerCase()
        .normalize('NFD')
        .replace(/\p{M}/gu, '');
}
function parseOrigen(value) {
    const v = value.trim().toLowerCase();
    if (v === 'email')
        return 'email';
    if (v === 'call' || v === 'llamada')
        return 'call';
    if (!v)
        return null;
    return 'otro';
}
function parseFecha(value) {
    if (value == null || value === '')
        return null;
    if (typeof value === 'number') {
        const parsed = XLSX.SSF.parse_date_code(value);
        if (parsed) {
            const d = new Date(parsed.y, parsed.m - 1, parsed.d, parsed.H, parsed.M, Math.floor(parsed.S));
            return d.toISOString();
        }
    }
    const str = String(value).trim();
    if (!str)
        return null;
    const m = str.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})(?:\s+(\d{1,2}):(\d{2})(?::(\d{2}))?)?$/);
    if (m) {
        const [, day, month, year, h = '0', min = '0', sec = '0'] = m;
        const d = new Date(Number(year), Number(month) - 1, Number(day), Number(h), Number(min), Number(sec));
        if (!Number.isNaN(d.getTime()))
            return d.toISOString();
    }
    const d = new Date(str);
    return Number.isNaN(d.getTime()) ? null : d.toISOString();
}
function cellStr(value) {
    if (value == null)
        return null;
    const s = String(value).trim();
    return s || null;
}
function parseClienteExcelBuffer(buffer) {
    const wb = XLSX.read(buffer, { type: 'buffer', cellDates: true });
    const sheet = wb.Sheets[wb.SheetNames[0]];
    const rows = XLSX.utils.sheet_to_json(sheet, {
        header: 1,
        defval: '',
        raw: false,
    });
    if (rows.length < 2)
        return [];
    const headerRow = rows[0].map(normalizeHeader);
    const colIndex = new Map();
    headerRow.forEach((h, i) => {
        const key = HEADER_MAP[h];
        if (key)
            colIndex.set(key, i);
    });
    const results = [];
    for (let r = 1; r < rows.length; r++) {
        const row = rows[r];
        if (!row || row.every((c) => !String(c ?? '').trim()))
            continue;
        const get = (key) => {
            const idx = colIndex.get(key);
            if (idx === undefined)
                return null;
            return row[idx];
        };
        const telefono = cellStr(get('telefono'));
        const email = cellStr(get('email'));
        const nombre = cellStr(get('nombre')) ||
            telefono ||
            email ||
            'Cliente sin nombre';
        const origenRaw = cellStr(get('origen'));
        results.push({
            nombre,
            email,
            telefono,
            ciudad: null,
            estado: 'pendiente',
            origen: parseOrigen(origenRaw ?? ''),
            estado_contacto: cellStr(get('estado_contacto')),
            descripcion: cellStr(get('descripcion')),
            ref_cliente: cellStr(get('ref_cliente')),
            mensaje: cellStr(get('mensaje')),
            fecha_contacto: parseFecha(get('fecha_contacto')),
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
//# sourceMappingURL=parse-cliente-excel.js.map