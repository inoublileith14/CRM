function formatRefClienteTableValue(ref: string | null | undefined): string {
  if (!ref?.trim()) return '—';
  return ref.replace(/\s+/g, ' ').trim();
}

export const clienteDenseTextClass =
  'line-clamp-3 break-words whitespace-normal text-center leading-snug';

export const clienteRefTextClass =
  'block min-w-0 truncate text-center leading-snug';

export function ClienteRefValue({
  ref,
}: {
  ref: string | null | undefined;
}) {
  const display = formatRefClienteTableValue(ref);

  if (display === '—') {
    return <span className={clienteRefTextClass}>—</span>;
  }

  return (
    <span className={clienteRefTextClass} title={display}>
      {display}
    </span>
  );
}
