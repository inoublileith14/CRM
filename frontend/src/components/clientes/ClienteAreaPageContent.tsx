'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  BedDouble,
  MapPin,
  Maximize,
  Pencil,
  Plus,
} from 'lucide-react';
import { QueryRefreshingBadge } from '@/components/QueryRefreshingBadge';
import { toast } from 'sonner';
import { useClienteQuery, useInmueblesQuery } from '@/hooks/use-dashboard-queries';
import { useQueryUiState } from '@/hooks/use-query-ui';
import {
  CLIENTE_SUGGESTION_TOP_N,
  ClienteInmuebleSuggestionService,
} from '@/lib/cliente-inmueble-suggestions';
import { createClientePerfil, updateCliente } from '@/lib/clientes-api';
import { getClienteTipoNominaLabel } from '@/lib/cliente-tipo-nomina';
import { ClientePerfilEditor } from '@/components/clientes/ClientePerfilEditor';
import { ClienteFechaEntradaInmuebleCell } from '@/components/ClienteFechaEntradaInmuebleCell';
import { formatClienteZonasLabel } from '@/lib/cliente-zonas';
import {
  parseRefCliente,
  refsMatchForInmueble,
} from '@/lib/parse-ref-cliente';
import {
  formatInmueblePrecio,
  resolveInmuebleImageSrc,
} from '@/lib/inmueble-table-utils';
import { Cliente, type ClientePerfil } from '@/types/cliente';
import { Inmueble, TIPO_OPERACION_LABELS, TipoOperacion } from '@/types/inmueble';

const AREA_THEMES = {
  alquiler: {
    header: 'bg-emerald-900',
    cardHeader: 'bg-emerald-800',
    accent: 'text-emerald-700',
    accentBg: 'bg-emerald-700 hover:bg-emerald-600',
    pill: 'bg-emerald-100 text-emerald-900',
    border: 'border-emerald-900',
    frame: {
      border: 'border-emerald-900/30',
      shadow: 'shadow-emerald-900/10',
      titleBorder: 'border-emerald-900/40',
      titleText: 'text-emerald-900',
    },
  },
  venta: {
    header: 'bg-blue-900',
    cardHeader: 'bg-blue-900',
    accent: 'text-blue-700',
    accentBg: 'bg-blue-900 hover:bg-blue-800',
    pill: 'bg-blue-100 text-blue-900',
    border: 'border-blue-900',
    frame: {
      border: 'border-blue-900/30',
      shadow: 'shadow-blue-900/10',
      titleBorder: 'border-blue-900/40',
      titleText: 'text-blue-900',
    },
  },
} as const;

function formatCompactGestionDate(value: string | null | undefined): string {
  if (!value) return '—';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '—';
  const month = new Intl.DateTimeFormat('es-ES', { month: 'short' })
    .format(d)
    .replace('.', '');
  return `${d.getDate()} ${month} ${String(d.getFullYear()).slice(-2)}`;
}

const PHONE_COUNTRY_PREFIXES: Array<{
  prefix: string;
  iso: string;
  name: string;
}> = [
  { prefix: '351', iso: 'PT', name: 'Portugal' },
  { prefix: '212', iso: 'MA', name: 'Morocco' },
  { prefix: '213', iso: 'DZ', name: 'Algeria' },
  { prefix: '34', iso: 'ES', name: 'Spain' },
  { prefix: '33', iso: 'FR', name: 'France' },
  { prefix: '49', iso: 'DE', name: 'Germany' },
  { prefix: '39', iso: 'IT', name: 'Italy' },
  { prefix: '44', iso: 'GB', name: 'United Kingdom' },
  { prefix: '32', iso: 'BE', name: 'Belgium' },
  { prefix: '41', iso: 'CH', name: 'Switzerland' },
  { prefix: '31', iso: 'NL', name: 'Netherlands' },
  { prefix: '54', iso: 'AR', name: 'Argentina' },
  { prefix: '52', iso: 'MX', name: 'Mexico' },
  { prefix: '55', iso: 'BR', name: 'Brazil' },
  { prefix: '1', iso: 'US', name: 'United States' },
  { prefix: '7', iso: 'RU', name: 'Russia' },
  { prefix: '86', iso: 'CN', name: 'China' },
];

