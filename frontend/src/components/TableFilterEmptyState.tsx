'use client';

interface TableFilterEmptyStateProps {
  onClear: () => void;
}

export function TableFilterEmptyState({ onClear }: TableFilterEmptyStateProps) {
  return (
    <div className="p-10 text-center">
      <p className="text-slate-600">Ningún registro coincide con los filtros.</p>
      <button
        type="button"
        onClick={onClear}
        className="mt-3 text-sm font-medium text-emerald-600 hover:text-emerald-500"
      >
        Quitar todos los filtros
      </button>
    </div>
  );
}
