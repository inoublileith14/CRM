import { clienteZonasMatchQuery } from '@/lib/cliente-zonas';
import { parseRefCliente } from '@/lib/parse-ref-cliente';
import { Cliente } from '@/types/cliente';
import { InmuebleClienteLinkRow } from '@/types/inmueble-cliente-link';

export interface VentaRangeFilters {
  presupuesto_maximo_min: string;
  presupuesto_maximo_max: string;
  presupuesto_peticion_min: string;
  presupuesto_peticion_max: string;
  habitaciones_min: string;
  habitaciones_max: string;
  banos_min: string;
  banos_max: string;
  metros_min: string;
  metros_max: string;
  barrio: string;
  distrito: string;
}

export const EMPTY_VENTA_RANGE_FILTERS: VentaRangeFilters = {
  presupuesto_maximo_min: '',
  presupuesto_maximo_max: '',
  presupuesto_peticion_min: '',
  presupuesto_peticion_max: '',
  habitaciones_min: '',
  habitaciones_max: '',
  banos_min: '',
  banos_max: '',
  metros_min: '',
  metros_max: '',
  barrio: '',
  distrito: '',
};

function parseIntegerInput(value: string | undefined): number | null {
  const trimmed = (value ?? '').trim();
  if (!trimmed) return null;
  const n = Number(trimmed.replace(',', '.'));
  return Number.isFinite(n) ? n : null;
}

/** Parses budget values like 390k, 390K, 390000, or 390 (thousands). */
export function parseBudgetAmount(
  value: string | null | undefined,
): number | null {
  if (!value?.trim()) return null;

  const raw = value.trim().toLowerCase().replace(/\s/g, '');
  const kMatch = raw.match(/^(\d+(?:[.,]\d+)?)k$/);
  if (kMatch) {
    return Number(kMatch[1].replace(',', '.')) * 1000;
  }

  const digits = raw.replace(/[^\d.,-]/g, '').replace(',', '.');
  if (!digits) return null;

  const n = Number(digits);
  if (!Number.isFinite(n)) return null;

  if (n > 0 && n < 10000) {
    return n * 1000;
  }

  return n;
}

function parseBudgetFilterInput(value: string | undefined): number | null {
  if (!(value ?? '').trim()) return null;
  return parseBudgetAmount(value);
}

function matchesRange(
  value: number | null,
  minRaw: string | undefined,
  maxRaw: string | undefined,
): boolean {
  const min = parseIntegerInput(minRaw);
  const max = parseIntegerInput(maxRaw);

  if (min === null && max === null) return true;
  if (value === null) return false;
  if (min !== null && value < min) return false;
  if (max !== null && value > max) return false;
  return true;
}

function matchesBudgetRange(
  value: number | null,
  minRaw: string | undefined,
  maxRaw: string | undefined,
): boolean {
  const min = parseBudgetFilterInput(minRaw);
  const max = parseBudgetFilterInput(maxRaw);

  if (min === null && max === null) return true;
  if (value === null) return false;
  if (min !== null && value < min) return false;
  if (max !== null && value > max) return false;
  return true;
}

export function hasActiveVentaRangeFilters(
  filters: VentaRangeFilters,
): boolean {
  return Object.values(filters).some((value) => (value ?? '').trim() !== '');
}

export function filterRowsByVentaRange(
  rows: InmuebleClienteLinkRow[],
  filters: VentaRangeFilters,
): InmuebleClienteLinkRow[] {
  if (!hasActiveVentaRangeFilters(filters)) return rows;

  return rows.filter((row) => {
    const { cliente } = row;
    const parsed = parseRefCliente(cliente.ref_cliente);

    const presupuestoMaximo = parseBudgetAmount(cliente.presupuesto_maximo);
    const presupuestoPeticion = parseBudgetAmount(parsed.presupuesto);

    if (
      !matchesBudgetRange(
        presupuestoMaximo,
        filters.presupuesto_maximo_min,
        filters.presupuesto_maximo_max,
      )
    ) {
      return false;
    }

    if (
      !matchesBudgetRange(
        presupuestoPeticion,
        filters.presupuesto_peticion_min,
        filters.presupuesto_peticion_max,
      )
    ) {
      return false;
    }

    if (
      !matchesRange(
        parsed.habitaciones,
        filters.habitaciones_min,
        filters.habitaciones_max,
      )
    ) {
      return false;
    }

    if (
      !matchesRange(cliente.banos, filters.banos_min, filters.banos_max)
    ) {
      return false;
    }

    if (
      !matchesRange(parsed.metros, filters.metros_min, filters.metros_max)
    ) {
      return false;
    }

    if (!clienteZonasMatchQuery(cliente.barrio, filters.barrio)) {
      const fallback = parsed.zona ?? '';
      if (!fallback.toLowerCase().includes((filters.barrio ?? '').trim().toLowerCase())) {
        return false;
      }
    }

    if (!clienteZonasMatchQuery(cliente.distrito, filters.distrito)) {
      return false;
    }

    return true;
  });
}

export function filterClientesByVentaRange(
  clientes: Cliente[],
  filters: VentaRangeFilters,
): Cliente[] {
  if (!hasActiveVentaRangeFilters(filters)) return clientes;

  return clientes.filter((cliente) => {
    const parsed = parseRefCliente(cliente.ref_cliente);

    const presupuestoMaximo = parseBudgetAmount(cliente.presupuesto_maximo);
    const presupuestoPeticion = parseBudgetAmount(parsed.presupuesto);

    if (
      !matchesBudgetRange(
        presupuestoMaximo,
        filters.presupuesto_maximo_min,
        filters.presupuesto_maximo_max,
      )
    ) {
      return false;
    }

    if (
      !matchesBudgetRange(
        presupuestoPeticion,
        filters.presupuesto_peticion_min,
        filters.presupuesto_peticion_max,
      )
    ) {
      return false;
    }

    if (
      !matchesRange(
        parsed.habitaciones,
        filters.habitaciones_min,
        filters.habitaciones_max,
      )
    ) {
      return false;
    }

    if (
      !matchesRange(cliente.banos, filters.banos_min, filters.banos_max)
    ) {
      return false;
    }

    if (
      !matchesRange(parsed.metros, filters.metros_min, filters.metros_max)
    ) {
      return false;
    }

    if (!clienteZonasMatchQuery(cliente.barrio, filters.barrio)) {
      const fallback = parsed.zona ?? '';
      if (!fallback.toLowerCase().includes((filters.barrio ?? '').trim().toLowerCase())) {
        return false;
      }
    }

    if (!clienteZonasMatchQuery(cliente.distrito, filters.distrito)) {
      return false;
    }

    return true;
  });
}
