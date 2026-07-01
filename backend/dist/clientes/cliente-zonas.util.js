"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.normalizeClienteZonas = normalizeClienteZonas;
function normalizeClienteZonas(value) {
    if (value == null)
        return [];
    if (Array.isArray(value)) {
        const seen = new Set();
        const result = [];
        for (const item of value) {
            if (typeof item !== 'string')
                continue;
            const trimmed = item.trim();
            if (!trimmed || seen.has(trimmed))
                continue;
            seen.add(trimmed);
            result.push(trimmed);
        }
        return result;
    }
    if (typeof value === 'string') {
        const trimmed = value.trim();
        return trimmed ? [trimmed] : [];
    }
    return [];
}
//# sourceMappingURL=cliente-zonas.util.js.map