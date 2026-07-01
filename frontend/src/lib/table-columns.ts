import { toFilterDisplay } from '@/lib/table-column-filters';
import { formatInmueblePrecio } from '@/lib/inmueble-table-utils';
import { getClienteGestionEstadoOption } from '@/lib/cliente-gestion-estado';
import {
  formatClienteEntradaDate,
  resolveClienteEntradaIso,
} from '@/lib/cliente-date-utils';
import {
  formatClienteEntradaPrevistaLabel,
  normalizeClienteEntradaPrevista,
  CLIENTE_ENTRADA_PREVISTA_OPTIONS,
} from '@/lib/cliente-entrada-prevista';
import { getClienteTipoClienteLabel } from '@/lib/cliente-tipo';
import { formatClienteZonasLabel } from '@/lib/cliente-zonas';
import { parseRefCliente } from '@/lib/parse-ref-cliente';
import {
  CLIENTE_ESTADO_LABELS,
  CLIENTE_ORIGEN_LABELS,
  Cliente,
  ClienteFormData,
} from '@/types/cliente';
import { Inmueble, TIPO_OPERACION_LABELS, TipoOperacion } from '@/types/inmueble';
import { InmuebleClienteLinkRow } from '@/types/inmueble-cliente-link';
import { Propietario } from '@/types/propietario';
import {
  getWorkerRolLabel,
  Worker,
  workerAccountStatus,
} from '@/types/worker';
import type { TableColumnDef } from '@/lib/table-column-filters';

function formatClienteCell(cliente: Cliente, key: string): string {
  if (key === 'inmuebles_count') {
    return String(cliente.inmuebles_count ?? 0);
  }
  if (key === 'workers_count') {
    return String(cliente.workers_count ?? 0);
  }
  const value = cliente[key as keyof Cliente];
  if (value === null || value === undefined || value === '') {
    return toFilterDisplay(null);
  }
  if (key === 'origen' && typeof value === 'string') {
    return (
      CLIENTE_ORIGEN_LABELS[value as keyof typeof CLIENTE_ORIGEN_LABELS] ??
      value
    );
  }
  if (key === 'tipo_operacion' && typeof value === 'string') {
    return (
      TIPO_OPERACION_LABELS[value as TipoOperacion] ?? value
    );
  }
  if (key === 'estado' && typeof value === 'string') {
    return (
      CLIENTE_ESTADO_LABELS[value as keyof typeof CLIENTE_ESTADO_LABELS] ??
      value
    );
  }
  if (key === 'fecha_contacto' && typeof value === 'string') {
    return new Intl.DateTimeFormat('es-ES', {
      dateStyle: 'short',
    }).format(new Date(value));
  }
  if (key === 'mensaje' && typeof value === 'string') {
    return value.length > 60 ? `${value.slice(0, 60)}…` : value;
  }
  return String(value);
}

export type ClienteTableFieldKey =
  | keyof ClienteFormData
  | 'inmuebles_count'
  | 'workers_count';

export function buildClienteTableColumns(
  fields: { key: ClienteTableFieldKey; label: string }[],
): TableColumnDef<Cliente>[] {
  return fields.map(({ key, label }) => ({
    key,
    label,
    fieldType:
      key === 'inmuebles_count' || key === 'workers_count'
        ? 'number'
        : key === 'fecha_contacto'
          ? 'date'
          : 'text',
    getDisplayValue: (row) => formatClienteCell(row, key),
    getNumberValue: (row) => {
      if (key === 'inmuebles_count') return row.inmuebles_count ?? 0;
      if (key === 'workers_count') return row.workers_count ?? 0;
      return null;
    },
    getDateIso: (row) =>
      key === 'fecha_contacto' ? row.fecha_contacto : null,
  }));
}

