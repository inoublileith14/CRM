"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.normalizeClienteTelefonosExtra = normalizeClienteTelefonosExtra;
function normalizeClienteTelefonosExtra(value) {
    if (!Array.isArray(value))
        return [];
    return value
        .map((item) => (typeof item === 'string' ? item.trim() : ''))
        .filter(Boolean);
}
//# sourceMappingURL=cliente-telefonos.util.js.map