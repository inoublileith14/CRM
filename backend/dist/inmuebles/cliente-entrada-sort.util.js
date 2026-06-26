"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getDefaultClienteEntradaIso = getDefaultClienteEntradaIso;
exports.resolveClienteEntradaIso = resolveClienteEntradaIso;
exports.getClienteEntradaSortKey = getClienteEntradaSortKey;
const CLIENTE_ENTRADA_DEFAULT_MONTHS = 2;
function pad2(n) {
    return String(n).padStart(2, '0');
}
function getDefaultClienteEntradaIso(referenceDate = new Date()) {
    const local = new Date(referenceDate.getFullYear(), referenceDate.getMonth(), referenceDate.getDate());
    local.setMonth(local.getMonth() - CLIENTE_ENTRADA_DEFAULT_MONTHS);
    return `${local.getFullYear()}-${pad2(local.getMonth() + 1)}-${pad2(local.getDate())}T00:00:00.000Z`;
}
function resolveClienteEntradaIso(fechaContacto) {
    if (fechaContacto?.trim()) {
        const parsed = new Date(fechaContacto);
        if (!Number.isNaN(parsed.getTime())) {
            return fechaContacto;
        }
    }
    return getDefaultClienteEntradaIso();
}
function getClienteEntradaSortKey(fechaContacto) {
    const iso = resolveClienteEntradaIso(fechaContacto);
    const match = iso.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (match) {
        return (Number(match[1]) * 10_000 +
            Number(match[2]) * 100 +
            Number(match[3]));
    }
    const t = new Date(iso).getTime();
    return Number.isNaN(t) ? 0 : t;
}
//# sourceMappingURL=cliente-entrada-sort.util.js.map