export const WORKER_TABLE_COLUMNS: TableColumnDef<Worker>[] = [
  {
    key: 'nombre',
    label: 'NOMBRE',
    getDisplayValue: (w) => toFilterDisplay(w.nombre),
  },
  {
    key: 'telf',
    label: 'TELÉFONO',
    getDisplayValue: (w) => toFilterDisplay(w.telf),
  },
  {
    key: 'email',
    label: 'EMAIL',
    getDisplayValue: (w) => toFilterDisplay(w.email),
  },
  {
    key: 'rol',
    label: 'ROL',
    getDisplayValue: (w) => getWorkerRolLabel(w.rol),
  },
  {
    key: 'activo',
    label: 'ESTADO',
    getDisplayValue: (w) => (w.activo ? 'Activo' : 'Inactivo'),
  },
  {
    key: 'usuario',
    label: 'USUARIO',
    getDisplayValue: (w) => workerAccountStatus(w).label,
  },
  {
    key: 'clientes_count',
    label: 'CLIENTES',
    fieldType: 'number',
    getDisplayValue: (w) => String(w.clientes_count ?? 0),
    getNumberValue: (w) => w.clientes_count ?? 0,
  },
];

export const PROPIETARIO_TABLE_COLUMNS: TableColumnDef<Propietario>[] = [
  {
    key: 'nombre',
    label: 'NOMBRE',
    getDisplayValue: (p) => toFilterDisplay(p.nombre),
  },
  {
    key: 'tipo_operacion',
    label: 'TIPO',
    getDisplayValue: (p) =>
      p.tipo_operacion ? TIPO_OPERACION_LABELS[p.tipo_operacion] : '—',
  },
  {
    key: 'telf',
    label: 'TELÉFONO',
    getDisplayValue: (p) => toFilterDisplay(p.telf),
  },
  {
    key: 'email',
    label: 'EMAIL',
    getDisplayValue: (p) => toFilterDisplay(p.email),
  },
  {
    key: 'inmuebles_count',
    label: 'INMUEBLES',
    fieldType: 'number',
    getDisplayValue: (p) => String(p.inmuebles_count ?? 0),
    getNumberValue: (p) => p.inmuebles_count ?? 0,
  },
];

export const WORKER_CLIENTE_TABLE_COLUMNS: TableColumnDef<Cliente>[] = [
  {
    key: 'nombre',
    label: 'NOMBRE',
    getDisplayValue: (c) => toFilterDisplay(c.nombre),
  },
  {
    key: 'email',
    label: 'EMAIL',
    getDisplayValue: (c) => toFilterDisplay(c.email),
  },
  {
    key: 'telefono',
    label: 'TELÉFONO',
    getDisplayValue: (c) => toFilterDisplay(c.telefono),
  },
  {
    key: 'estado',
    label: 'ESTADO',
    getDisplayValue: (c) => CLIENTE_ESTADO_LABELS[c.estado],
  },
];

export const PROPIETARIO_INMUEBLE_TABLE_COLUMNS: TableColumnDef<Inmueble>[] = [
  {
    key: 'direccion',
    label: 'DIRECCIÓN',
    getDisplayValue: (i) => toFilterDisplay(i.direccion_piso_real),
  },
  {
    key: 'barrio',
    label: 'BARRIO',
    getDisplayValue: (i) => toFilterDisplay(i.barrio_distrito),
  },
  {
    key: 'tipo',
    label: 'TIPO',
    getDisplayValue: (i) =>
      i.tipo_operacion
        ? TIPO_OPERACION_LABELS[i.tipo_operacion]
        : toFilterDisplay(null),
  },
  {
    key: 'precio',
    label: 'PRECIO',
    fieldType: 'number',
    getDisplayValue: (i) =>
      i.precio != null ? formatInmueblePrecio(i.precio) : toFilterDisplay(null),
    getNumberValue: (i) => i.precio,
  },
];

