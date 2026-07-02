import { createElement, type ReactNode } from 'react';
import { estimateGestionSelectWidthPx } from '@/lib/cliente-gestion-estado';
import type { TipoOperacion } from '@/types/inmueble';

export const INMUEBLE_CLIENTES_TABLE_CLASS =
  'table-fixed w-full min-w-[72rem] border-collapse border border-black text-left text-sm [&_tbody_td]:align-middle';

export const INMUEBLE_CLIENTES_TABLE_X_SCROLL_CLASS = 'w-full overflow-x-auto';

export const INMUEBLE_CLIENTES_TABLE_HEAD_X_SCROLL_CLASS = `${INMUEBLE_CLIENTES_TABLE_X_SCROLL_CLASS} [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden`;

const BORDER = 'border border-black';

export const INMUEBLE_CLIENTE_CHECKBOX_TH_CLASS = `${BORDER} px-2 py-2 text-center`;
export const INMUEBLE_CLIENTE_CHECKBOX_TD_CLASS = `${BORDER} px-2 py-2`;

export const INMUEBLE_CLIENTE_ACTIONS_TH_CLASS = `${BORDER} px-1 py-2 text-center`;
export const INMUEBLE_CLIENTE_ACTIONS_TD_CLASS = `${BORDER} px-1 py-2 text-center`;

export function inmuebleClienteHeadClass(
  columnKey: string,
  headBg: string,
): string {
  const head = `text-center text-xs font-semibold uppercase tracking-wide text-yellow-300 ${headBg}`;

  switch (columnKey) {
    case 'fecha_ultima_gestion':
    case 'fecha_contacto':
      return `${BORDER} px-1.5 py-2 ${head}`;
    case 'telefono':
    case 'visita_no_realizada':
      return `${BORDER} px-1 py-2 ${head}`;
    case 'gestion_estado':
      return `${BORDER} px-1.5 py-1.5 ${head}`;
    case 'nombre':
    case 'ref_cliente':
    case 'notas':
    case 'trabajador':
      return `${BORDER} px-2 py-2 ${head}`;
    default:
      return `${BORDER} px-2 py-2 ${head}`;
  }
}

export function inmuebleClienteBodyClass(columnKey: string): string {
  switch (columnKey) {
    case 'fecha_ultima_gestion':
    case 'fecha_contacto':
      return `${BORDER} px-1.5 py-2 text-center text-slate-700 whitespace-nowrap`;
    case 'telefono':
      return `${BORDER} px-1 py-2`;
    case 'visita_no_realizada':
      return `${BORDER} px-1 py-2 text-center`;
    case 'gestion_estado':
      return `${BORDER} overflow-visible px-1.5 py-1.5 text-center`;
    case 'nombre':
      return `${BORDER} px-2 py-2`;
    case 'ref_cliente':
      return `${BORDER} px-2 py-2 text-slate-700`;
    case 'notas':
    case 'trabajador':
      return `${BORDER} px-2 py-2`;
    default:
      return `${BORDER} px-2 py-2 text-slate-700`;
  }
}

/** Percent widths for columns other than gestión — must sum to 100. */
const COL_WIDTHS_PERCENT = [
  2.75, // checkbox
  6.5, // última gestión
  6.5, // fecha petición
  8, // nombre
  11.5, // references
  8.5, // teléfono
  3.5, // no asistió visita
  10, // gestión (fallback when no tipoOperacion)
  27.25, // notas (absorbs extra space)
  12, // trabajador
  5.5, // acciones
] as const;

const GESTION_COL_INDEX = 7;

const GESTION_COL_SIDE_MARGIN_PX = 12;

export function InmuebleClienteTableColgroup(options?: {
  tipoOperacion?: TipoOperacion;
}): ReactNode {
  const gestionWidthPx = options?.tipoOperacion
    ? estimateGestionSelectWidthPx(options.tipoOperacion) +
      GESTION_COL_SIDE_MARGIN_PX
    : null;

  return createElement(
    'colgroup',
    null,
    ...COL_WIDTHS_PERCENT.map((width, index) =>
      createElement('col', {
        key: index,
        style:
          index === GESTION_COL_INDEX && gestionWidthPx != null
            ? { width: `${gestionWidthPx}px` }
            : { width: `${width}%` },
      }),
    ),
  );
}
