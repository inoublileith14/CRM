import { PricingCard } from '@/components/ui/PricingCard';
import { SectionHeading } from '@/components/ui/SectionHeading';
import { pricing } from '@/lib/copy';

export function PricingSection() {
  return (
    <section id="precios" className="bg-white py-16 sm:py-20 scroll-mt-16">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <SectionHeading title={pricing.title} subtitle={pricing.subtitle} />
        <div className="mt-12 grid gap-8 lg:grid-cols-3">
          {pricing.tiers.map((tier) => (
            <PricingCard
              key={tier.name}
              name={tier.name}
              price={tier.price}
              description={tier.description}
              features={tier.features}
              cta={tier.cta}
              highlighted={tier.highlighted}
              badge={'badge' in tier ? tier.badge : undefined}
              comingSoon={'comingSoon' in tier ? tier.comingSoon : undefined}
            />
          ))}
        </div>
        <p className="mt-10 text-center text-sm text-slate-500">
          {pricing.enterpriseNote}
        </p>
      </div>
    </section>
  );
}