export function buildInmuebleClienteTableColumns(
  workerLabelFn: (cliente: Cliente) => string,
  tipoOperacion: TipoOperacion,
): TableColumnDef<Cliente>[] {
  return [
    {
      key: 'fecha_ultima_gestion',
      label: 'ÚLTIMA GESTIÓN',
      shortLabel: 'ÚLTIMA\nGESTIÓN',
      fieldType: 'date',
      getDisplayValue: (c) => formatClienteDate(c.fecha_ultima_gestion),
      getDateIso: (c) => c.fecha_ultima_gestion ?? null,
    },
    {
      key: 'fecha_contacto',
      label: 'FECHA PETICIÓN',
      shortLabel: 'FECHA\nPETICIÓN',
      fieldType: 'date',
      getDisplayValue: (c) => formatClienteEntradaDate(c.fecha_contacto),
      getDateIso: (c) => resolveClienteEntradaIso(c.fecha_contacto),
    },
    {
      key: 'nombre',
      label: 'NOMBRE',
      getDisplayValue: (c) => toFilterDisplay(c.nombre),
    },
    {
      key: 'ref_cliente',
      label: 'REFERENCES',
      getDisplayValue: (c) => toFilterDisplay(c.ref_cliente),
    },
    {
      key: 'telefono',
      label: 'TELÉFONO',
      getDisplayValue: (c) => toFilterDisplay(c.telefono),
    },
    {
      key: 'gestion_estado',
      label: 'GESTIÓN',
      getDisplayValue: (c) =>
        getClienteGestionEstadoOption(c.gestion_estado, tipoOperacion).label,
    },
    {
      key: 'notas',
      label: 'NOTAS',
      getDisplayValue: (c) => toFilterDisplay(c.notas),
    },
    {
      key: 'trabajador',
      label: 'TRABAJADOR',
      getDisplayValue: workerLabelFn,
    },
  ];
}

function formatClienteDate(value: string | null | undefined): string {
  if (!value) return toFilterDisplay(null);
  return new Intl.DateTimeFormat('es-ES', {
    dateStyle: 'short',
  }).format(new Date(value));
}

