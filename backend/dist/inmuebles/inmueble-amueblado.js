"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.INMUEBLE_AMUEBLADO_VALUES = void 0;
exports.isInmuebleAmueblado = isInmuebleAmueblado;
exports.normalizeInmuebleAmueblado = normalizeInmuebleAmueblado;
exports.INMUEBLE_AMUEBLADO_VALUES = [
    'electro_amueblada',
    'electro_sin_amueblar',
    'cocina_vacia_sin_amueblar',
    'no_lo_se',
];
const VALUE_SET = new Set(exports.INMUEBLE_AMUEBLADO_VALUES);
function isInmuebleAmueblado(value) {
    return Boolean(value && VALUE_SET.has(value));
}
function normalizeInmuebleAmueblado(value) {
    if (value == null)
        return null;
    const trimmed = value.trim();
    if (!trimmed)
        return null;
    if (isInmuebleAmueblado(trimmed))
        return trimmed;
    if (trimmed === 'si')
        return 'electro_amueblada';
    if (trimmed === 'no')
        return 'electro_sin_amueblar';
    return null;
}
//# sourceMappingURL=inmueble-amueblado.js.map