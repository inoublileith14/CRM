"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CLIENTE_ENTRADA_PREVISTA_VALUES = void 0;
exports.isClienteEntradaPrevista = isClienteEntradaPrevista;
exports.normalizeClienteEntradaPrevista = normalizeClienteEntradaPrevista;
exports.parseClienteEntradaPrevistaInput = parseClienteEntradaPrevistaInput;
const common_1 = require("@nestjs/common");
exports.CLIENTE_ENTRADA_PREVISTA_VALUES = [
    'ya',
    'semana',
    '15_dias',
    'mes',
    'mas_mes',
    'sin_info',
];
const VALUE_SET = new Set(exports.CLIENTE_ENTRADA_PREVISTA_VALUES);
const LABEL_ALIASES = {
    ya: 'ya',
    semana: 'semana',
    '1_semana': 'semana',
    '15_dias': '15_dias',
    '15_dia': '15_dias',
    '15dias': '15_dias',
    '15_días': '15_dias',
    mes: 'mes',
    '1_mes': 'mes',
    mas_mes: 'mas_mes',
    masmes: 'mas_mes',
    '2_mas': 'mas_mes',
    mas: 'mas_mes',
    'más_mes': 'mas_mes',
    sin_info: 'sin_info',
    sin_informacion: 'sin_info',
    vacio: 'sin_info',
    vasio: 'sin_info',
    '-': 'sin_info',
    '—': 'sin_info',
};
function isClienteEntradaPrevista(value) {
    return Boolean(value && VALUE_SET.has(value));
}
function normalizeClienteEntradaPrevista(value) {
    if (value == null)
        return null;
    const trimmed = value.trim();
    if (!trimmed)
        return null;
    if (isClienteEntradaPrevista(trimmed)) {
        return trimmed;
    }
    const aliasKey = trimmed
        .toLowerCase()
        .normalize('NFD')
        .replace(/\p{M}/gu, '')
        .replace(/\s+/g, '_');
    const fromAlias = LABEL_ALIASES[aliasKey];
    if (fromAlias)
        return fromAlias;
    return null;
}
function parseClienteEntradaPrevistaInput(value) {
    const normalized = normalizeClienteEntradaPrevista(value);
    if (normalized || value == null || !String(value).trim()) {
        return normalized;
    }
    throw new common_1.BadRequestException({
        message: 'Entrada prevista no válida. Usa: YA, 1 SEMANA, 15 DIA, 1 MES, 2 MAS o — (sin información)',
        code: 'CLIENTE_ENTRADA_PREVISTA_INVALID',
    });
}
//# sourceMappingURL=cliente-entrada-prevista.js.map