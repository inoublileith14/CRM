import { parseRefCliente } from '@/lib/parse-ref-cliente';

function formatRefClienteTableValue(ref: string | null | undefined): string {
  if (!ref?.trim()) return '—';
  return ref.replace(/\s+/g, ' ').trim();
}

export const clienteDenseTextClass =
  'line-clamp-3 break-words whitespace-normal text-center leading-snug';

export function ClienteRefValue({
  ref,
}: {
  ref: string | null | undefined;
}) {
  if (!ref?.trim()) return <>—</>;

  const parsed = parseRefCliente(ref);
  const summaryParts: string[] = [];
  if (parsed.presupuesto) summaryParts.push(parsed.presupuesto);
  if (parsed.habitaciones != null) summaryParts.push(`${parsed.habitaciones}h`);
  if (parsed.metros != null) summaryParts.push(`${parsed.metros}m`);

  const summary = summaryParts.join(' ');
  const detail = parsed.zona?.trim();
  const fallback = formatRefClienteTableValue(ref);

  if (!summary && !detail) {
    return <span className={clienteDenseTextClass}>{fallback}</span>;
  }

  return (
    <span className="block text-center leading-snug">
      {summary ? <span className="block">{summary}</span> : null}
      {detail ? (
        <span className="block line-clamp-2 break-words whitespace-normal text-slate-500 leading-snug">
          {detail}
        </span>
      ) : !summary ? (
        <span className={clienteDenseTextClass}>{fallback}</span>
      ) : null}
    </span>
  );
}
