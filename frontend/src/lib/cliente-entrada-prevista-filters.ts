import {
  CLIENTE_ENTRADA_PREVISTA_OPTIONS,
  ClienteEntradaPrevista,
  normalizeClienteEntradaPrevista,
} from '@/lib/cliente-entrada-prevista';
import { InmuebleClienteLinkRow } from '@/types/inmueble-cliente-link';

export const DEFAULT_CLIENTE_ENTRADA_PREVISTA_FILTER: ClienteEntradaPrevista[] =
  CLIENTE_ENTRADA_PREVISTA_OPTIONS.map((option) => option.value);

export function resolveClienteEntradaPrevistaFilterValue(
  value: string | null | undefined,
): ClienteEntradaPrevista {
  return normalizeClienteEntradaPrevista(value) ?? 'sin_info';
}

export function isClienteEntradaPrevistaFilterActive(
  selected: readonly ClienteEntradaPrevista[],
): boolean {
  return selected.length < CLIENTE_ENTRADA_PREVISTA_OPTIONS.length;
}

export function toggleClienteEntradaPrevistaFilter(
  selected: readonly ClienteEntradaPrevista[],
  value: ClienteEntradaPrevista,
): ClienteEntradaPrevista[] {
  const set = new Set(selected);
  if (set.has(value)) {
    set.delete(value);
  } else {
    set.add(value);
  }
  return CLIENTE_ENTRADA_PREVISTA_OPTIONS.map((option) => option.value).filter(
    (option) => set.has(option),
  );
}

export function buildClienteEntradaPrevistaApiParam(
  selected: readonly ClienteEntradaPrevista[],
): string | undefined {
  if (!isClienteEntradaPrevistaFilterActive(selected)) return undefined;
  if (selected.length === 0) return '';
  return selected.join(',');
}

export function filterClienteLinkRowsByEntradaPrevista(
  rows: InmuebleClienteLinkRow[],
  selected: readonly ClienteEntradaPrevista[],
): InmuebleClienteLinkRow[] {
  if (!isClienteEntradaPrevistaFilterActive(selected)) return rows;

  const allowed = new Set(selected);
  return rows.filter((row) =>
    allowed.has(
      resolveClienteEntradaPrevistaFilterValue(row.cliente.fecha_entrada_inmueble),
    ),
  );
}
