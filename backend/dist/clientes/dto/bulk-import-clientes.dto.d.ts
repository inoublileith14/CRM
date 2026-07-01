export declare class BulkImportClienteItemDto {
    nombre: string;
    email?: string | null;
    telefono?: string | null;
    ciudad?: string | null;
    barrio?: string[] | null;
    distrito?: string[] | null;
    tipo_nomina?: string | null;
    tipo_cliente?: 'estudiante' | 'parejas' | 'familia_con_hijos' | 'compartir' | null;
    estado?: 'activo' | 'inactivo' | 'pendiente';
    origen?: 'email' | 'call' | 'otro' | null;
    estado_contacto?: string | null;
    descripcion?: string | null;
    ref_cliente?: string | null;
    mensaje?: string | null;
    fecha_contacto?: string | null;
    fecha_ultima_gestion?: string | null;
    presupuesto_maximo?: string | null;
    banos?: number | null;
    notas?: string | null;
    tipo_operacion?: 'alquiler' | 'venta' | null;
    inmueble_ids?: string[];
    worker_ids?: string[];
}
export declare class BulkImportClientesOptionsDto {
    inmueble_id?: string;
    worker_id?: string;
    tipo_operacion?: 'alquiler' | 'venta';
    skip_duplicates?: boolean;
}
export declare class BulkImportClientesDto {
    clientes: BulkImportClienteItemDto[];
    options?: BulkImportClientesOptionsDto;
}
