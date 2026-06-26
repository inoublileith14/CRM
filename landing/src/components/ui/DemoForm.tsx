'use client';

import { FormEvent, useState } from 'react';
import { toast } from 'sonner';
import { finalCta } from '@/lib/copy';

const OPERATION_OPTIONS = [
  { value: 'alquiler', label: 'Alquiler' },
  { value: 'venta', label: 'Venta' },
  { value: 'ambos', label: 'Ambos' },
] as const;

const inputClass =
  'w-full rounded-lg border border-slate-600 bg-slate-800 px-4 py-2.5 text-white placeholder:text-slate-500 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20';

export function DemoForm() {
  const [loading, setLoading] = useState(false);

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const data = new FormData(form);

    const nombre = String(data.get('nombre') ?? '').trim();
    const email = String(data.get('email') ?? '').trim();
    const inmobiliaria = String(data.get('inmobiliaria') ?? '').trim();
    const telefono = String(data.get('telefono') ?? '').trim();
    const operacion = String(data.get('operacion') ?? '').trim();

    if (!nombre || !email || !inmobiliaria || !telefono || !operacion) {
      toast.error('Completa los campos obligatorios.');
      return;
    }

    if (!email.includes('@')) {
      toast.error('Introduce un email válido.');
      return;
    }

    setLoading(true);
    setTimeout(() => {
      toast.success(finalCta.toastSuccess);
      form.reset();
      setLoading(false);
    }, 400);
  }

  return (
    <form onSubmit={handleSubmit} className="mx-auto max-w-xl space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="nombre" className="mb-1.5 block text-sm text-slate-300">
            Nombre *
          </label>
          <input id="nombre" name="nombre" type="text" required className={inputClass} />
        </div>
        <div>
          <label htmlFor="email" className="mb-1.5 block text-sm text-slate-300">
            Email *
          </label>
          <input id="email" name="email" type="email" required className={inputClass} />
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="inmobiliaria" className="mb-1.5 block text-sm text-slate-300">
            Nombre inmobiliaria *
          </label>
          <input
            id="inmobiliaria"
            name="inmobiliaria"
            type="text"
            required
            className={inputClass}
          />
        </div>
        <div>
          <label htmlFor="telefono" className="mb-1.5 block text-sm text-slate-300">
            Teléfono *
          </label>
          <input id="telefono" name="telefono" type="tel" required className={inputClass} />
        </div>
      </div>
      <div>
        <label htmlFor="operacion" className="mb-1.5 block text-sm text-slate-300">
          ¿Alquiler, venta o ambos? *
        </label>
        <select id="operacion" name="operacion" required className={inputClass} defaultValue="">
          <option value="" disabled>
            Selecciona una opción
          </option>
          {OPERATION_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label htmlFor="mensaje" className="mb-1.5 block text-sm text-slate-300">
          Mensaje (opcional)
        </label>
        <textarea
          id="mensaje"
          name="mensaje"
          rows={3}
          className={inputClass}
          placeholder="Cuéntanos sobre tu inmobiliaria…"
        />
      </div>
      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-lg bg-emerald-600 py-3 font-semibold text-white transition hover:bg-emerald-500 disabled:opacity-60"
      >
        {loading ? 'Enviando…' : finalCta.submit}
      </button>
    </form>
  );
}
