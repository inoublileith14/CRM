import { BulkImportClienteItemDto } from './dto/bulk-import-clientes.dto';
import { parseRefCliente } from './parse-ref-cliente.util';

export function enrichClienteImportRow(
  raw: BulkImportClienteItemDto,
): BulkImportClienteItemDto {
  const parsed = parseRefCliente(raw.ref_cliente);

  return {
    ...raw,
    presupuesto_maximo: raw.presupuesto_maximo ?? parsed.presupuesto,
    banos: raw.banos ?? parsed.banos,
  };
}
