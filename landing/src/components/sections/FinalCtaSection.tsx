import { DemoForm } from '@/components/ui/DemoForm';
import { SectionHeading } from '@/components/ui/SectionHeading';
import { finalCta } from '@/lib/copy';

export function FinalCtaSection() {
  return (
    <section id="demo" className="bg-slate-900 py-16 sm:py-20 scroll-mt-16">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <SectionHeading
          title={finalCta.title}
          subtitle={finalCta.subtitle}
          dark
        />
        <div className="mt-10">
          <DemoForm />
        </div>
      </div>
    </section>
  );
}
