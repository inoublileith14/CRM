'use client';

import { Search } from 'lucide-react';
import { UserListFilter } from '@/lib/user-search';

const FILTERS: { id: UserListFilter; label: string }[] = [
  { id: 'all', label: 'Todos' },
  { id: 'inactivo', label: 'Inactivos' },
  { id: 'sin_cuenta', label: 'Sin cuenta' },
];

interface UserListToolbarProps {
  search: string;
  onSearchChange: (value: string) => void;
  filter: UserListFilter;
  onFilterChange: (filter: UserListFilter) => void;
  resultCount: number;
  totalCount: number;
  entityLabel: string;
}

export function UserListToolbar({
  search,
  onSearchChange,
  filter,
  onFilterChange,
  resultCount,
  totalCount,
  entityLabel,
}: UserListToolbarProps) {
  return (
    <div className="space-y-4 border-b border-slate-200/80 bg-gradient-to-b from-slate-50/80 to-white px-4 py-4 sm:px-6">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
        <div className="relative min-w-0 flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="search"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Buscar por nombre, email, teléfono o notas…"
            className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-4 text-sm text-slate-900 shadow-sm outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
          />
        </div>
        <p className="shrink-0 text-sm text-slate-500">
          {resultCount === totalCount
            ? `${totalCount} ${entityLabel}`
            : `${resultCount} de ${totalCount}`}
        </p>
      </div>
      <div className="flex flex-wrap gap-2">
        {FILTERS.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => onFilterChange(item.id)}
            className={`rounded-full px-3.5 py-1.5 text-xs font-semibold transition ${
              filter === item.id
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50'
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>
    </div>
  );
}
