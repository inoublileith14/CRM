'use client';

import Link from 'next/link';
import { FormEvent, Suspense, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { PasswordInput } from '@/components/PasswordInput';
import { resetPassword } from '@/lib/api';
import { toast } from 'sonner';

function AceptarInvitacionForm() {
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

    if (accessToken && refreshToken && (type === 'invite' || type === 'signup')) {
      setTokens({ accessToken, refreshToken });
      window.history.replaceState(null, '', window.location.pathname);
    } else {
      setInvalidLink(true);
      toast.error(
        'Enlace de invitación no válido o expirado. Pide al administrador que reenvíe la invitación',
      );
    }
  }, []);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();

    if (!tokens) {
      toast.error('Enlace de invitación no válido');
      return;
    }

    if (password.length < 4) {
      toast.error('La contraseña debe tener al menos 4 caracteres');
      return;
    }

    if (password !== confirmPassword) {
      toast.error('Las contraseñas no coinciden');
      return;
    }

    setLoading(true);

    try {
      const { mensaje } = await resetPassword(
        tokens.accessToken,
        tokens.refreshToken,
        password,
      );
      toast.success(mensaje);
      setTimeout(() => router.push('/login'), 1500);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'No se pudo activar la cuenta',
      );
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
          href="/login"
          className="mt-4 inline-block text-sm font-medium text-emerald-400 hover:text-emerald-300"
        >
          Ir al inicio de sesión
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
          Contraseña
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
        {loading ? 'Activando cuenta…' : 'Activar cuenta'}
      </button>
    </form>
  );
}

export default function AceptarInvitacionPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-emerald-900 px-4">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <p className="text-sm font-semibold uppercase tracking-widest text-emerald-400">
            Coconut
          </p>
          <h1 className="mt-2 text-3xl font-bold text-white">
            Aceptar invitación
          </h1>
          <p className="mt-2 text-slate-400">
            Crea tu contraseña para acceder a la aplicación
          </p>
        </div>

        <div className="rounded-2xl border border-slate-700 bg-slate-800/80 p-6 shadow-2xl backdrop-blur sm:p-8">
          <Suspense>
            <AceptarInvitacionForm />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
