'use client';

import Link from 'next/link';
import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';
import { PasswordInput } from '@/components/PasswordInput';
import { register } from '@/lib/api';
import {
  dismissRegisterLoading,
  toastRegisterError,
  toastRegisterLoading,
  toastRegisterSuccess,
  toastRegisterValidation,
  validateRegisterForm,
} from '@/lib/register-toasts';

export default function RegistroPage() {
  const router = useRouter();
  const [nombre, setNombre] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();

    const validationError = validateRegisterForm(
      nombre,
      email,
      password,
      confirmPassword,
    );

    if (validationError) {
      toastRegisterValidation(validationError);
      return;
    }

    setLoading(true);
    toastRegisterLoading();

    try {
      const { user } = await register(nombre, email, password);
      dismissRegisterLoading();
      toastRegisterSuccess(user.nombre || user.email);
      router.push('/dashboard');
      router.refresh();
    } catch (error) {
      dismissRegisterLoading();
      toastRegisterError(error);
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-emerald-900 px-4 py-10">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <p className="text-sm font-semibold uppercase tracking-widest text-emerald-400">
            Coconut
          </p>
          <h1 className="mt-2 text-3xl font-bold text-white">Crear cuenta</h1>
          <p className="mt-2 text-slate-400">
            Regístrate para acceder al panel de gestión
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="rounded-2xl border border-slate-700 bg-slate-800/80 p-6 shadow-2xl backdrop-blur sm:p-8"
        >
          <div className="space-y-5">
            <div>
              <label
                htmlFor="nombre"
                className="mb-1.5 block text-sm font-medium text-slate-300"
              >
                Nombre completo
              </label>
              <input
                id="nombre"
                type="text"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                required
                disabled={loading}
                autoComplete="name"
                className="w-full rounded-lg border border-slate-600 bg-slate-900 px-4 py-2.5 text-white placeholder-slate-500 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 disabled:opacity-60"
                placeholder="Tu nombre"
              />
            </div>

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
                disabled={loading}
                autoComplete="new-password"
                placeholder="Mínimo 4 caracteres"
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
                disabled={loading}
                autoComplete="new-password"
                placeholder="Repite tu contraseña"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="mt-6 w-full rounded-lg bg-emerald-600 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? 'Creando cuenta…' : 'Registrarse'}
          </button>

          <p className="mt-4 text-center text-sm text-slate-400">
            ¿Ya tienes cuenta?{' '}
            <Link
              href="/login"
              className="font-medium text-emerald-400 hover:text-emerald-300"
            >
              Iniciar sesión
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
