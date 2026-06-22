const styles: Record<string, string> = {
  activo: 'bg-emerald-100 text-emerald-800',
  inactivo: 'bg-slate-100 text-slate-600',
  pendiente: 'bg-amber-100 text-amber-800',
};

const labels: Record<string, string> = {
  activo: 'Activo',
  inactivo: 'Inactivo',
  pendiente: 'Pendiente',
};

export function StatusBadge({ estado }: { estado: string }) {
  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${styles[estado] ?? styles.inactivo}`}
    >
      {labels[estado] ?? estado}
    </span>
  );
}
