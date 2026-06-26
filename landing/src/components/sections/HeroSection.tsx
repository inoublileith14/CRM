import { BrowserFrame } from '@/components/ui/BrowserFrame';
import { ProductTableMock } from '@/components/ui/ProductTableMock';
import { getHero, nav } from '@/lib/copy';

export function HeroSection() {
  const hero = getHero();
  return (
    <section className="bg-gradient-to-br from-slate-900 via-slate-800 to-emerald-900 text-white">
      <div className="mx-auto grid max-w-6xl items-center gap-10 px-4 py-16 sm:px-6 lg:grid-cols-2 lg:py-24">
        <div>
          <span className="mb-4 inline-flex rounded-full bg-amber-500/20 px-3 py-1 text-xs font-semibold text-amber-300">
            {nav.earlyAccess}
          </span>
          <h1 className="text-3xl font-bold leading-tight tracking-tight sm:text-4xl lg:text-5xl">
            {hero.headline}
          </h1>
          <p className="mt-5 text-lg leading-relaxed text-slate-300">
            {hero.subheadline}
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <a
              href="#demo"
              className="rounded-lg bg-emerald-600 px-6 py-3 text-center font-semibold text-white transition hover:bg-emerald-500"
            >
              {hero.primaryCta}
            </a>
            <a
              href="#como-funciona"
              className="rounded-lg border border-slate-500 px-6 py-3 text-center font-semibold text-white transition hover:border-slate-400 hover:bg-white/5"
            >
              {hero.secondaryCta}
            </a>
          </div>
          <p className="mt-8 text-sm text-slate-400">{hero.socialProof}</p>
        </div>
        <div className="lg:justify-self-end">
          <BrowserFrame>
            <ProductTableMock />
          </BrowserFrame>
          <p className="mt-3 text-center text-xs text-slate-400 lg:text-left">
            Tabla de clientes vinculados a un inmueble — estados con color y fecha
            de última gestión.
          </p>
        </div>
      </div>
    </section>
  );
}
