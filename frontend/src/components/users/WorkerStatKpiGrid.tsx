'use client';

import {
  BarChart3,
  CalendarCheck,
  Clock,
  Home,
  TrendingUp,
  UserCheck,
  Users,
} from 'lucide-react';
import type { WorkerKpi } from '@/lib/worker-analytics';

const KPI_META: Record<
  WorkerKpi['tone'],
  { icon: typeof Users; bg: string }
> = {
  blue: { icon: Users, bg: 'bg-blue-500' },
  violet: { icon: TrendingUp, bg: 'bg-violet-500' },
  emerald: { icon: CalendarCheck, bg: 'bg-emerald-500' },
  amber: { icon: Home, bg: 'bg-amber-500' },
  rose: { icon: Clock, bg: 'bg-rose-500' },
  cyan: { icon: BarChart3, bg: 'bg-cyan-500' },
  indigo: { icon: UserCheck, bg: 'bg-indigo-500' },
  slate: { icon: Users, bg: 'bg-slate-500' },
};

export function WorkerStatKpiGrid({ kpis }: { kpis: WorkerKpi[] }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4 2xl:grid-cols-8">
      {kpis.map((kpi) => {
        const meta = KPI_META[kpi.tone];
        const Icon = meta.icon;
        return (
          <div
            key={kpi.label}
            className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition hover:shadow-md"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="truncate text-xs font-medium text-slate-500 sm:text-sm">
                  {kpi.label}
                </p>
                <p className="mt-1 text-2xl font-bold tracking-tight text-slate-900">
                  {kpi.value}
                </p>
                <p className="mt-1 truncate text-xs text-slate-400">{kpi.hint}</p>
              </div>
              <div
                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${meta.bg} text-white shadow-sm`}
              >
                <Icon className="h-5 w-5" />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export function PipelineHealthBar({
  items,
}: {
  items: { label: string; percent: number; color: string }[];
}) {
  return (
    <div className="space-y-4">
      {items.map((item) => (
        <div key={item.label}>
          <div className="mb-1.5 flex items-center justify-between text-sm">
            <span className="font-medium text-slate-700">{item.label}</span>
            <span className="font-semibold text-slate-900">{item.percent}%</span>
          </div>
          <div className="h-2.5 overflow-hidden rounded-full bg-slate-100">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${item.percent}%`,
                backgroundColor: item.color,
              }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}
