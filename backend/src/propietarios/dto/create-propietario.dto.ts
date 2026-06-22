export class CreatePropietarioDto {
  nombre: string;
  telf?: string;
  email?: string;
  notas?: string;
  tipo_operacion?: 'alquiler' | 'venta';
}