function getCountryFlagSrc(iso: string | null | undefined): string | null {
  if (!iso?.trim()) return null;
  return `https://flagcdn.com/w40/${iso.trim().toLowerCase()}.png`;
}

function getPhoneCountry(phone: string | null | undefined): {
  iso: string | null;
  name: string;
} {
  if (!phone?.trim()) return { iso: null, name: '—' };

  const digits = phone.replace(/\D/g, '');
  if (!digits) return { iso: null, name: '—' };

  if (digits.length === 9 && /^[67]/.test(digits)) {
    return { iso: 'ES', name: 'Spain' };
  }

  const sorted = [...PHONE_COUNTRY_PREFIXES].sort(
    (a, b) => b.prefix.length - a.prefix.length,
  );
  for (const { prefix, iso, name } of sorted) {
    if (digits.startsWith(prefix)) {
      return { iso, name };
    }
  }

  return { iso: null, name: 'International' };
}

const PERFIL_TAB_ID = 'perfil';

function formatIngresoMonto(value: number | null | undefined): string {
  if (value == null || Number.isNaN(value)) return '—';
  return new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: 0,
  }).format(value);
}

function resolveClientePerfiles(
  cliente: Cliente,
  phoneCountryName: string,
): ClientePerfil[] {
  if (cliente.perfiles?.length) {
    return [...cliente.perfiles].sort((a, b) => a.orden - b.orden);
  }

  const country =
    phoneCountryName !== '—' && phoneCountryName !== 'International'
      ? phoneCountryName
      : cliente.ciudad?.trim() || null;

  return [
    {
      id: `legacy-${cliente.id}`,
      cliente_id: cliente.id,
      orden: 1,
      nombre: cliente.nombre,
      telefono: cliente.telefono,
      tipo_nomina: cliente.tipo_nomina,
      tipo_ingreso: null,
      ingreso_monto: null,
      pais: country,
      notas: null,
      created_at: cliente.created_at,
      updated_at: cliente.updated_at,
    },
  ];
}

interface ClientePerfilSlot {
  id: string;
  perfil: ClientePerfil;
  tipoNomina: string;
  countryName: string;
  ingreso: string;
}

function buildClientePerfilSlots(
  perfiles: ClientePerfil[],
): ClientePerfilSlot[] {
  return perfiles.map((perfil) => ({
    id: `P${perfil.orden}`,
    perfil,
    tipoNomina: getClienteTipoNominaLabel(perfil.tipo_nomina),
    countryName: perfil.pais?.trim() || '—',
    ingreso: formatIngresoMonto(perfil.ingreso_monto),
  }));
}

function formatIngresosTotal(slots: ClientePerfilSlot[]): string {
  const amounts = slots
    .map((slot) => slot.perfil.ingreso_monto)
    .filter((value): value is number => value != null && !Number.isNaN(value));

  if (amounts.length === 0) return '—';

  const total = amounts.reduce((sum, value) => sum + value, 0);
  return formatIngresoMonto(total);
}

function findPerfilByTabId(
  perfiles: ClientePerfil[],
  tabId: string,
): ClientePerfil | null {
  if (!tabId.startsWith('P')) return null;
  const orden = Number(tabId.slice(1));
  if (!Number.isFinite(orden)) return null;
  return perfiles.find((perfil) => perfil.orden === orden) ?? null;
}

function formatBarrioDistrito(
  cliente: Cliente,
  zonaFromRef: string | null,
): string {
  const barrioLabel = formatClienteZonasLabel(cliente.barrio, '');
  const barrio = barrioLabel || zonaFromRef?.trim() || null;
  const distrito = formatClienteZonasLabel(cliente.distrito, '');

  if (barrio && distrito) return `${barrio} / ${distrito}`;
  return barrio || distrito || '—';
}

function getEntryInmueble(
  cliente: Cliente,
  linkedInmuebles: Inmueble[],
): Inmueble | null {
  if (linkedInmuebles.length === 0) return null;

  if (cliente.ref_cliente) {
    const byRef = linkedInmuebles.find((inmueble) =>
      refsMatchForInmueble(cliente.ref_cliente, inmueble.ref),
    );
    if (byRef) return byRef;
  }

  return linkedInmuebles[0];
}

