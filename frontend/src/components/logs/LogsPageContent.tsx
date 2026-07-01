'use client';

import { ScrollText } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

export function LogsPageContent() {
  const { t } = useLanguage();

  return (
    <div>
      <div className="mb-6 sm:mb-8">
        <h1 className="text-xl font-bold text-slate-900 sm:text-2xl">
          {t('logs.title')}
        </h1>
        <p className="mt-1 text-slate-500">{t('logs.subtitle')}</p>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-10 text-center shadow-sm">
        <ScrollText
          className="mx-auto h-10 w-10 text-slate-300"
          aria-hidden
        />
        <p className="mt-4 text-sm text-slate-500">{t('logs.empty')}</p>
      </div>
    </div>
  );
}
