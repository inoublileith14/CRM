export class FindOrCreatePropietarioDto {
  nombre: string;
  telf?: string;
  tipo_operacion?: 'alquiler' | 'venta';
}
