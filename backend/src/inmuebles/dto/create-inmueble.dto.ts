export class CreateInmuebleDto {
  ref?: string;
  fecha_entrada_inmueble?: string;
  imagen_real?: string;
  direccion_piso_real?: string;
  foto_espejo?: string;
  espejo_direccion?: string;
  barrio_distrito?: string;
  precio?: number;
  precio_espejo?: number;
  hab?: number;
  banos?: number;
  metros?: number;
  larga_estancia_temporada?: 'larga' | 't';
  propietario_id?: string;
  propietarios_contactos?: { nombre: string; telf?: string | null }[];
  nombre_propi?: string;
  telf?: string;
  ficha_del_piso_real?: string;
  link_idealista_espejo?: string;
  fecha_visitas_entrada?: string;
  observaciones?: string;
  amueblado?: 'si' | 'no';
  captador_alquilado_por?: string;
  status?: 'I' | 'P' | 'I-M';
  row_color?: string;
  tipo_operacion?: 'alquiler' | 'venta';
}