export function buildVentaDenseClienteTableColumns(
  tipoOperacion: TipoOperacion = 'venta',
): TableColumnDef<Cliente>[] {
  const center = 'text-center align-middle';
  return [
    {
      key: 'fecha_ultima_gestion',
      label: 'FECHA ÚLTIMA GESTIÓN',
      shortLabel: 'ÚLT. GEST.',
      headClassName: 'w-[4.75rem] text-center',
      cellClassName: `w-[4.75rem] ${center}`,
      fieldType: 'date',
      getDisplayValue: (cliente) => formatClienteDate(cliente.fecha_ultima_gestion),
      getDateIso: (cliente) => cliente.fecha_ultima_gestion ?? null,
    },
    {
      key: 'fecha_peticion',
      label: 'FECHA PETICIÓN',
      shortLabel: 'FECHA\nPETICIÓN',
      headClassName: 'w-[4.75rem] text-center',
      cellClassName: `w-[4.75rem] ${center}`,
      fieldType: 'date',
      getDisplayValue: (cliente) => formatClienteEntradaDate(cliente.fecha_contacto),
      getDateIso: (cliente) => resolveClienteEntradaIso(cliente.fecha_contacto),
    },
    {
      key: 'fecha_entrada_inmueble',
      label: 'ENTRADA PREVISTA CLIENTES',
      shortLabel: 'ENTRADA\nPREVISTA\nCLIENTES',
      headClassName: 'w-[6rem] min-w-[6rem] text-center',
      cellClassName: `w-[6rem] min-w-[6rem] ${center}`,
      fieldType: 'number',
      getDisplayValue: (cliente) =>
        formatClienteEntradaPrevistaLabel(cliente.fecha_entrada_inmueble),
      getNumberValue: (cliente) => {
        const value = normalizeClienteEntradaPrevista(
          cliente.fecha_entrada_inmueble,
        );
        if (!value) return null;
        const index = CLIENTE_ENTRADA_PREVISTA_OPTIONS.findIndex(
          (option) => option.value === value,
        );
        return index >= 0 ? index : null;
      },
    },
    {
      key: 'ref_cliente',
      label: 'REFERENCES',
      shortLabel: 'REF.',
      headClassName: 'w-[7.5rem] text-center',
      cellClassName: `max-w-[7.5rem] ${center}`,
      getDisplayValue: (cliente) => toFilterDisplay(cliente.ref_cliente),
    },
    {
      key: 'nombre',
      label: 'NOMBRE',
      headClassName: 'w-[7.5rem] text-center',
      cellClassName: `max-w-[7.5rem] ${center}`,
      getDisplayValue: (cliente) => toFilterDisplay(cliente.nombre),
    },
    {
      key: 'telefono',
      label: 'TELÉFONO',
      shortLabel: 'TEL.',
      headClassName: 'w-[6.25rem] text-center',
      cellClassName: `whitespace-nowrap ${center}`,
      getDisplayValue: (cliente) => toFilterDisplay(cliente.telefono),
    },
    {
      key: 'presupuesto_maximo',
      label: 'PRESUPUESTO MÁXIMO',
      shortLabel: 'P. MÁX.',
      headClassName: 'w-[4.25rem] text-center',
      cellClassName: `whitespace-nowrap tabular-nums ${center}`,
      getDisplayValue: (cliente) => toFilterDisplay(cliente.presupuesto_maximo),
    },
    {
      key: 'presupuesto_peticion',
      label: 'PRESUPUESTO DE PETICIÓN',
      shortLabel: 'P. PET.',
      headClassName: 'w-[4.25rem] text-center',
      cellClassName: `whitespace-nowrap tabular-nums ${center}`,
      getDisplayValue: (cliente) =>
        toFilterDisplay(parseRefCliente(cliente.ref_cliente).presupuesto),
    },
    {
      key: 'habitaciones',
      label: 'HABITACIONES',
      shortLabel: 'HAB.',
      headClassName: 'w-[3rem] text-center',
      cellClassName: `text-center tabular-nums align-middle`,
      fieldType: 'number',
      getDisplayValue: (cliente) => {
        const value = parseRefCliente(cliente.ref_cliente).habitaciones;
        return value != null ? String(value) : toFilterDisplay(null);
      },
      getNumberValue: (cliente) =>
        parseRefCliente(cliente.ref_cliente).habitaciones,
    },
    {
      key: 'banos',
      label: 'BAÑOS',
      shortLabel: 'BAÑ.',
      headClassName: 'w-[3rem] text-center',
      cellClassName: `text-center tabular-nums align-middle`,
      fieldType: 'number',
      getDisplayValue: (cliente) => {
        const parsed = parseRefCliente(cliente.ref_cliente);
        const value = cliente.banos ?? parsed.banos;
        return value != null ? String(value) : toFilterDisplay(null);
      },
      getNumberValue: (cliente) => {
        const parsed = parseRefCliente(cliente.ref_cliente);
        return cliente.banos ?? parsed.banos;
      },
    },
    {
      key: 'metros',
      label: 'METROS',
      shortLabel: 'M²',
      headClassName: 'w-[3rem] text-center',
      cellClassName: `text-center tabular-nums align-middle`,
      fieldType: 'number',
      getDisplayValue: (cliente) => {
        const value = parseRefCliente(cliente.ref_cliente).metros;
        return value != null ? String(value) : toFilterDisplay(null);
      },
      getNumberValue: (cliente) => parseRefCliente(cliente.ref_cliente).metros,
    },
    {
      key: 'barrio',
      label: 'BARRIO',
      shortLabel: 'BARR.',
      headClassName: 'w-[7.5rem] text-center',
      cellClassName: `w-[7.5rem] max-w-[7.5rem] ${center}`,
      getDisplayValue: (cliente) => {
        const label = formatClienteZonasLabel(cliente.barrio, '');
        if (label) return toFilterDisplay(label);
        return toFilterDisplay(parseRefCliente(cliente.ref_cliente).zona);
      },
    },
    {
      key: 'distrito',
      label: 'DISTRITO',
      shortLabel: 'DIST.',
      headClassName: 'w-[7.5rem] text-center',
      cellClassName: `w-[7.5rem] max-w-[7.5rem] ${center}`,
      getDisplayValue: (cliente) =>
        toFilterDisplay(formatClienteZonasLabel(cliente.distrito)),
    },
    {
      key: 'tipo_nomina',
      label: 'TIPO NÓMINA',
      shortLabel: 'NÓM.',
      headClassName: 'w-[7.5rem] text-center',
      cellClassName: `w-[7.5rem] max-w-[7.5rem] ${center}`,
      getDisplayValue: (cliente) => toFilterDisplay(cliente.tipo_nomina),
    },
    {
      key: 'tipo_cliente',
      label: 'TIPO CLIENTE',
      shortLabel: 'TIPO',
      headClassName: 'w-[7.5rem] text-center',
      cellClassName: `w-[7.5rem] max-w-[7.5rem] ${center}`,
      getDisplayValue: (cliente) =>
        getClienteTipoClienteLabel(cliente.tipo_cliente, false),
    },
  ];
}

