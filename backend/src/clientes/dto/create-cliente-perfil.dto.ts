export class CreateClientePerfilDto {
  orden?: number;
  nombre?: string | null;
  telefono?: string | null;
  tipo_nomina?: string | null;
  tipo_ingreso?: string | null;
  ingreso_monto?: number | null;
  pais?: string | null;
  notas?: string | null;
}
