export declare class CreateClienteDto {
    nombre: string;
    email?: string;
    telefono?: string;
    ciudad?: string;
    estado?: 'activo' | 'inactivo' | 'pendiente';
    origen?: 'email' | 'call' | 'otro';
    estado_contacto?: string;
    descripcion?: string;
    ref_cliente?: string;
    mensaje?: string;
    fecha_contacto?: string;
    fecha_ultima_gestion?: string | null;
    presupuesto_maximo?: string;
    banos?: number;
    notas?: string;
    tipo_operacion?: 'alquiler' | 'venta' | null;
    inmueble_ids?: string[];
    worker_ids?: string[];
}
