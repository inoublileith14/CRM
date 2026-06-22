export interface InmueblePropietarioContacto {
    nombre: string;
    telf: string | null;
}
export declare const MAX_INMUEBLE_PROPIETARIOS = 5;
export declare function normalizePropietariosContactos(input: {
    propietarios_contactos?: Array<{
        nombre: string;
        telf?: string | null;
    }> | null;
    nombre_propi?: string | null;
    telf?: string | null;
}): {
    propietarios_contactos: InmueblePropietarioContacto[];
    nombre_propi: string | null;
    telf: string | null;
    propietario_id: null;
};
