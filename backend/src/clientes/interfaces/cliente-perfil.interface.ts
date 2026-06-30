export interface ClientePerfil {
  id: string;
  cliente_id: string;
  orden: number;
  nombre: string | null;
  telefono: string | null;
  tipo_nomina: string | null;
  tipo_ingreso: string | null;
  ingreso_monto: number | null;
  pais: string | null;
  notas: string | null;
  created_at: string;
  updated_at: string;
}

export type ClientePerfilInput = Omit<
  ClientePerfil,
  'id' | 'cliente_id' | 'created_at' | 'updated_at'
>;
