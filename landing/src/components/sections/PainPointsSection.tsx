import { FileSpreadsheet, MessageSquare, Users, Workflow } from 'lucide-react';
import { SectionHeading } from '@/components/ui/SectionHeading';
import { painPoints } from '@/lib/copy';

const icons = [FileSpreadsheet, Workflow, MessageSquare, Users];

export function PainPointsSection() {
  return (
    <section className="bg-white py-16 sm:py-20">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <SectionHeading title={painPoints.title} />
        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {painPoints.items.map((item, i) => {
            const Icon = icons[i];
            return (
              <div
                key={item.title}
                className="rounded-xl border border-slate-200 bg-slate-50 p-6"
              >
                <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-slate-200 text-slate-700">
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="font-semibold text-slate-900">{item.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-600">
                  {item.description}
                </p>
              </div>
            );
          })}
        </div>
        <blockquote className="mx-auto mt-12 max-w-3xl border-l-4 border-emerald-600 pl-6 text-lg italic text-slate-700">
          {painPoints.transition}
        </blockquote>
      </div>
    </section>
  );
}
