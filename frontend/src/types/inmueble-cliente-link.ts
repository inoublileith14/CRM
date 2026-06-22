import { Cliente } from '@/types/cliente';

export interface InmuebleClienteLinkRow {
  row_key: string;
  inmueble_id: string | null;
  inmueble_label: string;
  inmueble_ref: string | null;
  cliente: Cliente;
}
