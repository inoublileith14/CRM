export declare const CLIENTE_ENTRADA_PREVISTA_VALUES: readonly ["ya", "semana", "15_dias", "mes", "mas_mes"];
export type ClienteEntradaPrevista = (typeof CLIENTE_ENTRADA_PREVISTA_VALUES)[number];
export declare function isClienteEntradaPrevista(value: string | null | undefined): value is ClienteEntradaPrevista;
export declare function normalizeClienteEntradaPrevista(value: string | null | undefined): ClienteEntradaPrevista | null;
export declare function parseClienteEntradaPrevistaInput(value: string | null | undefined): ClienteEntradaPrevista | null;
