import { ChevronDown } from 'lucide-react';
import { SectionHeading } from '@/components/ui/SectionHeading';
import { faq } from '@/lib/copy';

export function FaqSection() {
  return (
    <section id="faq" className="bg-white py-16 sm:py-20 scroll-mt-16">
      <div className="mx-auto max-w-3xl px-4 sm:px-6">
        <SectionHeading title={faq.title} />
        <div className="mt-12 divide-y divide-slate-200 border-y border-slate-200">
          {faq.items.map((item) => (
            <details key={item.question} className="group py-4">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-semibold text-slate-900 marker:content-none [&::-webkit-details-marker]:hidden">
                {item.question}
                <ChevronDown className="h-5 w-5 shrink-0 text-slate-400 transition group-open:rotate-180" />
              </summary>
              <p className="mt-3 text-sm leading-relaxed text-slate-600">{item.answer}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
