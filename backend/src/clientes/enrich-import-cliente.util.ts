import { normalizeClienteZonas } from './cliente-zonas.util';
import { BulkImportClienteItemDto } from './dto/bulk-import-clientes.dto';
import { parseRefCliente } from './parse-ref-cliente.util';

export function enrichClienteImportRow(
  raw: BulkImportClienteItemDto,
): BulkImportClienteItemDto {
  const parsed = parseRefCliente(raw.ref_cliente);
  const barrio =
    raw.barrio != null && raw.barrio.length > 0
      ? raw.barrio
      : parsed.zona
        ? [parsed.zona]
        : [];

  return {
    ...raw,
    presupuesto_maximo: raw.presupuesto_maximo ?? parsed.presupuesto,
    banos: raw.banos ?? parsed.banos,
    barrio: normalizeClienteZonas(barrio),
  };
}
