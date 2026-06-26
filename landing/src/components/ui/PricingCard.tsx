import Link from 'next/link';
import { cn } from '@/lib/utils';

interface PricingCardProps {
  name: string;
  price: string;
  description: string;
  features: string[];
  cta: string;
  highlighted?: boolean;
  badge?: string;
  comingSoon?: string;
}

export function PricingCard({
  name,
  price,
  description,
  features,
  cta,
  highlighted = false,
  badge,
  comingSoon,
}: PricingCardProps) {
  return (
    <div
      className={cn(
        'relative flex flex-col rounded-xl border bg-white p-6 shadow-sm',
        highlighted
          ? 'border-emerald-600 ring-2 ring-emerald-600'
          : 'border-slate-200',
      )}
    >
      {badge ? (
        <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-emerald-600 px-3 py-0.5 text-xs font-semibold text-white">
          {badge}
        </span>
      ) : null}
      <h3 className="text-lg font-semibold text-slate-900">{name}</h3>
      <p className="mt-1 text-sm text-slate-500">{description}</p>
      <div className="mt-4 flex items-baseline gap-1">
        <span className="text-4xl font-bold text-slate-900">€{price}</span>
        <span className="text-slate-500">/mes</span>
      </div>
      <ul className="mt-6 flex-1 space-y-3 text-sm text-slate-600">
        {features.map((feature) => (
          <li key={feature} className="flex items-start gap-2">
            <span className="mt-0.5 text-emerald-600">✓</span>
            <span className="flex flex-wrap items-center gap-2">
              {feature}
              {comingSoon && feature.includes(comingSoon) ? (
                <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-medium text-amber-800">
                  Coming soon
                </span>
              ) : null}
            </span>
          </li>
        ))}
      </ul>
      <Link
        href="#demo"
        className={cn(
          'mt-8 block rounded-lg py-2.5 text-center font-semibold transition',
          highlighted
            ? 'bg-emerald-600 text-white hover:bg-emerald-500'
            : 'border border-slate-300 text-slate-700 hover:border-emerald-600 hover:text-emerald-700',
        )}
      >
        {cta}
      </Link>
    </div>
  );
}
