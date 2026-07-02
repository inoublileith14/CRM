export interface ParsedRefCliente {
    presupuesto: string | null;
    habitaciones: number | null;
    banos: number | null;
    metros: number | null;
    zona: string | null;
}
export declare function parseRefCliente(ref: string | null | undefined): ParsedRefCliente;
export declare function resolveClienteBanos(banos: number | null | undefined, refCliente: string | null | undefined): number | null;
export declare function normalizeRefForMatch(ref: string | null | undefined): string;
export declare function refsMatchForInmueble(clienteRef: string | null | undefined, inmuebleRef: string | null | undefined): boolean;
