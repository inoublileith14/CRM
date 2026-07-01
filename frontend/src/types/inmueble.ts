import { Cliente } from '@/types/cliente';

export interface InmueblePropietarioContacto {
  nombre: string;
  telf: string | null;
}

export interface Inmueble {
  id: string;
  ref: string | null;
  fecha_entrada_inmueble: string | null;
  imagen_real: string | null;
  direccion_piso_real: string | null;
  foto_espejo: string | null;
  espejo_direccion: string | null;
  barrio_distrito: string | null;
  distrito_ciudad: string | null;
  precio: number | null;
  precio_espejo: number | null;
  hab: number | null;
  banos: number | null;
  metros: number | null;
  larga_estancia_temporada: 'larga' | 't' | null;
  propietario_id: string | null;
  propietarios_contactos: InmueblePropietarioContacto[];
  nombre_propi: string | null;
  telf: string | null;
  ficha_del_piso_real: string | null;
  link_idealista: string | null;
  link_espejo: string | null;
  link_idealista_espejo: string | null;
  fecha_visitas: string | null;
  fecha_visitas_entrada: string | null;
  observaciones: string | null;
  requisitos_propietario: string | null;
  amueblado: 'si' | 'no' | null;
  captador: string | null;
  alquilado_por: string | null;
  captador_alquilado_por: string | null;
  status: 'I' | 'P' | 'I-M' | null;
  activo: boolean;
  alquilado_codigo: 'C' | 'O' | 'R' | null;
  vendido_codigo: 'C' | 'O' | 'R' | null;
  row_color: string | null;
  tipo_operacion: 'alquiler' | 'venta' | null;
  created_at: string;
  updated_at: string;
  clientes_count?: number;
  clientes?: Cliente[];
}

export type InmuebleFormData = Omit<
  Inmueble,
  'id' | 'created_at' | 'updated_at'
>;

export function getInmuebleDefaultEntradaDate(referenceDate = new Date()): string {
  const pad = (value: number) => String(value).padStart(2, '0');
  return `${referenceDate.getFullYear()}-${pad(referenceDate.getMonth() + 1)}-${pad(referenceDate.getDate())}`;
}

export const INMUEBLE_FIELDS: {
  key: keyof InmuebleFormData;
  label: string;
  type: 'text' | 'number' | 'date' | 'select' | 'textarea' | 'image';
  options?: { value: string; label: string }[];
}[] = [
  {
    key: 'tipo_operacion',
    label: 'Alquiler o venta',
    type: 'select',
    options: [
      { value: 'alquiler', label: 'Alquiler (Rent)' },
      { value: 'venta', label: 'Venta (Sell)' },
    ],
  },
  { key: 'ref', label: 'Idealista ref', type: 'text' },
  { key: 'imagen_real', label: 'Imagen real', type: 'image' },
  { key: 'direccion_piso_real', label: 'Dirección piso real', type: 'text' },
  { key: 'foto_espejo', label: 'Foto espejo', type: 'image' },
  { key: 'espejo_direccion', label: 'Espejo dirección', type: 'text' },
  { key: 'barrio_distrito', label: 'Barrio / Distrito', type: 'text' },
  { key: 'distrito_ciudad', label: 'Distrito / Ciudad', type: 'text' },
  { key: 'precio', label: 'Precio', type: 'number' },
  { key: 'precio_espejo', label: 'Precio espejo', type: 'number' },
  { key: 'hab', label: 'Hab', type: 'number' },
  { key: 'banos', label: 'Baños', type: 'number' },
  { key: 'metros', label: 'Metros', type: 'number' },
  {
    key: 'larga_estancia_temporada',
    label: 'Larga estancia (larga) // Temporada (t)',
    type: 'select',
    options: [
      { value: 'larga', label: 'Larga estancia' },
      { value: 't', label: 'Temporada' },
    ],
  },
  { key: 'nombre_propi', label: 'Nombre propi', type: 'text' },
  { key: 'telf', label: 'Telf', type: 'text' },
  { key: 'ficha_del_piso_real', label: 'Ficha del piso real', type: 'text' },
  { key: 'link_idealista', label: 'Link Idealista', type: 'text' },
  { key: 'link_espejo', label: 'Link espejo', type: 'text' },
  {
    key: 'link_idealista_espejo',
    label: 'Link Idealista o link espejo',
    type: 'text',
  },
  { key: 'fecha_visitas', label: 'Fecha de visitas', type: 'date' },
  {
    key: 'fecha_entrada_inmueble',
    label: 'Fecha entrada al CRM',
    type: 'date',
  },
  {
    key: 'fecha_visitas_entrada',
    label: 'Fecha entrada al piso',
    type: 'date',
  },
  { key: 'observaciones', label: 'Observaciones', type: 'textarea' },
  {
    key: 'requisitos_propietario',
    label: 'Requisitos del propietario',
    type: 'textarea',
  },
  {
    key: 'amueblado',
    label: 'Amueblado (si o no)',
    type: 'select',
    options: [
      { value: 'si', label: 'Sí' },
      { value: 'no', label: 'No' },
    ],
  },
  { key: 'captador', label: 'Captador', type: 'text' },
  { key: 'alquilado_por', label: 'Alquilado por', type: 'text' },
  {
    key: 'captador_alquilado_por',
    label: 'Captador // Alquilado por',
    type: 'text',
  },
  {
    key: 'status',
    label: 'Status',
    type: 'select',
    options: [
      { value: 'I', label: 'INTERNO' },
      { value: 'P', label: 'PUBLICADO' },
      { value: 'I-M', label: 'INTERNO EN MADRID' },
    ],
  },
];

export const emptyInmuebleForm = (): InmuebleFormData => ({
  ref: null,
  fecha_entrada_inmueble: getInmuebleDefaultEntradaDate(),
  imagen_real: null,
  direccion_piso_real: null,
  foto_espejo: null,
  espejo_direccion: null,
  barrio_distrito: null,
  distrito_ciudad: null,
  precio: null,
  precio_espejo: null,
  hab: null,
  banos: null,
  metros: null,
  larga_estancia_temporada: null,
  propietario_id: null,
  propietarios_contactos: [],
  nombre_propi: null,
  telf: null,
  ficha_del_piso_real: null,
  link_idealista: null,
  link_espejo: null,
  link_idealista_espejo: null,
  fecha_visitas: null,
  fecha_visitas_entrada: null,
  observaciones: null,
  requisitos_propietario: null,
  amueblado: null,
  captador: null,
  alquilado_por: null,
  captador_alquilado_por: null,
  status: null,
  activo: true,
  alquilado_codigo: null,
  vendido_codigo: null,
  row_color: null,
  tipo_operacion: null,
});

export type TipoOperacion = 'alquiler' | 'venta';

export const TIPO_OPERACION_LABELS: Record<TipoOperacion, string> = {
  alquiler: 'Alquiler',
  venta: 'Venta',
};
