import { Lock, Server, Shield, ShieldCheck, XCircle } from 'lucide-react';
import { SectionHeading } from '@/components/ui/SectionHeading';
import { trust } from '@/lib/copy';

const icons = [Server, Lock, Shield, ShieldCheck, XCircle];

export function TrustSection() {
  return (
    <section className="bg-slate-50 py-16 sm:py-20">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <SectionHeading title={trust.title} />
        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {trust.items.map((item, i) => {
            const Icon = icons[i];
            return (
              <div
                key={item.title}
                className="flex gap-4 rounded-xl border border-slate-200 bg-white p-6"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-700">
                  <Icon className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900">{item.title}</h3>
                  <p className="mt-1 text-sm text-slate-600">{item.description}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
