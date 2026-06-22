import { Cliente } from '../../clientes/interfaces/cliente.interface';
export type WorkerRol = 'admin' | 'asesor';
export interface Worker {
    id: string;
    nombre: string;
    telf: string | null;
    email: string | null;
    rol: WorkerRol;
    activo: boolean;
    notas: string | null;
    profile_id: string | null;
    invitation_sent_at: string | null;
    created_at: string;
    updated_at: string;
    clientes_count?: number;
    clientes?: Cliente[];
}
export type WorkerInput = Omit<Worker, 'id' | 'created_at' | 'updated_at' | 'clientes_count' | 'clientes'>;
