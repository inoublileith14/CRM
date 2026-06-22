'use client';

import { Suspense } from 'react';
import { CalendarSettings } from '@/components/CalendarSettings';
import { useLanguage } from '@/contexts/LanguageContext';
import { Locale } from '@/lib/i18n/messages';

export default function SettingsPage() {
  const { locale, setLocale, t } = useLanguage();

  const options: { id: Locale; label: string }[] = [
    { id: 'es', label: 'Español' },
    { id: 'en', label: 'English' },
  ];

  return (
    <div>
      <div className="mb-6 sm:mb-8">
        <h1 className="text-xl font-bold text-slate-900 sm:text-2xl">{t('settings.title')}</h1>
        <p className="mt-1 text-slate-500">{t('settings.subtitle')}</p>
      </div>

      <div className="w-full max-w-2xl rounded-xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <h2 className="text-sm font-semibold text-slate-900">
          {t('settings.language')}
        </h2>
        <p className="mt-1 text-sm text-slate-500">{t('settings.languageHint')}</p>

        <div className="mt-4 flex flex-wrap gap-2">
          {options.map((option) => (
            <button
              key={option.id}
              type="button"
              onClick={() => setLocale(option.id)}
              className={`rounded-lg border px-4 py-2.5 text-sm font-semibold transition ${
                locale === option.id
                  ? 'border-emerald-600 bg-emerald-50 text-emerald-700'
                  : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50'
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      <Suspense fallback={null}>
        <CalendarSettings />
      </Suspense>
    </div>
  );
}
