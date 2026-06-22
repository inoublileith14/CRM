'use client';

import { ProfileAvatarUpload } from '@/components/ProfileAvatarUpload';
import { useCurrentUser } from '@/contexts/CurrentUserContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { MessageKey } from '@/lib/i18n/messages';

function roleLabel(rol: string, t: (key: MessageKey) => string): string {
  if (rol === 'admin') return t('role.admin');
  if (rol === 'asesor' || rol === 'usuario') return t('role.asesor');
  return rol;
}

export default function ProfilePage() {
  const { user, loading } = useCurrentUser();
  const { t } = useLanguage();

  if (loading) {
    return <div className="py-12 text-center text-slate-500">…</div>;
  }

  if (!user) {
    return <div className="py-12 text-center text-slate-500">—</div>;
  }

  const fields = [
    { label: t('profile.name'), value: user.nombre },
    { label: t('profile.email'), value: user.email },
    { label: t('profile.role'), value: roleLabel(user.rol, t) },
  ];

  return (
    <div>
      <div className="mb-6 sm:mb-8">
        <h1 className="text-xl font-bold text-slate-900 sm:text-2xl">{t('profile.title')}</h1>
        <p className="mt-1 text-slate-500">{t('profile.subtitle')}</p>
      </div>

      <div className="w-full rounded-xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <div className="mb-8 border-b border-slate-100 pb-8">
          <ProfileAvatarUpload />
        </div>

        <dl className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {fields.map((field) => (
            <div key={field.label}>
              <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                {field.label}
              </dt>
              <dd className="mt-1 text-sm font-medium text-slate-900">
                {field.value}
              </dd>
            </div>
          ))}
        </dl>
      </div>
    </div>
  );
}
