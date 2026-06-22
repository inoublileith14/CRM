import { Users, Building2, TrendingUp, Home } from 'lucide-react';
import { clientes, propietarios } from '@/data/fake-data';

const stats = [
  {
    label: 'Clientes totales',
    value: clientes.length,
    icon: Users,
    color: 'bg-blue-500',
  },
  {
    label: 'Propietarios',
    value: propietarios.length,
    icon: Building2,
    color: 'bg-emerald-500',
  },
  {
    label: 'Inmuebles gestionados',
    value: propietarios.reduce((sum, p) => sum + p.inmuebles, 0),
    icon: Home,
    color: 'bg-violet-500',
  },
  {
    label: 'Clientes activos',
    value: clientes.filter((c) => c.estado === 'activo').length,
    icon: TrendingUp,
    color: 'bg-amber-500',
  },
];

export default function DashboardPage() {
  return (
    <div>
      <header className="mb-6 sm:mb-8">
        <h1 className="text-xl font-bold text-slate-900 sm:text-2xl">Panel principal</h1>
        <p className="mt-1 text-slate-500">
          Resumen general de tu gestión inmobiliaria
        </p>
      </header>

      <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map(({ label, value, icon: Icon, color }) => (
          <div
            key={label}
            className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">{label}</p>
                <p className="mt-1 text-3xl font-bold text-slate-900">
                  {value}
                </p>
              </div>
              <div
                className={`flex h-12 w-12 items-center justify-center rounded-xl ${color} text-white`}
              >
                <Icon className="h-6 w-6" />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold text-slate-900">
            Últimos clientes
          </h2>
          <ul className="divide-y divide-slate-100">
            {clientes.slice(0, 4).map((cliente) => (
              <li
                key={cliente.id}
                className="flex items-center justify-between gap-3 py-3"
              >
                <div className="min-w-0">
                  <p className="truncate font-medium text-slate-900">{cliente.nombre}</p>
                  <p className="truncate text-sm text-slate-500">{cliente.ciudad}</p>
                </div>
                <span className="hidden shrink-0 text-sm text-slate-400 sm:inline">{cliente.id}</span>
              </li>
            ))}
          </ul>
        </section>

        <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold text-slate-900">
            Propietarios destacados
          </h2>
          <ul className="divide-y divide-slate-100">
            {propietarios.slice(0, 4).map((prop) => (
              <li
                key={prop.id}
                className="flex items-center justify-between gap-3 py-3"
              >
                <div className="min-w-0">
                  <p className="truncate font-medium text-slate-900">{prop.nombre}</p>
                  <p className="text-sm text-slate-500">
                    {prop.inmuebles} inmueble{prop.inmuebles !== 1 ? 's' : ''}
                  </p>
                </div>
                <span className="text-sm font-medium text-emerald-600">
                  {prop.ingresosMensuales}
                </span>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}
