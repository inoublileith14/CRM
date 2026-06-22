'use client';

import Link from 'next/link';
import { FormEvent, useState } from 'react';
import { requestPasswordReset } from '@/lib/api';
import {
  dismissResetLoading,
  toastResetError,
  toastResetLoading,
  toastResetSuccess,
  toastResetValidation,
} from '@/lib/reset-toasts';

export default function RecuperarContrasenaPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();

    const trimmed = email.trim();
    if (!trimmed) {
      toastResetValidation('Introduce tu correo electrónico');
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      toastResetValidation('El formato del correo no es válido');
      return;
    }

    setLoading(true);
    toastResetLoading('Enviando enlace de recuperación…');

    try {
      const { mensaje } = await requestPasswordReset(trimmed);
      dismissResetLoading();
      toastResetSuccess(mensaje);
      setSent(true);
    } catch (error) {
      dismissResetLoading();
      toastResetError(error);
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-emerald-900 px-4">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <p className="text-sm font-semibold uppercase tracking-widest text-emerald-400">
            Coconut
          </p>
          <h1 className="mt-2 text-3xl font-bold text-white">
            Recuperar contraseña
          </h1>
          <p className="mt-2 text-slate-400">
            Te enviaremos un enlace para restablecer tu contraseña
          </p>
        </div>

        <div className="rounded-2xl border border-slate-700 bg-slate-800/80 p-6 shadow-2xl backdrop-blur sm:p-8">
          {sent ? (
            <div className="text-center">
              <p className="text-slate-300">
                Si existe una cuenta con ese correo, recibirás un enlace en
                breve. Revisa también la carpeta de spam.
              </p>
              <Link
                href="/login"
                className="mt-6 inline-block text-sm font-medium text-emerald-400 hover:text-emerald-300"
              >
                Volver al inicio de sesión
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
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
                  disabled={loading}
                  autoComplete="email"
                  className="w-full rounded-lg border border-slate-600 bg-slate-900 px-4 py-2.5 text-white placeholder-slate-500 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 disabled:opacity-60"
                  placeholder="tu@correo.com"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-lg bg-emerald-600 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? 'Enviando…' : 'Enviar enlace'}
              </button>

              <Link
                href="/login"
                className="block text-center text-sm text-slate-400 hover:text-slate-300"
              >
                Volver al inicio de sesión
              </Link>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
