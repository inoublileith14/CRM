export declare const CLIENTE_GESTION_ESTADOS_ALQUILER: readonly ["no_gestionando", "gestionando", "visita_concertada", "reservado", "nc", "cliente_no_interesado", "pendiente_cuadrar_docs", "int_pendiente_docs", "videollamada", "perfil_no_encaja", "ya_encontro_piso"];
export declare const CLIENTE_GESTION_ESTADOS_VENTA: readonly ["no_gestionado", "gestionando_w", "visita_concertada", "nc", "cliente_no_interesado", "pendiente_cuadrar_visita", "ya_compro", "videollamada", "perfil_no_encaja"];
export declare const CLIENTE_GESTION_ESTADOS: readonly ["no_gestionando", "gestionando", "visita_concertada", "reservado", "nc", "cliente_no_interesado", "pendiente_cuadrar_docs", "int_pendiente_docs", "videollamada", "perfil_no_encaja", "ya_encontro_piso", "no_gestionado", "gestionando_w", "visita_concertada", "nc", "cliente_no_interesado", "pendiente_cuadrar_visita", "ya_compro", "videollamada", "perfil_no_encaja"];
export type ClienteGestionEstadoAlquiler = (typeof CLIENTE_GESTION_ESTADOS_ALQUILER)[number];
export type ClienteGestionEstadoVenta = (typeof CLIENTE_GESTION_ESTADOS_VENTA)[number];
export type ClienteGestionEstado = (typeof CLIENTE_GESTION_ESTADOS)[number];
export declare function getDefaultClienteGestionEstado(tipoOperacion: 'alquiler' | 'venta'): ClienteGestionEstado;
export declare function isClienteGestionEstadoForTipo(value: string, tipoOperacion: 'alquiler' | 'venta'): value is ClienteGestionEstado;
