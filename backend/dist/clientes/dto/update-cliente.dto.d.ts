export declare class UpdateClienteDto {
    nombre?: string;
    email?: string;
    telefono?: string;
    telefonos_extra?: string[];
    ciudad?: string;
    barrio?: string[] | null;
    distrito?: string[] | null;
    tipo_nomina?: string | null;
    tipo_cliente?: 'estudiante' | 'parejas' | 'familia_con_hijos' | 'compartir' | null;
    estado?: 'activo' | 'inactivo' | 'pendiente';
    origen?: 'email' | 'call' | 'otro';
    estado_contacto?: string;
    descripcion?: string;
    ref_cliente?: string;
    mensaje?: string;
    fecha_contacto?: string;
    fecha_entrada_inmueble?: string | null;
    fecha_ultima_gestion?: string | null;
    presupuesto_maximo?: string;
    banos?: number;
    notas?: string;
    tipo_operacion?: 'alquiler' | 'venta' | null;
    inmueble_ids?: string[];
    worker_ids?: string[];
}
