import {
  Building2,
  Calendar,
  FileSpreadsheet,
  MessageSquare,
  Palette,
  Table2,
  Users,
  GitBranch,
} from 'lucide-react';
import { SectionHeading } from '@/components/ui/SectionHeading';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { features } from '@/lib/copy';
import {
  GESTION_OPTIONS_ALQUILER,
  GESTION_OPTIONS_VENTA,
} from '@/lib/gestion-colors';
import { cn } from '@/lib/utils';

const icons = [
  GitBranch,
  Table2,
  FileSpreadsheet,
  Palette,
  MessageSquare,
  Calendar,
  Users,
  Building2,
];

function PipelineVisual() {
  return (
    <div className="grid grid-cols-2 gap-3">
      <div className="rounded-lg border-2 border-emerald-600 bg-emerald-50 p-4 text-center">
        <p className="text-xs font-semibold uppercase text-emerald-700">Alquiler</p>
        <p className="mt-1 text-sm text-emerald-900">Casas · Clientes · Gestión</p>
      </div>
      <div className="rounded-lg border-2 border-blue-600 bg-blue-50 p-4 text-center">
        <p className="text-xs font-semibold uppercase text-blue-700">Venta</p>
        <p className="mt-1 text-sm text-blue-900">Casas · Clientes · Gestión</p>
      </div>
    </div>
  );
}

function GestionSwatches() {
  return (
    <div className="space-y-3">
      <p className="text-xs font-semibold text-slate-500">Alquiler</p>
      <div className="flex flex-wrap gap-1">
        {GESTION_OPTIONS_ALQUILER.slice(0, 5).map((opt) => (
          <span
            key={opt.label}
            className="rounded px-1.5 py-0.5 text-[9px] font-semibold leading-tight"
            style={{ backgroundColor: opt.backgroundColor, color: opt.textColor }}
          >
            {opt.label.length > 12 ? opt.label.slice(0, 10) + '…' : opt.label}
          </span>
        ))}
      </div>
      <p className="text-xs font-semibold text-slate-500">Venta</p>
      <div className="flex flex-wrap gap-1">
        {GESTION_OPTIONS_VENTA.slice(0, 5).map((opt) => (
          <span
            key={opt.label}
            className="rounded px-1.5 py-0.5 text-[9px] font-semibold leading-tight"
            style={{ backgroundColor: opt.backgroundColor, color: opt.textColor }}
          >
            {opt.label.length > 12 ? opt.label.slice(0, 10) + '…' : opt.label}
          </span>
        ))}
      </div>
    </div>
  );
}

function ImportVisual() {
  const columns = ['Origen', 'Ref. cliente', 'Email', 'Teléfono', 'Mensaje', 'Fecha'];
  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
      <p className="mb-2 text-xs font-semibold text-slate-600">Mapeo automático Idealista</p>
      <div className="flex flex-wrap gap-1.5">
        {columns.map((col) => (
          <span
            key={col}
            className="rounded bg-white px-2 py-1 text-[10px] font-medium text-slate-700 shadow-sm"
          >
            {col}
          </span>
        ))}
      </div>
    </div>
  );
}

function FeatureVisual({ index }: { index: number }) {
  if (index === 0) return <PipelineVisual />;
  if (index === 3) return <GestionSwatches />;
  if (index === 2) return <ImportVisual />;
  return null;
}

export function FeaturesSection() {
  return (
    <section id="funcionalidades" className="bg-slate-50 py-16 sm:py-20 scroll-mt-16">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <SectionHeading title={features.title} subtitle={features.subtitle} />
        <div className="mt-16 space-y-20">
          {features.items.map((feature, i) => {
            const Icon = icons[i];
            const reversed = i % 2 === 1;
            const hasVisual = i === 0 || i === 2 || i === 3;

            return (
              <div
                key={feature.title}
                className={cn(
                  'grid items-center gap-8 lg:grid-cols-2',
                  reversed && 'lg:[&>div:first-child]:order-2',
                )}
              >
                <div>
                  <div className="mb-3 flex flex-wrap items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700">
                      <Icon className="h-5 w-5" />
                    </div>
                    <StatusBadge status={feature.status} />
                  </div>
                  <h3 className="text-xl font-bold text-slate-900">{feature.title}</h3>
                  <p className="mt-3 leading-relaxed text-slate-600">{feature.description}</p>
                  {'roadmap' in feature && feature.roadmap ? (
                    <p className="mt-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
                      {feature.roadmap}
                    </p>
                  ) : null}
                </div>
                {hasVisual ? (
                  <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                    <FeatureVisual index={i} />
                  </div>
                ) : (
                  <div className="hidden lg:block" />
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