function formatBudgetLabel(cliente: Cliente): string {
  const parsed = parseRefCliente(cliente.ref_cliente);
  const raw = cliente.presupuesto_maximo ?? parsed.presupuesto;
  if (!raw?.trim()) return '—';
  const amount = raw.trim();
  return /€|eur/i.test(amount) ? amount : `${amount} €`;
}

function getInitials(name: string): string {
  const parts = name
    .trim()
    .split(/\s+/g)
    .filter(Boolean);
  if (parts.length === 0) return 'CL';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

function getWhatsAppHref(phone: string | null | undefined): string | null {
  if (!phone?.trim()) return null;
  let digits = phone.replace(/\D/g, '');
  if (digits.length === 9 && /^[67]/.test(digits)) {
    digits = `34${digits}`;
  }
  if (!digits) return null;
  return `https://wa.me/${digits}`;
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
  const {
    data: cliente,
    showInitialLoading,
    isRefreshing,
    showError,
  } = useQueryUiState(clienteQuery);

  const [tipoOverride, setTipoOverride] = useState<TipoOperacion | null>(null);
  const [estanciaFilter, setEstanciaFilter] = useState<
    'larga' | 'temporada' | 'indiferente'
  >('indiferente');
  const [activePerfilTab, setActivePerfilTab] = useState(PERFIL_TAB_ID);
  const [addingPerfil, setAddingPerfil] = useState(false);

  const resolvedTipo = cliente ? getResolvedTipo(cliente, tipoOverride) : 'alquiler';
  const theme = AREA_THEMES[resolvedTipo];

  const inmueblesQuery = useInmueblesQuery(
    { tipo_operacion: resolvedTipo },
    { enabled: Boolean(cliente) },
  );
  const inmueblesRaw = inmueblesQuery.data ?? [];
  const inmuebles = useMemo(() => {
    if (estanciaFilter === 'indiferente') return inmueblesRaw;
    const desired = estanciaFilter === 'larga' ? 'larga' : 't';
    return inmueblesRaw.filter(
      (inmueble) => inmueble.larga_estancia_temporada === desired,
    );
  }, [estanciaFilter, inmueblesRaw]);

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

  const linkedInmuebles = cliente.inmuebles ?? [];
  const whatsAppHref = getWhatsAppHref(cliente.telefono);
  const phoneCountry = getPhoneCountry(cliente.telefono);
  const countryFlagSrc = getCountryFlagSrc(phoneCountry.iso);
  const clientePerfiles = resolveClientePerfiles(cliente, phoneCountry.name);
  const perfilTabs = clientePerfiles.map((perfil) => ({
    id: `P${perfil.orden}`,
    label: `P${perfil.orden}`,
  }));
  const perfilFinancialSlots = buildClientePerfilSlots(clientePerfiles);
  const ingresosTotal = formatIngresosTotal(perfilFinancialSlots);
  const selectedPerfil = findPerfilByTabId(clientePerfiles, activePerfilTab);
  const barrioDistritoLabel = formatBarrioDistrito(cliente, parsedRef.zona);
  const habMaxLabel =
    parsedRef.habitaciones != null ? String(parsedRef.habitaciones) : '—';
  const entryInmueble = getEntryInmueble(cliente, linkedInmuebles);

  async function handleAddPerfil() {
    if (addingPerfil || !cliente) return;

    setAddingPerfil(true);
    try {
      const stored = cliente.perfiles ?? [];

      if (stored.length === 0) {
        await createClientePerfil(cliente.id, {
          orden: 1,
          nombre: cliente.nombre,
          telefono: cliente.telefono,
          tipo_nomina: cliente.tipo_nomina,
          pais:
            phoneCountry.name !== 'International'
              ? phoneCountry.name
              : cliente.ciudad,
        });
        const created = await createClientePerfil(cliente.id, { orden: 2 });
        await clienteQuery.refetch();
        setActivePerfilTab(`P${created.orden}`);
        return;
      }

      const nextOrden =
        Math.max(...stored.map((perfil) => perfil.orden), 0) + 1;
      const created = await createClientePerfil(cliente.id, { orden: nextOrden });
      await clienteQuery.refetch();
      setActivePerfilTab(`P${created.orden}`);
    } finally {
      setAddingPerfil(false);
    }
  }
  const entryInmuebleImage = entryInmueble
    ? resolveInmuebleImageSrc(
        entryInmueble.imagen_real ?? entryInmueble.foto_espejo,
      )
    : null;

  return (
    <div className="min-h-0 pt-5 sm:pt-6 lg:pt-8">
      <header className="sticky top-0 z-20 bg-slate-50/95 pt-4 backdrop-blur sm:pt-5">
        <div className="flex items-center gap-2 sm:gap-3">
          <Link
            href={backHref}
            className="flex min-w-0 shrink-0 items-center gap-1.5 text-xs font-medium text-slate-500 transition-colors hover:text-slate-900 sm:gap-2 sm:text-sm"
          >
            <ArrowLeft className="h-3.5 w-3.5 shrink-0 sm:h-4 sm:w-4" />
            <span className="truncate">{backLabel}</span>
          </Link>

          <div className="h-px min-w-0 flex-1 bg-slate-200" aria-hidden />

          <div
            className={`shrink-0 rounded-full border-2 bg-slate-50 px-5 py-1.5 text-sm font-extrabold uppercase tracking-wider shadow-[0_6px_16px_-10px_rgba(15,23,42,0.4)] sm:px-7 sm:py-2 sm:text-lg ${theme.frame.border} ${theme.frame.titleText}`}
          >
            Área Cliente
          </div>

          <div className="h-px min-w-0 flex-1 bg-slate-200" aria-hidden />

          <div className="flex shrink-0 items-center rounded-full bg-slate-100 p-0.5 text-xs sm:p-1 sm:text-sm">
            {(['venta', 'alquiler'] as const).map((tipo) => (
              <button
                key={tipo}
                type="button"
                onClick={() => setTipoOverride(tipo)}
                disabled={Boolean(cliente.tipo_operacion) && cliente.tipo_operacion !== tipo}
                className={`rounded-full px-2.5 py-0.5 font-medium capitalize transition-colors disabled:opacity-40 sm:px-3 sm:py-1 ${
                  resolvedTipo === tipo
                    ? `${theme.cardHeader} text-white shadow`
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {TIPO_OPERACION_LABELS[tipo].toLowerCase()}
              </button>
            ))}
          </div>
        </div>
      </header>

      <div className="mt-6 w-full pb-6 pt-3 sm:mt-8 sm:pt-4 lg:pb-8">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 lg:items-start">
          <div className="flex min-w-0 flex-col gap-6">
            <Card3DBorder title="Datos" themeFrame={theme.frame}>
              <div className="px-3 py-3 sm:px-4 sm:py-3.5">
                <div className="grid min-w-0 grid-cols-[1fr_auto_1fr] items-center gap-1.5 sm:gap-2">
                  <div className="flex min-w-0 items-center gap-1.5 justify-self-start sm:gap-2">
                    <div
                      className={`${theme.cardHeader} flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-xs font-bold text-white sm:h-10 sm:w-10 sm:rounded-2xl sm:text-sm`}
                    >
                      {getInitials(cliente.nombre)}
                    </div>
                    <h2
                      className="min-w-0 truncate text-[11px] font-bold leading-tight text-slate-900 sm:text-sm md:text-base"
                      title={cliente.nombre}
                    >
                      {cliente.nombre}
                    </h2>
                  </div>

                  <div className="flex shrink-0 items-center justify-self-center gap-1 sm:gap-1.5">
                    {countryFlagSrc ? (
                      /* eslint-disable-next-line @next/next/no-img-element */
                      <img
                        src={countryFlagSrc}
                        alt={`${phoneCountry.name} flag`}
                        className="h-4 w-6 shrink-0 rounded-sm object-cover shadow-sm ring-1 ring-slate-200 sm:h-5 sm:w-7"
                        width={28}
                        height={20}
                        draggable={false}
                      />
                    ) : (
                      <span className="flex h-4 w-6 shrink-0 items-center justify-center rounded-sm bg-slate-100 text-[10px] text-slate-400 sm:h-5 sm:w-7">
                        —
                      </span>
                    )}
                    <span className="whitespace-nowrap text-[10px] font-semibold text-slate-600 sm:text-xs">
                      {phoneCountry.name}
                    </span>
                  </div>

                  <div className="flex shrink-0 items-center justify-self-end gap-1">
                    {isRefreshing ? <QueryRefreshingBadge /> : null}
                    <span className="whitespace-nowrap text-[11px] font-bold tracking-wide text-slate-900 sm:text-sm md:text-base">
                      {cliente.telefono || '—'}
                    </span>
                  </div>
                </div>

                <div className="mt-2.5 flex items-center gap-2 border-t border-slate-100 pt-2.5 sm:gap-3">
                  <div className="shrink-0">
                    <p className="text-[9px] font-semibold uppercase tracking-wide text-slate-400 sm:text-[10px]">
                      Última gestión
                    </p>
                    <p className="text-xs font-bold text-slate-900 sm:text-sm">
                      {formatCompactGestionDate(cliente.fecha_ultima_gestion)}
                    </p>
                  </div>

                  {entryInmueble ? (
                    <Link
                      href={`/dashboard/casas-${entryInmueble.tipo_operacion ?? resolvedTipo}/${entryInmueble.id}`}
                      className="flex min-w-0 flex-1 items-center gap-2 rounded-lg bg-slate-50 px-2 py-1 transition hover:bg-slate-100"
                      title={
                        entryInmueble.direccion_piso_real ||
                        entryInmueble.barrio_distrito ||
                        'Inmueble de entrada'
                      }
                    >
                      <div className="h-9 w-11 shrink-0 overflow-hidden rounded-md bg-slate-200 sm:h-10 sm:w-12">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={entryInmuebleImage?.src}
                          alt={entryInmueble.ref || 'Inmueble'}
                          className={`h-full w-full ${
                            entryInmuebleImage?.isPlaceholder
                              ? 'object-contain p-0.5'
                              : 'object-cover'
                          }`}
                        />
                      </div>
                      <span className="truncate text-xs font-bold text-slate-800 sm:text-sm">
                        {entryInmueble.ref?.trim() || 'NR'}
                      </span>
                    </Link>
                  ) : (
                    <div className="min-w-0 flex-1 rounded-lg bg-slate-50 px-2 py-2 text-xs text-slate-400">
                      Sin inmueble de entrada
                    </div>
                  )}

                  {whatsAppHref ? (
                    <a
                      href={whatsAppHref}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex shrink-0 items-center justify-center transition hover:opacity-90"
                      title={`WhatsApp: ${cliente.telefono}`}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src="/whatsapp-logo.png"
                        alt="WhatsApp"
                        className="h-7 w-7 object-contain sm:h-8 sm:w-8"
                        width={32}
                        height={32}
                        draggable={false}
                      />
                    </a>
                  ) : (
                    <span
                      className="inline-flex shrink-0 cursor-not-allowed opacity-40"
                      title="Sin teléfono"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src="/whatsapp-logo.png"
                        alt="WhatsApp no disponible"
                        className="h-7 w-7 object-contain sm:h-8 sm:w-8"
                        width={32}
                        height={32}
                        draggable={false}
                      />
                    </span>
                  )}
                </div>
              </div>
            </Card3DBorder>

            <Card3DBorder
              title="Perfil"
              themeFrame={theme.frame}
              profileTabs={{
                titleTabId: PERFIL_TAB_ID,
                items: perfilTabs,
                activeId: activePerfilTab,
                onSelect: setActivePerfilTab,
                showAdd: true,
                onAdd: handleAddPerfil,
                addingPerfil,
                activeTabClassName: theme.cardHeader,
              }}
            >
              <div className="space-y-0 px-3 py-3 sm:px-4 sm:py-4">
                {activePerfilTab === PERFIL_TAB_ID ? (
                  <>
                    <div className="flex flex-wrap items-stretch gap-2 pb-3 sm:gap-3">
                      <PerfilEntradaViviendaField
                        clienteId={cliente.id}
                        value={cliente.fecha_entrada_inmueble}
                        className="min-w-[7rem]"
                        onUpdated={() => void clienteQuery.refetch()}
                      />
                      {perfilFinancialSlots.map((slot) => (
                        <PerfilMetric
                          key={`${slot.id}-nomina`}
                          label={`${slot.id} · Tipo`}
                          value={`${slot.tipoNomina} · ${slot.countryName}`}
                          className="min-w-[8.5rem] flex-1"
                        />
                      ))}
                    </div>

                    <div className="flex flex-wrap items-stretch gap-2 py-3 sm:gap-3">
                      <PerfilMetric
                        label="Ingresos total"
                        value={ingresosTotal}
                        className="min-w-[7rem]"
                      />
                      {perfilFinancialSlots.map((slot) => (
                        <PerfilMetric
                          key={`${slot.id}-ingreso`}
                          label={`Ingreso ${slot.id}`}
                          value={slot.ingreso}
                          className="min-w-[7rem] flex-1"
                        />
                      ))}
                    </div>

                    <div className="flex flex-wrap items-stretch gap-2 pt-3 sm:gap-3">
                      <PerfilMetric
                        label="Presup. máx."
                        value={formatBudgetLabel(cliente)}
                        accentClassName={theme.accent}
                        className="min-w-[7rem] flex-1"
                      />
                      <PerfilMetric
                        label="Hab. máx."
                        value={habMaxLabel}
                        className="min-w-[5.5rem] flex-1"
                      />
                      <PerfilMetric
                        label="Barrio / Distrito"
                        value={barrioDistritoLabel}
                        className="min-w-[8rem] flex-[1.4]"
                      />
                    </div>
                  </>
                ) : selectedPerfil ? (
                  <ClientePerfilEditor
                    key={`${selectedPerfil.id}-${selectedPerfil.updated_at}`}
                    clienteId={cliente.id}
                    perfil={selectedPerfil}
                    accentClassName={theme.accent}
                    onSaved={() => void clienteQuery.refetch()}
                  />
                ) : null}

                <div className="flex flex-wrap gap-2 pt-3">
                  <Link
                    href={`/dashboard/clientes/${cliente.id}/edit`}
                    className="inline-flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-medium text-slate-600 transition hover:bg-slate-100 hover:text-slate-900 sm:text-sm"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                    Editar cliente
                  </Link>
                </div>
              </div>
            </Card3DBorder>
          </div>

          <section className="min-w-0">
            <div className="mb-4 flex items-center justify-between gap-3">
              <h3 className="text-base font-bold text-slate-900 sm:text-lg">
                Pisos sugeridos
              </h3>
              {whatsAppHref ? (
                <a
                  href={whatsAppHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex shrink-0 items-center justify-center transition hover:opacity-90"
                  title={`Enviar sugerencias por WhatsApp: ${cliente.telefono}`}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src="/whatsapp-logo.png"
                    alt="Enviar sugerencias por WhatsApp"
                    className="h-8 w-8 shrink-0 object-contain sm:h-9 sm:w-9"
                    width={36}
                    height={36}
                    draggable={false}
                  />
                </a>
              ) : (
                <span
                  className="inline-flex shrink-0 cursor-not-allowed items-center justify-center opacity-40"
                  title="El cliente no tiene teléfono"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src="/whatsapp-logo.png"
                    alt="WhatsApp no disponible"
                    className="h-8 w-8 shrink-0 object-contain sm:h-9 sm:w-9"
                    width={36}
                    height={36}
                    draggable={false}
                  />
                </span>
              )}
            </div>

            {inmueblesQuery.isLoading ? (
              <p className="text-sm text-slate-500">Buscando inmuebles…</p>
            ) : suggestions.length === 0 ? (
              <p className="text-sm text-slate-500">
                No hay sugerencias con los datos actuales del cliente. Completa presupuesto, barrio o referencia para mejorar el match.
              </p>
            ) : (
              <>
                <div className="grid grid-cols-2 gap-2.5 sm:gap-3">
                  {suggestions.map(({ inmueble, matchReasons, score }) => (
                    <PropertyCard3D
                      key={inmueble.id}
                      inmueble={inmueble}
                      resolvedTipo={resolvedTipo}
                      matchReasons={matchReasons}
                      score={score}
                    />
                  ))}
                </div>
                <Link
                  href={`/dashboard/casas-${resolvedTipo}`}
                  className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-slate-600 transition hover:text-slate-900"
                >
                  Ver todos los inmuebles
                  <Plus className="h-3.5 w-3.5" />
                </Link>
              </>
            )}

            {linkedInmuebles.length > 0 ? (
              <div className="mt-6 rounded-3xl bg-white p-5 ring-1 ring-slate-200">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Inmuebles vinculados ({linkedInmuebles.length})
                </p>
                <ul className="mt-3 space-y-2 text-sm">
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
              </div>
            ) : null}
          </section>
        </div>
      </div>
    </div>
  );
}

function Card3DBorder({
  children,
  title,
  themeFrame,
  profileTabs,
}: {
  children: React.ReactNode;
  title?: string;
  themeFrame: {
    border: string;
    shadow: string;
    titleBorder: string;
    titleText: string;
  };
  profileTabs?: {
    titleTabId?: string;
    items: Array<{ id: string; label: string }>;
    activeId: string;
    onSelect: (id: string) => void;
    showAdd?: boolean;
    onAdd?: () => void;
    addingPerfil?: boolean;
    activeTabClassName?: string;
  };
}) {
  return (
    <div className="relative overflow-visible rounded-3xl">
      {/* 3D frame (static) */}
      <div
        className={`relative rounded-3xl border bg-gradient-to-br from-white via-white to-slate-50 shadow-[inset_0_1px_0_rgba(255,255,255,0.9),inset_0_-10px_18px_rgba(15,23,42,0.06),0_22px_45px_-35px_rgba(15,23,42,0.45)] ${themeFrame.border} ${themeFrame.shadow}`}
      >
        {title ? (
          <div className="absolute left-1/2 top-0 z-10 -translate-x-1/2 -translate-y-1/2">
            <div
              className={`flex items-center gap-0.5 rounded-full border bg-slate-50 py-0.5 pl-3 pr-1 text-xs font-extrabold uppercase tracking-wide shadow-[0_10px_22px_-18px_rgba(15,23,42,0.45),inset_0_1px_0_rgba(255,255,255,0.85)] sm:gap-1 sm:pl-4 sm:pr-1.5 ${themeFrame.titleBorder} ${themeFrame.titleText}`}
            >
              {profileTabs?.titleTabId ? (
                <button
                  type="button"
                  onClick={() => profileTabs.onSelect(profileTabs.titleTabId!)}
                  className={`whitespace-nowrap rounded-full px-1 py-0.5 transition sm:px-1.5 ${
                    profileTabs.activeId === profileTabs.titleTabId
                      ? `${profileTabs.activeTabClassName ?? 'bg-slate-900'} text-white shadow`
                      : 'hover:text-slate-700'
                  }`}
                >
                  {title}
                </button>
              ) : (
                <span className="whitespace-nowrap">{title}</span>
              )}
              {profileTabs ? (
                <>
                  <span
                    className="mx-1 hidden h-4 w-px bg-slate-200 sm:block"
                    aria-hidden
                  />
                  <div className="flex items-center gap-0.5 rounded-full bg-slate-100 p-0.5">
                    {profileTabs.items.map((tab) => {
                      const isActive = tab.id === profileTabs.activeId;
                      return (
                        <button
                          key={tab.id}
                          type="button"
                          onClick={() => profileTabs.onSelect(tab.id)}
                          className={`rounded-full px-2 py-0.5 text-[10px] font-bold normal-case tracking-normal transition sm:px-2.5 sm:text-xs ${
                            isActive
                              ? `${profileTabs.activeTabClassName ?? 'bg-slate-900'} text-white shadow`
                              : 'text-slate-500 hover:text-slate-800'
                          }`}
                        >
                          {tab.label}
                        </button>
                      );
                    })}
                    {profileTabs.showAdd ? (
                      <button
                        type="button"
                        onClick={() => profileTabs.onAdd?.()}
                        disabled={profileTabs.addingPerfil}
                        className="rounded-full px-2 py-0.5 text-[10px] font-bold normal-case tracking-normal text-slate-500 transition hover:bg-white hover:text-slate-800 disabled:cursor-wait disabled:opacity-50 sm:px-2.5 sm:text-xs"
                        aria-label="Añadir perfil"
                      >
                        {profileTabs.addingPerfil ? '…' : '+'}
                      </button>
                    ) : null}
                  </div>
                </>
              ) : null}
            </div>
          </div>
        ) : null}
        {children}
      </div>
    </div>
  );
}

function PerfilEntradaViviendaField({
  clienteId,
  value,
  className,
  onUpdated,
}: {
  clienteId: string;
  value: string | null | undefined;
  className?: string;
  onUpdated: () => void;
}) {
  return (
    <div className={`rounded-xl bg-slate-50 px-3 py-2 ${className ?? ''}`}>
      <p className="text-[9px] font-semibold uppercase tracking-wide text-slate-400 sm:text-[10px]">
        Entrada prevista
      </p>
      <div className="mt-0.5">
        <ClienteFechaEntradaInmuebleCell
          clienteId={clienteId}
          value={value}
          onUpdated={() => onUpdated()}
        />
      </div>
    </div>
  );
}

function PerfilMetric({
  label,
  value,
  accentClassName,
  className,
}: {
  label: string;
  value: string;
  accentClassName?: string;
  className?: string;
}) {
  return (
    <div className={`rounded-xl bg-slate-50 px-3 py-2 ${className ?? ''}`}>
      <p className="text-[9px] font-semibold uppercase tracking-wide text-slate-400 sm:text-[10px]">
        {label}
      </p>
      <p
        className={`mt-0.5 text-xs font-bold leading-snug sm:text-sm ${
          accentClassName ?? 'text-slate-900'
        }`}
      >
        {value}
      </p>
    </div>
  );
}

function scoreToMatch(score: number): number {
  const clamped = Math.max(0, Math.min(100, Math.round(score)));
  return Math.max(65, Math.min(99, clamped));
}

function PropertyCard3D({
  inmueble,
  resolvedTipo,
  matchReasons,
  score,
}: {
  inmueble: import('@/types/inmueble').Inmueble;
  resolvedTipo: TipoOperacion;
  matchReasons: string[];
  score: number;
}) {
  const label =
    inmueble.direccion_piso_real ||
    inmueble.barrio_distrito ||
    inmueble.distrito_ciudad ||
    'Inmueble';

  const image = resolveInmuebleImageSrc(inmueble.imagen_real);
  const priceSuffix = inmueble.tipo_operacion === 'venta' ? ' €' : ' €/mes';
  const match = scoreToMatch(score);

  return (
    <Link
      href={`/dashboard/casas-${inmueble.tipo_operacion ?? resolvedTipo}/${inmueble.id}`}
      className="relative overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-slate-200"
    >
      <div className="relative overflow-hidden rounded-t-xl">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={image.src}
          alt={label}
          className={`h-24 w-full sm:h-28 ${
            image.isPlaceholder ? 'object-contain p-1.5' : 'object-cover'
          }`}
        />
        <span className="absolute left-1.5 top-1.5 rounded-full bg-slate-900 px-1.5 py-0.5 text-[9px] font-semibold text-white shadow sm:left-2 sm:top-2 sm:px-2 sm:text-[10px]">
          {match}% match
        </span>
        <span className="absolute right-1.5 bottom-1.5 rounded-md bg-white/90 px-1.5 py-0.5 text-[10px] font-bold text-slate-900 backdrop-blur sm:right-2 sm:bottom-2 sm:px-2 sm:text-xs">
          {inmueble.precio != null
            ? `${formatInmueblePrecio(inmueble.precio)}${priceSuffix}`
            : '—'}
        </span>
      </div>

      <div className="space-y-1 p-2 sm:p-2.5">
        <h4 className="line-clamp-2 text-pretty text-[11px] font-semibold leading-tight text-slate-900 sm:text-xs">
          {label}
        </h4>
        <p className="flex items-center gap-0.5 text-[10px] text-slate-500 sm:text-[11px]">
          <MapPin className="h-3 w-3 shrink-0" />
          <span className="truncate">
            {inmueble.barrio_distrito || inmueble.distrito_ciudad || '—'}
          </span>
        </p>
        <div className="flex items-center gap-2 pt-0.5 text-[10px] text-slate-500 sm:text-[11px]">
          <span className="flex items-center gap-0.5">
            <BedDouble className="h-3 w-3" />
            {inmueble.hab ?? '—'} hab.
          </span>
          <span className="flex items-center gap-0.5">
            <Maximize className="h-3 w-3" />
            {inmueble.metros != null ? `${inmueble.metros} m²` : '—'}
          </span>
        </div>
        <p className="line-clamp-1 text-[9px] text-slate-500 sm:line-clamp-2 sm:text-[10px]">
          {matchReasons.join(' · ')}
        </p>
      </div>
    </Link>
  );
}
