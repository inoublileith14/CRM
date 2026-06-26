export declare const CLIENTE_GESTION_ESTADOS_ALQUILER: readonly ["no_gestionando", "gestionando", "visita_concertada", "reservado", "nc", "pendiente_cuadrar_docs", "perfil_no_encaja", "videollamada", "ya_encontro_piso"];
export declare const CLIENTE_GESTION_ESTADOS_VENTA: readonly ["no_gestionado", "gestionando_w", "visita_concertada", "nc", "pendiente_cuadrar_visita", "ya_compro", "perfil_no_encaja", "videollamada"];
export declare const CLIENTE_GESTION_ESTADOS: readonly ["no_gestionando", "gestionando", "visita_concertada", "reservado", "nc", "pendiente_cuadrar_docs", "perfil_no_encaja", "videollamada", "ya_encontro_piso", "no_gestionado", "gestionando_w", "visita_concertada", "nc", "pendiente_cuadrar_visita", "ya_compro", "perfil_no_encaja", "videollamada"];
export type ClienteGestionEstadoAlquiler = (typeof CLIENTE_GESTION_ESTADOS_ALQUILER)[number];
export type ClienteGestionEstadoVenta = (typeof CLIENTE_GESTION_ESTADOS_VENTA)[number];
export type ClienteGestionEstado = (typeof CLIENTE_GESTION_ESTADOS)[number];
export declare function getDefaultClienteGestionEstado(tipoOperacion: 'alquiler' | 'venta'): ClienteGestionEstado;
export declare function isClienteGestionEstadoForTipo(value: string, tipoOperacion: 'alquiler' | 'venta'): value is ClienteGestionEstado;
