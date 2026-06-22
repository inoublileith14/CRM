'use client';

import { Search } from 'lucide-react';
import { WorkerListFilter } from '@/lib/worker-search';
import { WORKER_ROL_LABELS } from '@/types/worker';

const FILTERS: { id: WorkerListFilter; label: string }[] = [
  { id: 'all', label: 'Todos' },
  { id: 'admin', label: WORKER_ROL_LABELS.admin },
  { id: 'asesor', label: WORKER_ROL_LABELS.asesor },
  { id: 'inactivo', label: 'Inactivos' },
  { id: 'sin_cuenta', label: 'Sin cuenta' },
];

interface WorkerListToolbarProps {
  search: string;
  onSearchChange: (value: string) => void;
  filter: WorkerListFilter;
  onFilterChange: (filter: WorkerListFilter) => void;
  resultCount: number;
  totalCount: number;
}

export function WorkerListToolbar({
  search,
  onSearchChange,
  filter,
  onFilterChange,
  resultCount,
  totalCount,
}: WorkerListToolbarProps) {
  return (
    <div className="space-y-3 border-b border-slate-200 bg-white px-4 py-4 sm:px-6">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
        <div className="relative min-w-0 flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="search"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Buscar por nombre, email, teléfono, rol, notas…"
            className="w-full rounded-lg border border-slate-300 bg-white py-2.5 pl-10 pr-4 text-sm text-slate-900 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
          />
        </div>
        <p className="shrink-0 text-sm text-slate-500">
          {resultCount === totalCount
            ? `${totalCount} trabajador${totalCount !== 1 ? 'es' : ''}`
            : `${resultCount} de ${totalCount}`}
        </p>
      </div>
      <div className="flex flex-wrap gap-2">
        {FILTERS.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => onFilterChange(item.id)}
            className={`rounded-full px-3 py-1 text-xs font-semibold transition ${
              filter === item.id
                ? 'bg-emerald-600 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>
    </div>
  );
}
