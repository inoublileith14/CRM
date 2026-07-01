export declare const INMUEBLE_AMUEBLADO_VALUES: readonly ["electro_amueblada", "electro_sin_amueblar", "cocina_vacia_sin_amueblar", "no_lo_se"];
export type InmuebleAmueblado = (typeof INMUEBLE_AMUEBLADO_VALUES)[number];
export declare function isInmuebleAmueblado(value: string | null | undefined): value is InmuebleAmueblado;
export declare function normalizeInmuebleAmueblado(value: string | null | undefined): InmuebleAmueblado | null;
