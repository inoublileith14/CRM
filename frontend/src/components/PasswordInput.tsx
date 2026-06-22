'use client';

import { useState, type InputHTMLAttributes } from 'react';
import { Eye, EyeOff } from 'lucide-react';

const variantClasses = {
  dark: 'w-full rounded-lg border border-slate-600 bg-slate-900 px-4 py-2.5 pr-11 text-white placeholder-slate-500 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 disabled:opacity-60',
  light:
    'w-full rounded-lg border border-slate-300 bg-white px-4 py-2.5 pr-11 text-slate-900 placeholder-slate-400 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 disabled:opacity-60',
} as const;

const toggleClasses = {
  dark: 'text-slate-400 hover:text-slate-200',
  light: 'text-slate-400 hover:text-slate-600',
} as const;

interface PasswordInputProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  variant?: keyof typeof variantClasses;
}

export function PasswordInput({
  variant = 'dark',
  className = '',
  disabled,
  ...props
}: PasswordInputProps) {
  const [visible, setVisible] = useState(false);

  return (
    <div className="relative">
      <input
        {...props}
        type={visible ? 'text' : 'password'}
        disabled={disabled}
        className={`${variantClasses[variant]} ${className}`.trim()}
      />
      <button
        type="button"
        tabIndex={-1}
        onClick={() => setVisible((show) => !show)}
        disabled={disabled}
        aria-label={visible ? 'Ocultar contraseña' : 'Mostrar contraseña'}
        className={`absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1.5 transition disabled:opacity-40 ${toggleClasses[variant]}`}
      >
        {visible ? (
          <EyeOff className="h-4 w-4" aria-hidden />
        ) : (
          <Eye className="h-4 w-4" aria-hidden />
        )}
      </button>
    </div>
  );
}
