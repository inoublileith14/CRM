export interface InmuebleRefCandidate {
    id: string;
    ref: string | null;
    tipo_operacion: string | null;
}
export declare function findInmuebleIdByClienteRef(refCliente: string | null | undefined, inmuebles: InmuebleRefCandidate[], tipoOperacion: 'alquiler' | 'venta'): string | null;
