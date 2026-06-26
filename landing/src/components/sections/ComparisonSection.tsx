import { Check, Minus } from 'lucide-react';
import { SectionHeading } from '@/components/ui/SectionHeading';
import { comparison } from '@/lib/copy';

function CellValue({ value }: { value: boolean | string }) {
  if (value === true) {
    return (
      <span className="inline-flex items-center justify-center text-emerald-600">
        <Check className="h-5 w-5" aria-label="Sí" />
      </span>
    );
  }
  if (value === false) {
    return (
      <span className="inline-flex items-center justify-center text-slate-300">
        <Minus className="h-5 w-5" aria-label="No" />
      </span>
    );
  }
  return <span className="text-sm text-slate-600">{value}</span>;
}

export function ComparisonSection() {
  return (
    <section className="bg-slate-50 py-16 sm:py-20">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <SectionHeading title={comparison.title} subtitle={comparison.subtitle} />
        <div className="mt-12 overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
          <table className="w-full min-w-[600px] text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50">
                {comparison.headers.map((header, i) => (
                  <th
                    key={header || 'feature'}
                    className={`px-4 py-3 font-semibold text-slate-900 ${
                      i === 3 ? 'bg-emerald-50 text-emerald-900' : ''
                    }`}
                  >
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {comparison.rows.map((row) => (
                <tr key={row.feature} className="border-b border-slate-100 last:border-0">
                  <td className="px-4 py-3 font-medium text-slate-900">{row.feature}</td>
                  <td className="px-4 py-3 text-center">
                    <CellValue value={row.excel} />
                  </td>
                  <td className="px-4 py-3 text-center">
                    <CellValue value={row.generic} />
                  </td>
                  <td className="bg-emerald-50/50 px-4 py-3 text-center">
                    <CellValue value={row.cocount} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
