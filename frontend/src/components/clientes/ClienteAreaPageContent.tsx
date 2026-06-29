'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  Calendar,
  Heart,
  MapPin,
  Pencil,
  Phone,
  Plus,
  User,
} from 'lucide-react';
import { QueryRefreshingBadge } from '@/components/QueryRefreshingBadge';
import { StatusBadge } from '@/components/StatusBadge';
import { useClienteQuery, useInmueblesQuery } from '@/hooks/use-dashboard-queries';
import { useQueryUiState } from '@/hooks/use-query-ui';
import { useCurrentUser } from '@/contexts/CurrentUserContext';
import { isAdminUser } from '@/lib/auth-roles';
import { getClienteTipoClienteLabel } from '@/lib/cliente-tipo';
import {
  CLIENTE_SUGGESTION_TOP_N,
  ClienteInmuebleSuggestionService,
} from '@/lib/cliente-inmueble-suggestions';
import { parseRefCliente } from '@/lib/parse-ref-cliente';
import {
  formatInmueblePrecio,
  resolveInmuebleImageSrc,
} from '@/lib/inmueble-table-utils';
import { CLIENTE_ORIGEN_LABELS, Cliente } from '@/types/cliente';
import { TIPO_OPERACION_LABELS, TipoOperacion } from '@/types/inmueble';
import { getWorkerRolLabel } from '@/types/worker';

const AREA_THEMES = {
  alquiler: {
    header: 'bg-emerald-900',
    cardHeader: 'bg-emerald-800',
    accent: 'text-emerald-700',
    accentBg: 'bg-emerald-700 hover:bg-emerald-600',
    pill: 'bg-emerald-100 text-emerald-900',
    border: 'border-emerald-900',
  },
  venta: {
    header: 'bg-blue-900',
    cardHeader: 'bg-blue-900',
    accent: 'text-blue-700',
    accentBg: 'bg-blue-900 hover:bg-blue-800',
    pill: 'bg-blue-100 text-blue-900',
    border: 'border-blue-900',
  },
} as const;

function formatAreaDate(value: string | null | undefined): string {
  if (!value) return '—';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '—';
  return new Intl.DateTimeFormat('es-ES', {
    day: 'numeric',
    month: 'long',
    year: '2-digit',
  }).format(d);
}

function formatBudgetLabel(cliente: Cliente): string {
  const parsed = parseRefCliente(cliente.ref_cliente);
  const raw = cliente.presupuesto_maximo ?? parsed.presupuesto;
  if (!raw?.trim()) return '—';
  const amount = raw.trim();
  return /€|eur/i.test(amount) ? amount : `${amount} €`;
}

function getResolvedTipo(
  cliente: Cliente,
  override: TipoOperacion | null,
): TipoOperacion {
  return override ?? cliente.tipo_operacion ?? 'alquiler';
}

interface ClienteAreaPageContentProps {
  clienteId: string;
  backHref?: string;
  backLabel?: string;
}

