import { SectionHeading } from '@/components/ui/SectionHeading';
import { howItWorks } from '@/lib/copy';

export function HowItWorksSection() {
  return (
    <section id="como-funciona" className="bg-white py-16 sm:py-20 scroll-mt-16">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <SectionHeading title={howItWorks.title} subtitle={howItWorks.subtitle} />
        <div className="relative mt-14">
          <div
            className="absolute left-5 top-8 hidden h-[calc(100%-4rem)] w-0.5 bg-emerald-200 lg:left-1/2 lg:block lg:-translate-x-px"
            aria-hidden
          />
          <ol className="grid gap-10 lg:grid-cols-4 lg:gap-6">
            {howItWorks.steps.map((step, i) => (
              <li key={step.title} className="relative">
                <div className="flex gap-4 lg:flex-col lg:items-center lg:text-center">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-sm font-bold text-white lg:mx-auto">
                    {i + 1}
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-900">{step.title}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-slate-600">
                      {step.description}
                    </p>
                  </div>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}
