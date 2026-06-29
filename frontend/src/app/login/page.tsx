'use client';

import Link from 'next/link';
import { FormEvent, Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { PasswordInput } from '@/components/PasswordInput';
import { login } from '@/lib/api';
import { saveSupabaseSession } from '@/lib/supabase-session';
import { getAuthHashRedirectPath } from '@/lib/auth-hash-redirect';
import {
  dismissLoginLoading,
  toastLoginError,
  toastLoginLoading,
  toastLoginReason,
  toastLoginSuccess,
  toastValidationError,
  validateLoginForm,
} from '@/lib/login-toasts';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [checkingInvite, setCheckingInvite] = useState(true);

  useEffect(() => {
    const hash = window.location.hash;
    const target = getAuthHashRedirectPath(hash);

    if (target) {
      router.replace(`${target}${hash}`);
      return;
    }

    setCheckingInvite(false);
    const reason = searchParams.get('reason');
    toastLoginReason(reason);
  }, [router, searchParams]);

  if (checkingInvite) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-emerald-900 text-slate-400">
        Cargando…
      </div>
    );
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();

    const validationError = validateLoginForm(email, password);
    if (validationError) {
      toastValidationError(validationError);
      return;
    }

    setLoading(true);
    toastLoginLoading();

    try {
      const result = await login(email, password);
      if (result.supabase_session) {
        saveSupabaseSession(result.supabase_session);
      }
      dismissLoginLoading();
      toastLoginSuccess(result.user.nombre || result.user.email);
      router.push('/dashboard');
      router.refresh();
    } catch (error) {
      dismissLoginLoading();
      toastLoginError(error);
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-emerald-900 px-4">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <p className="text-sm font-semibold uppercase tracking-widest text-emerald-400">
            COCOUNT LUXURY FLATS 
          </p>
          <h1 className="mt-2 text-3xl font-bold text-white">
            Iniciar sesión
          </h1>
          <p className="mt-2 text-slate-400">
            Accede al panel de gestión inmobiliaria
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="rounded-2xl border border-slate-700 bg-slate-800/80 p-6 shadow-2xl backdrop-blur sm:p-8"
        >
          <div className="space-y-5">
            <div>
              <label
                htmlFor="email"
                className="mb-1.5 block text-sm font-medium text-slate-300"
              >
                Correo electrónico
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                disabled={loading}
                className="w-full rounded-lg border border-slate-600 bg-slate-900 px-4 py-2.5 text-white placeholder-slate-500 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 disabled:opacity-60"
                placeholder="tu@correo.com"
              />
            </div>

            <div>
              <div className="mb-1.5 flex items-center justify-between">
                <label
                  htmlFor="password"
                  className="block text-sm font-medium text-slate-300"
                >
                  Contraseña
                </label>
                <Link
                  href="/recuperar-contraseña"
                  className="text-xs text-emerald-400 hover:text-emerald-300"
                >
                  ¿Olvidaste tu contraseña?
                </Link>
              </div>
              <PasswordInput
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
                disabled={loading}
                placeholder="••••••••"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="mt-6 w-full rounded-lg bg-emerald-600 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? 'Entrando…' : 'Entrar'}
          </button>
        </form>


      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
