'use client';

import Link from 'next/link';
import { FormEvent, Suspense, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { PasswordInput } from '@/components/PasswordInput';
import { resetPassword } from '@/lib/api';
import {
  dismissResetLoading,
  toastResetError,
  toastResetLoading,
  toastResetSuccess,
  toastResetValidation,
} from '@/lib/reset-toasts';

function RestablecerForm() {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [tokens, setTokens] = useState<{
    accessToken: string;
    refreshToken: string;
  } | null>(null);
  const [invalidLink, setInvalidLink] = useState(false);

  useEffect(() => {
    const hash = window.location.hash.substring(1);
    const params = new URLSearchParams(hash);
    const accessToken = params.get('access_token');
    const refreshToken = params.get('refresh_token');
    const type = params.get('type');

    if (accessToken && refreshToken && type === 'recovery') {
      setTokens({ accessToken, refreshToken });
      window.history.replaceState(null, '', window.location.pathname);
    } else {
      setInvalidLink(true);
      toastResetValidation(
        'Enlace no válido o expirado. Solicita uno nuevo desde recuperar contraseña',
      );
    }
  }, []);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();

    if (!tokens) {
      toastResetValidation('Enlace de recuperación no válido');
      return;
    }

    if (password.length < 4) {
      toastResetValidation('La contraseña debe tener al menos 4 caracteres');
      return;
    }

    if (password !== confirmPassword) {
      toastResetValidation('Las contraseñas no coinciden');
      return;
    }

    setLoading(true);
    toastResetLoading('Actualizando contraseña…');

    try {
      const { mensaje } = await resetPassword(
        tokens.accessToken,
        tokens.refreshToken,
        password,
      );
      dismissResetLoading();
      toastResetSuccess(mensaje);
      setTimeout(() => router.push('/login'), 1500);
    } catch (error) {
      dismissResetLoading();
      toastResetError(error);
      setLoading(false);
    }
  }

  if (invalidLink) {
    return (
      <div className="text-center">
        <p className="text-slate-300">
          Este enlace no es válido o ha expirado.
        </p>
        <Link
          href="/recuperar-contraseña"
          className="mt-4 inline-block text-sm font-medium text-emerald-400 hover:text-emerald-300"
        >
          Solicitar nuevo enlace
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <label
          htmlFor="password"
          className="mb-1.5 block text-sm font-medium text-slate-300"
        >
          Nueva contraseña
        </label>
        <PasswordInput
          id="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          disabled={loading || !tokens}
          autoComplete="new-password"
          placeholder="••••••••"
        />
      </div>

      <div>
        <label
          htmlFor="confirmPassword"
          className="mb-1.5 block text-sm font-medium text-slate-300"
        >
          Confirmar contraseña
        </label>
        <PasswordInput
          id="confirmPassword"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          required
          disabled={loading || !tokens}
          autoComplete="new-password"
          placeholder="••••••••"
        />
      </div>

      <button
        type="submit"
        disabled={loading || !tokens}
        className="w-full rounded-lg bg-emerald-600 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {loading ? 'Guardando…' : 'Restablecer contraseña'}
      </button>
    </form>
  );
}

export default function RestablecerContrasenaPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-emerald-900 px-4">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <p className="text-sm font-semibold uppercase tracking-widest text-emerald-400">
            Coconut
          </p>
          <h1 className="mt-2 text-3xl font-bold text-white">
            Nueva contraseña
          </h1>
          <p className="mt-2 text-slate-400">
            Elige una contraseña segura para tu cuenta
          </p>
        </div>

        <div className="rounded-2xl border border-slate-700 bg-slate-800/80 p-6 shadow-2xl backdrop-blur sm:p-8">
          <Suspense>
            <RestablecerForm />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