export function buildVentaInmuebleClienteTableColumns(): TableColumnDef<Cliente>[] {
  return buildVentaDenseClienteTableColumns();
}

export function buildAlquilerInmuebleClienteTableColumns(): TableColumnDef<Cliente>[] {
  return buildVentaDenseClienteTableColumns();
}

export function buildAlquilerGlobalClienteTableColumns(
  tipoOperacion: TipoOperacion = 'alquiler',
): TableColumnDef<InmuebleClienteLinkRow>[] {
  return buildVentaGlobalClienteTableColumns(tipoOperacion);
}

export function buildVentaGlobalClienteTableColumns(
  tipoOperacion: TipoOperacion = 'venta',
): TableColumnDef<InmuebleClienteLinkRow>[] {
  return buildVentaDenseClienteTableColumns(tipoOperacion).map(adaptClienteColumn);
}

export function buildGeneralInmuebleClienteTableColumns(
  workerLabelFn: (cliente: Cliente) => string,
  tipoOperacion: TipoOperacion,
): TableColumnDef<InmuebleClienteLinkRow>[] {
  const base = buildInmuebleClienteTableColumns(workerLabelFn, tipoOperacion);

  const inmuebleColumn: TableColumnDef<InmuebleClienteLinkRow> = {
    key: 'inmueble',
    label: 'INMUEBLE',
    getDisplayValue: (row) => toFilterDisplay(row.inmueble_label),
  };

  const nombreIndex = base.findIndex((col) => col.key === 'nombre');
  if (nombreIndex === -1) {
    return [inmuebleColumn, ...base.map(adaptClienteColumn)];
  }

  return [
    ...base.slice(0, nombreIndex).map(adaptClienteColumn),
    inmuebleColumn,
    ...base.slice(nombreIndex).map(adaptClienteColumn),
  ];
}

function adaptClienteColumn(
  col: TableColumnDef<Cliente>,
): TableColumnDef<InmuebleClienteLinkRow> {
  return {
    key: col.key,
    label: col.label,
    shortLabel: col.shortLabel,
    headClassName: col.headClassName,
    cellClassName: col.cellClassName,
    fieldType: col.fieldType,
    getDisplayValue: (row) => col.getDisplayValue(row.cliente),
    getNumberValue: col.getNumberValue
      ? (row) => col.getNumberValue!(row.cliente)
      : undefined,
    getDateIso: col.getDateIso
      ? (row) => col.getDateIso!(row.cliente)
      : undefined,
  };
}