export function ClienteAreaPageContent({
  clienteId,
  backHref = '/dashboard/clientes',
  backLabel = 'Volver a clientes',
}: ClienteAreaPageContentProps) {
  const clienteQuery = useClienteQuery(clienteId);
  const { user } = useCurrentUser();
  const canManageWorkers = isAdminUser(user?.rol);
  const {
    data: cliente,
    showInitialLoading,
    isRefreshing,
    showError,
  } = useQueryUiState(clienteQuery);

  const [tipoOverride, setTipoOverride] = useState<TipoOperacion | null>(null);

  const resolvedTipo = cliente ? getResolvedTipo(cliente, tipoOverride) : 'alquiler';
  const theme = AREA_THEMES[resolvedTipo];

  const inmueblesQuery = useInmueblesQuery(
    { tipo_operacion: resolvedTipo },
    { enabled: Boolean(cliente) },
  );
  const inmuebles = inmueblesQuery.data ?? [];

  const suggestions = useMemo(() => {
    if (!cliente) return [];
    return ClienteInmuebleSuggestionService.suggestForCliente(cliente, inmuebles, {
      tipoOperacion: resolvedTipo,
      limit: CLIENTE_SUGGESTION_TOP_N,
    });
  }, [cliente, inmuebles, resolvedTipo]);

  const parsedRef = useMemo(
    () => parseRefCliente(cliente?.ref_cliente),
    [cliente?.ref_cliente],
  );

  if (showInitialLoading) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-12 text-center text-slate-500">
        Cargando área cliente…
      </div>
    );
  }

  if (showError || !cliente) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-center">
        <p className="font-medium text-red-800">No se pudo cargar el cliente</p>
        <button
          type="button"
          onClick={() => clienteQuery.refetch()}
          className="mt-4 text-sm font-medium text-emerald-600 hover:text-emerald-500"
        >
          Reintentar
        </button>
      </div>
    );
  }

  const workers = cliente.workers ?? [];
  const linkedInmuebles = cliente.inmuebles ?? [];
  const barrioDeseado =
    cliente.barrio ?? parsedRef.zona ?? cliente.distrito ?? cliente.ciudad ?? '—';

  return (
    <div className="space-y-4">
      <Link
        href={backHref}
        className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 transition hover:text-emerald-600"
      >
        <ArrowLeft className="h-4 w-4" />
        {backLabel}
      </Link>

      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold tracking-wide text-slate-900">
            ÁREA CLIENTE
          </h1>
          {isRefreshing ? <QueryRefreshingBadge /> : null}
        </div>

        <div className="flex items-center gap-2 rounded-full border border-slate-300 bg-white p-1 text-xs font-semibold uppercase">
          {(['venta', 'alquiler'] as const).map((tipo) => (
            <button
              key={tipo}
              type="button"
              onClick={() => setTipoOverride(tipo)}
              disabled={Boolean(cliente.tipo_operacion) && cliente.tipo_operacion !== tipo}
              className={`rounded-full px-4 py-1.5 transition ${
                resolvedTipo === tipo
                  ? `${theme.cardHeader} text-white`
                  : 'text-slate-600 hover:bg-slate-50 disabled:opacity-40'
              }`}
            >
              {TIPO_OPERACION_LABELS[tipo]}
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <div className="space-y-4">
          <section className={`overflow-hidden rounded-xl border-2 ${theme.border} bg-white shadow-sm`}>
            <div className={`${theme.cardHeader} px-4 py-2 text-sm font-bold uppercase tracking-wide text-white`}>
              Datos cliente
            </div>
            <div className="grid gap-0 border-b border-slate-200 sm:grid-cols-3">
              <div className="flex items-center gap-3 border-b border-slate-200 px-4 py-4 sm:border-b-0 sm:border-r">
                <User className="h-5 w-5 shrink-0 text-slate-500" />
                <div>
                  <p className="text-xs uppercase text-slate-500">Cliente</p>
                  <p className="font-bold text-slate-900">{cliente.nombre}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 border-b border-slate-200 px-4 py-4 sm:border-b-0 sm:border-r">
                <StatusBadge estado={cliente.estado} />
                <div>
                  <p className="text-xs uppercase text-slate-500">Origen</p>
                  <p className="font-medium text-slate-800">
                    {cliente.origen ? CLIENTE_ORIGEN_LABELS[cliente.origen] : '—'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3 px-4 py-4">
                <Phone className="h-5 w-5 shrink-0 text-slate-500" />
                <div>
                  <p className="text-xs uppercase text-slate-500">Teléfono</p>
                  <p className="font-medium text-slate-800">
                    {cliente.telefono || '—'}
                  </p>
                </div>
              </div>
            </div>

            <div className="grid gap-3 border-b border-slate-200 px-4 py-4 sm:grid-cols-3">
              <div className="flex items-start gap-2">
                <Calendar className="mt-0.5 h-4 w-4 shrink-0 text-slate-500" />
                <div>
                  <p className="text-[11px] font-semibold uppercase text-slate-500">
                    Última gestión
                  </p>
                  <p className="text-sm text-slate-800">
                    {formatAreaDate(cliente.fecha_ultima_gestion)}
                  </p>
                </div>
              </div>
              <div className={`rounded-md px-3 py-2 text-center text-sm font-bold ${theme.pill}`}>
                {formatBudgetLabel(cliente)}
              </div>
              <div className="flex items-start gap-2">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-slate-500" />
                <div>
                  <p className="text-[11px] font-semibold uppercase text-slate-500">
                    Zona
                  </p>
                  <p className="text-sm text-slate-800">{barrioDeseado}</p>
                </div>
              </div>
            </div>

            <div className="space-y-1 px-4 py-3 text-sm text-slate-700">
              <p>
                <span className="font-semibold">Ref. cliente:</span>{' '}
                {cliente.ref_cliente || '—'}
              </p>
              <p>
                <span className="font-semibold">Tipo cliente:</span>{' '}
                {getClienteTipoClienteLabel(cliente.tipo_cliente)}
              </p>
              <p>
                <span className="font-semibold">Tipo nómina:</span>{' '}
                {cliente.tipo_nomina || '—'}
              </p>
              {cliente.notas ? (
                <p>
                  <span className="font-semibold">Notas:</span> {cliente.notas}
                </p>
              ) : null}
            </div>
          </section>

          <section className={`overflow-hidden rounded-xl border-2 ${theme.border} bg-white shadow-sm`}>
            <div className={`${theme.cardHeader} px-4 py-2 text-sm font-bold uppercase tracking-wide text-white`}>
              Perfil cliente
            </div>
            <div className="grid gap-px bg-slate-200 sm:grid-cols-2">
              <ProfileCell
                label="Fecha entrada / gestión"
                value={`${formatAreaDate(cliente.fecha_contacto)} / ${formatAreaDate(cliente.fecha_ultima_gestion)}`}
              />
              <ProfileCell
                label="Presupuesto máximo"
                value={formatBudgetLabel(cliente)}
              />
              <ProfileCell
                label="Hab. mínimas"
                value={
                  parsedRef.habitaciones != null
                    ? String(parsedRef.habitaciones)
                    : '—'
                }
              />
              <ProfileCell label="Baños" value={cliente.banos != null ? String(cliente.banos) : parsedRef.banos != null ? String(parsedRef.banos) : '—'} />
              <ProfileCell label="Metros" value={parsedRef.metros != null ? `${parsedRef.metros} m²` : '—'} />
              <ProfileCell label="Barrio deseado" value={barrioDeseado} />
              <ProfileCell label="Distrito" value={cliente.distrito || '—'} />
              <ProfileCell
                label="Tipo cliente"
                value={getClienteTipoClienteLabel(cliente.tipo_cliente)}
              />
            </div>
            {cliente.descripcion || cliente.mensaje ? (
              <div className="border-t border-slate-200 px-4 py-3 text-sm text-slate-700">
                {cliente.descripcion ? <p>{cliente.descripcion}</p> : null}
                {cliente.mensaje ? (
                  <p className="mt-2 text-slate-600">{cliente.mensaje}</p>
                ) : null}
              </div>
            ) : null}
          </section>

          {linkedInmuebles.length > 0 ? (
            <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
              <h2 className="mb-3 text-sm font-bold uppercase text-slate-800">
                Inmuebles vinculados ({linkedInmuebles.length})
              </h2>
              <ul className="space-y-2 text-sm">
                {linkedInmuebles.map((inmueble) => (
                  <li key={inmueble.id}>
                    <Link
                      href={`/dashboard/casas-${inmueble.tipo_operacion ?? resolvedTipo}/${inmueble.id}`}
                      className={`font-medium ${theme.accent} hover:underline`}
                    >
                      {inmueble.direccion_piso_real ||
                        inmueble.barrio_distrito ||
                        'Inmueble'}
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          {workers.length > 0 ? (
            <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
              <h2 className="mb-3 text-sm font-bold uppercase text-slate-800">
                Trabajadores ({workers.length})
              </h2>
              <ul className="space-y-2 text-sm">
                {workers.map((worker) => (
                  <li key={worker.id}>
                    {canManageWorkers ? (
                      <Link
                        href={`/dashboard/usuarios/${worker.id}`}
                        className={`font-medium ${theme.accent} hover:underline`}
                      >
                        {worker.nombre} ({getWorkerRolLabel(worker.rol)})
                      </Link>
                    ) : (
                      <span className="font-medium text-slate-800">
                        {worker.nombre} ({getWorkerRolLabel(worker.rol)})
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          <div className="flex flex-wrap gap-2">
            <Link
              href={`/dashboard/clientes/${cliente.id}/edit`}
              className="inline-flex items-center gap-2 rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
            >
              <Pencil className="h-4 w-4" />
              Editar cliente
            </Link>
          </div>
        </div>

        <section className={`overflow-hidden rounded-xl border-2 ${theme.border} bg-white shadow-sm`}>
          <div className={`${theme.cardHeader} flex items-center gap-2 px-4 py-2 text-sm font-bold uppercase tracking-wide text-white`}>
            <Heart className="h-4 w-4" />
            Pisos sugeridos
          </div>

          <div className="max-h-[42rem] overflow-y-auto p-4">
            {inmueblesQuery.isLoading ? (
              <p className="text-sm text-slate-500">Buscando inmuebles…</p>
            ) : suggestions.length === 0 ? (
              <p className="text-sm text-slate-500">
                No hay sugerencias con los datos actuales del cliente. Completa
                presupuesto, barrio o referencia para mejorar el match.
              </p>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2">
                {suggestions.map(({ inmueble, matchReasons }) => {
                  const image = resolveInmuebleImageSrc(inmueble.imagen_real);
                  const label =
                    inmueble.barrio_distrito ||
                    inmueble.direccion_piso_real ||
                    'Inmueble';
                  const priceSuffix =
                    inmueble.tipo_operacion === 'venta' ? ' €' : ' €/mes';

                  return (
                    <Link
                      key={inmueble.id}
                      href={`/dashboard/casas-${inmueble.tipo_operacion ?? resolvedTipo}/${inmueble.id}`}
                      className="group overflow-hidden rounded-lg border border-slate-200 bg-white transition hover:shadow-md"
                    >
                      <div className="relative aspect-[4/3] w-full overflow-hidden bg-slate-100">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={image.src}
                          alt={label}
                          className={`h-full w-full ${
                            image.isPlaceholder
                              ? 'object-contain p-2'
                              : 'object-cover'
                          }`}
                        />
                      </div>
                      <div className="space-y-1 p-3">
                        <p className="line-clamp-2 text-xs font-bold uppercase text-slate-800">
                          {label}
                        </p>
                        <p className="text-sm font-semibold text-slate-900">
                          {inmueble.precio != null
                            ? `${formatInmueblePrecio(inmueble.precio)}${priceSuffix}`
                            : '—'}
                        </p>
                        <p className="line-clamp-2 text-[11px] text-slate-500">
                          {matchReasons.join(' · ')}
                        </p>
                        <span
                          className={`mt-2 inline-block rounded px-2 py-0.5 text-[10px] font-bold uppercase text-white ${theme.cardHeader}`}
                        >
                          Sugerencia
                        </span>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>

          <div className="space-y-2 border-t border-slate-200 p-4">
            <button
              type="button"
              disabled
              className="w-full rounded-md bg-slate-200 px-4 py-2 text-sm font-semibold uppercase text-slate-600"
              title="Próximamente"
            >
              Enviar sugerencias
            </button>
            <Link
              href={`/dashboard/clientes/${cliente.id}/edit`}
              className={`flex w-full items-center justify-center gap-2 rounded-md px-4 py-2 text-sm font-semibold uppercase text-white ${theme.accentBg}`}
            >
              Editar filtros
            </Link>
            <Link
              href={`/dashboard/casas-${resolvedTipo}`}
              className="flex w-full items-center justify-center gap-2 rounded-md border border-slate-300 px-4 py-2 text-sm font-semibold uppercase text-slate-700 transition hover:bg-slate-50"
            >
              Ver todos los inmuebles
              <Plus className="h-4 w-4" />
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}

function ProfileCell({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-white px-4 py-3">
      <p className="text-[11px] font-semibold uppercase text-slate-500">{label}</p>
      <p className="mt-1 text-sm font-medium text-slate-900">{value}</p>
    </div>
  );
}
