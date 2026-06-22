"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CLIENTE_GESTION_ESTADOS = exports.CLIENTE_GESTION_ESTADOS_VENTA = exports.CLIENTE_GESTION_ESTADOS_ALQUILER = void 0;
exports.getDefaultClienteGestionEstado = getDefaultClienteGestionEstado;
exports.isClienteGestionEstadoForTipo = isClienteGestionEstadoForTipo;
exports.CLIENTE_GESTION_ESTADOS_ALQUILER = [
    'no_gestionando',
    'gestionando',
    'visita_concertada',
    'nc',
    'pendiente_cuadrar_docs',
    'perfil_no_encaja',
    'videollamada',
    'ya_encontro_piso',
];
exports.CLIENTE_GESTION_ESTADOS_VENTA = [
    'no_gestionado',
    'gestionando_w',
    'visita_concertada',
    'nc',
    'pendiente_cuadrar_visita',
    'ya_compro',
    'perfil_no_encaja',
    'videollamada',
];
exports.CLIENTE_GESTION_ESTADOS = [
    ...exports.CLIENTE_GESTION_ESTADOS_ALQUILER,
    ...exports.CLIENTE_GESTION_ESTADOS_VENTA,
];
function getDefaultClienteGestionEstado(tipoOperacion) {
    return tipoOperacion === 'alquiler' ? 'no_gestionando' : 'no_gestionado';
}
function isClienteGestionEstadoForTipo(value, tipoOperacion) {
    const allowed = tipoOperacion === 'alquiler'
        ? exports.CLIENTE_GESTION_ESTADOS_ALQUILER
        : exports.CLIENTE_GESTION_ESTADOS_VENTA;
    return allowed.includes(value);
}
//# sourceMappingURL=cliente-gestion-estado.js.map