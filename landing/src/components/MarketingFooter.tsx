import Link from 'next/link';
import { footer } from '@/lib/copy';

export function MarketingFooter() {
  return (
    <footer className="border-t border-slate-200 bg-slate-50">
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
        <div className="flex flex-col items-center justify-between gap-6 sm:flex-row">
          <div className="text-center sm:text-left">
            <p className="font-semibold text-slate-900">Cocount</p>
            <p className="mt-1 text-sm text-slate-500">{footer.copyright}</p>
            <p className="mt-1 text-sm text-slate-500">
              {footer.madeIn} · <span aria-hidden>🇪🇸</span>
            </p>
          </div>
          <div className="flex flex-wrap justify-center gap-4 text-sm">
            {footer.links.map((link) => (
              <Link
                key={link.label}
                href={link.href}
                className="text-slate-600 hover:text-emerald-700"
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>
        <div className="mt-8 flex flex-col items-center justify-between gap-4 border-t border-slate-200 pt-8 text-sm text-slate-500 sm:flex-row">
          <a href={`mailto:${footer.email}`} className="hover:text-emerald-700">
            {footer.email}
          </a>
          <div className="flex items-center gap-4">
            <Link href="#" className="hover:text-emerald-700" aria-label="LinkedIn">
              LinkedIn
            </Link>
            <span className="text-slate-300">|</span>
            <button type="button" className="cursor-default text-slate-400" disabled>
              {footer.english}
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
}
