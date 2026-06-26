import { MessageCircle } from 'lucide-react';
import {
  EXCEL_CELL_ALIGN,
  EXCEL_CELL_BORDER,
  EXCEL_TABLE_CLASS,
} from '@/lib/excel-table-styles';
import { HERO_TABLE_ROWS } from '@/lib/gestion-colors';

export function ProductTableMock() {
  return (
    <div className="overflow-x-auto">
      <table className={EXCEL_TABLE_CLASS}>
        <thead>
          <tr className="bg-slate-100 font-semibold text-slate-800">
            <th className={`${EXCEL_CELL_BORDER} px-2 py-1.5`}>Cliente</th>
            <th className={`${EXCEL_CELL_BORDER} px-2 py-1.5`}>Teléfono</th>
            <th className={`${EXCEL_CELL_BORDER} px-2 py-1.5`}>Gestión</th>
            <th className={`${EXCEL_CELL_BORDER} px-2 py-1.5`}>Última gestión</th>
            <th className={`${EXCEL_CELL_BORDER} w-10 px-1 py-1.5`} />
          </tr>
        </thead>
        <tbody>
          {HERO_TABLE_ROWS.map((row) => (
            <tr key={row.cliente}>
              <td className={`${EXCEL_CELL_BORDER} ${EXCEL_CELL_ALIGN} px-2 py-1.5`}>
                {row.cliente}
              </td>
              <td className={`${EXCEL_CELL_BORDER} ${EXCEL_CELL_ALIGN} px-2 py-1.5`}>
                {row.telefono}
              </td>
              <td className={`${EXCEL_CELL_BORDER} ${EXCEL_CELL_ALIGN} p-0`}>
                <span
                  className="block px-1 py-1.5 text-[10px] font-semibold leading-tight sm:text-xs"
                  style={{
                    backgroundColor: row.gestion.backgroundColor,
                    color: row.gestion.textColor,
                  }}
                >
                  {row.gestion.label}
                </span>
              </td>
              <td className={`${EXCEL_CELL_BORDER} ${EXCEL_CELL_ALIGN} px-2 py-1.5 text-[10px] sm:text-xs`}>
                {row.fecha}
              </td>
              <td className={`${EXCEL_CELL_BORDER} ${EXCEL_CELL_ALIGN} px-1 py-1`}>
                {row.showWhatsApp ? (
                  <span className="inline-flex items-center justify-center rounded bg-emerald-600 p-1 text-white">
                    <MessageCircle className="h-3 w-3" />
                  </span>
                ) : null}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
