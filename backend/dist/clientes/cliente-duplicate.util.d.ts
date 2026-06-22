export declare function normalizeClienteTelefono(telefono: string | null | undefined): string | null;
export declare function clienteContactDateKey(fechaContacto: string | null | undefined): string | null;
export declare function buildClienteDuplicateKey(telefono: string | null | undefined, fechaContacto: string | null | undefined, inmuebleId: string | null | undefined): string | null;
export declare function contactDayUtcRange(dateKey: string): {
    dayStart: string;
    dayEnd: string;
};
