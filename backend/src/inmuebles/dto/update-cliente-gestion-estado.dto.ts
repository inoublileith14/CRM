import { ClienteGestionEstado } from '../../clientes/cliente-gestion-estado';

export class UpdateClienteGestionEstadoDto {
  gestion_estado!: ClienteGestionEstado;
  fecha_ultima_gestion?: string;
}
