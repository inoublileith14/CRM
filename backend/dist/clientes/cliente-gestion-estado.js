"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CLIENTE_GESTION_ESTADOS = exports.CLIENTE_GESTION_ESTADOS_VENTA = exports.CLIENTE_GESTION_ESTADOS_ALQUILER = void 0;
exports.getDefaultClienteGestionEstado = getDefaultClienteGestionEstado;
exports.isClienteGestionEstadoForTipo = isClienteGestionEstadoForTipo;
exports.isClienteVisitaGestionEstado = isClienteVisitaGestionEstado;
exports.CLIENTE_GESTION_ESTADOS_ALQUILER = [
    'no_gestionando',
    'gestionando',
    'visita_concertada',
    'reservado',
    'nc',
    'cliente_no_interesado',
    'pendiente_cuadrar_docs',
    'int_pendiente_docs',
    'videollamada',
    'perfil_no_encaja',
    'ya_encontro_piso',
];
exports.CLIENTE_GESTION_ESTADOS_VENTA = [
    'no_gestionado',
    'gestionando_w',
    'visita_concertada',
    'nc',
    'cliente_no_interesado',
    'pendiente_cuadrar_visita',
    'ya_compro',
    'videollamada',
    'perfil_no_encaja',
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
function isClienteVisitaGestionEstado(value) {
    return value === 'visita_concertada' || value === 'videollamada';
}
//# sourceMappingURL=cliente-gestion-estado.js.map