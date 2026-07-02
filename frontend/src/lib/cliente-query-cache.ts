import { QueryClient } from '@tanstack/react-query';
import { normalizeClienteEntradaPrevista } from '@/lib/cliente-entrada-prevista';
import { normalizeClienteZonas } from '@/lib/cliente-zonas';
import { normalizeClienteTelefonosExtra } from '@/lib/cliente-telefonos';
import { ClienteGestionEstado } from '@/lib/cliente-gestion-estado';
import { queryKeys } from '@/lib/query-keys';
import { isClienteTipoCliente } from '@/lib/cliente-tipo';
import { Cliente, ClienteEstado, ClienteOrigen } from '@/types/cliente';
import { ClientesByTipoPageResult } from '@/types/clientes-by-tipo-page';
import { Inmueble, TipoOperacion } from '@/types/inmueble';
import { Worker } from '@/types/worker';

function toStringOrNull(value: unknown): string | null {
  if (value == null) return null;
  const text = String(value).trim();
  return text ? text : null;
}

function toNumberOrNull(value: unknown): number | null {
  if (value == null || value === '') return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function readEstado(value: unknown): ClienteEstado {
  if (value === 'activo' || value === 'inactivo' || value === 'pendiente') {
    return value;
  }
  return 'pendiente';
}

function readOrigen(value: unknown): ClienteOrigen | null {
  if (value === 'email' || value === 'call' || value === 'otro') return value;
  return null;
}

function readTipoOperacion(value: unknown): TipoOperacion | null {
  return value === 'alquiler' || value === 'venta' ? value : null;
}

export function mapRealtimeRowToCliente(
  row: Record<string, unknown>,
): Cliente | null {
  const id = toStringOrNull(row.id);
  if (!id) return null;

  return {
    id,
    nombre: String(row.nombre ?? ''),
    email: toStringOrNull(row.email),
    telefono: toStringOrNull(row.telefono),
    telefonos_extra: normalizeClienteTelefonosExtra(
      row.telefonos_extra as string[] | null | undefined,
    ),
    ciudad: toStringOrNull(row.ciudad),
    barrio: normalizeClienteZonas(row.barrio),
    distrito: normalizeClienteZonas(row.distrito),
    tipo_nomina: toStringOrNull(row.tipo_nomina),
    tipo_ingreso: toStringOrNull(row.tipo_ingreso),
    tipo_cliente: isClienteTipoCliente(toStringOrNull(row.tipo_cliente))
      ? (toStringOrNull(row.tipo_cliente) as Cliente['tipo_cliente'])
      : null,
    estado: readEstado(row.estado),
    origen: readOrigen(row.origen),
    estado_contacto: toStringOrNull(row.estado_contacto),
    descripcion: toStringOrNull(row.descripcion),
    ref_cliente: toStringOrNull(row.ref_cliente),
    mensaje: toStringOrNull(row.mensaje),
    fecha_contacto: toStringOrNull(row.fecha_contacto),
    fecha_entrada_inmueble: normalizeClienteEntradaPrevista(
      toStringOrNull(row.fecha_entrada_inmueble),
    ),
    fecha_ultima_gestion: toStringOrNull(row.fecha_ultima_gestion),
    presupuesto_maximo: toStringOrNull(row.presupuesto_maximo),
    banos: toNumberOrNull(row.banos),
    notas: toStringOrNull(row.notas),
    tipo_operacion: readTipoOperacion(row.tipo_operacion),
    created_at: String(row.created_at ?? new Date().toISOString()),
    updated_at: String(row.updated_at ?? new Date().toISOString()),
  };
}

function patchInmuebleDetailClientes(
  queryClient: QueryClient,
  inmuebleId: string,
  updater: (clientes: Cliente[]) => Cliente[],
): void {
  queryClient.setQueryData<Inmueble>(
    queryKeys.inmuebles.detail(inmuebleId),
    (prev) => {
      if (!prev) return prev;
      const clientes = prev.clientes ?? [];
      const nextClientes = updater(clientes);
      if (nextClientes === clientes) return prev;
      return {
        ...prev,
        clientes: nextClientes,
        clientes_count: nextClientes.length,
      };
    },
  );
}

export function isClienteInInmuebleDetail(
  queryClient: QueryClient,
  inmuebleId: string,
  clienteId: string,
): boolean {
  const inmueble = queryClient.getQueryData<Inmueble>(
    queryKeys.inmuebles.detail(inmuebleId),
  );
  return inmueble?.clientes?.some((cliente) => cliente.id === clienteId) ?? false;
}

export function patchClienteInInmuebleDetail(
  queryClient: QueryClient,
  inmuebleId: string,
  clienteId: string,
  patch: Partial<Cliente>,
): void {
  patchInmuebleDetailClientes(queryClient, inmuebleId, (clientes) => {
    const index = clientes.findIndex((cliente) => cliente.id === clienteId);
    if (index === -1) return clientes;
    const next = [...clientes];
    next[index] = { ...next[index], ...patch };
    return next;
  });
}

export function removeClienteFromInmuebleDetail(
  queryClient: QueryClient,
  inmuebleId: string,
  clienteId: string,
): void {
  patchInmuebleDetailClientes(queryClient, inmuebleId, (clientes) =>
    clientes.filter((cliente) => cliente.id !== clienteId),
  );
}

export function addClienteToInmuebleDetail(
  queryClient: QueryClient,
  inmuebleId: string,
  cliente: Cliente,
): void {
  patchInmuebleDetailClientes(queryClient, inmuebleId, (clientes) => {
    if (clientes.some((row) => row.id === cliente.id)) return clientes;
    return [...clientes, cliente];
  });
}

export function applyClienteLinkUpdateToInmuebleDetail(
  queryClient: QueryClient,
  inmuebleId: string,
  clienteId: string,
  link: {
    gestion_estado?: string | null;
    fecha_ultima_gestion?: string | null;
    visita_no_realizada?: boolean | null;
  },
): void {
  const patch: Partial<Cliente> = {};
  if (link.gestion_estado != null) {
    patch.gestion_estado = link.gestion_estado as ClienteGestionEstado;
  }
  if (link.fecha_ultima_gestion !== undefined) {
    patch.fecha_ultima_gestion = link.fecha_ultima_gestion;
  }
  if (link.visita_no_realizada !== undefined && link.visita_no_realizada !== null) {
    patch.visita_no_realizada = link.visita_no_realizada;
  }
  if (Object.keys(patch).length === 0) return;
  patchClienteInInmuebleDetail(queryClient, inmuebleId, clienteId, patch);
}

export function applyClienteWorkersChange(
  queryClient: QueryClient,
  inmuebleId: string,
  clienteId: string,
  worker: Worker,
  action: 'add' | 'remove',
): void {
  patchInmuebleDetailClientes(queryClient, inmuebleId, (clientes) => {
    const index = clientes.findIndex((cliente) => cliente.id === clienteId);
    if (index === -1) return clientes;

    const current = clientes[index];
    const workerIds = new Set(current.worker_ids ?? []);
    const workers = [...(current.workers ?? [])];

    if (action === 'add') {
      if (workerIds.has(worker.id)) return clientes;
      workerIds.add(worker.id);
      workers.push(worker);
    } else {
      if (!workerIds.has(worker.id)) return clientes;
      workerIds.delete(worker.id);
      const filteredWorkers = workers.filter((row) => row.id !== worker.id);
      const next = [...clientes];
      next[index] = {
        ...current,
        worker_ids: [...workerIds],
        workers: filteredWorkers,
        workers_count: filteredWorkers.length,
      };
      return next;
    }

    const next = [...clientes];
    next[index] = {
      ...current,
      worker_ids: [...workerIds],
      workers,
      workers_count: workers.length,
    };
    return next;
  });
}

export function resolveWorkerFromCache(
  queryClient: QueryClient,
  workerId: string,
): Worker | null {
  const lists = queryClient.getQueriesData<Worker[]>({
    queryKey: ['workers'],
  });
  for (const [, workers] of lists) {
    const match = workers?.find((worker) => worker.id === workerId);
    if (match) return match;
  }
  return null;
}

export function resolveInmuebleTipo(
  queryClient: QueryClient,
  inmuebleId: string,
): TipoOperacion | null {
  for (const tipo of ['alquiler', 'venta'] as const) {
    const list = queryClient.getQueryData<Inmueble[]>(
      queryKeys.inmuebles.all({ tipo_operacion: tipo }),
    );
    const match = list?.find((inmueble) => inmueble.id === inmuebleId);
    if (match?.tipo_operacion) return match.tipo_operacion;
  }

  const detail = queryClient.getQueryData<Inmueble>(
    queryKeys.inmuebles.detail(inmuebleId),
  );
  return detail?.tipo_operacion ?? null;
}

export function clienteRowBelongsToTipo(
  queryClient: QueryClient,
  tipo: TipoOperacion,
  cliente: Pick<Cliente, 'id' | 'tipo_operacion'>,
  inmuebleId: string | null,
): boolean {
  if (inmuebleId) {
    const inmuebleTipo = resolveInmuebleTipo(queryClient, inmuebleId);
    if (inmuebleTipo) return inmuebleTipo === tipo;
    return true;
  }
  return cliente.tipo_operacion === tipo || cliente.tipo_operacion == null;
}

function forEachClientesByTipoCache(
  queryClient: QueryClient,
  tipo: TipoOperacion,
  updater: (
    data: ClientesByTipoPageResult,
  ) => ClientesByTipoPageResult | undefined,
): void {
  const entries = queryClient.getQueriesData<ClientesByTipoPageResult>({
    queryKey: ['clientes-by-tipo', tipo],
  });

  for (const [key, data] of entries) {
    if (!data) continue;
    const next = updater(data);
    if (next && next !== data) {
      queryClient.setQueryData(key, next);
    }
  }
}

export function invalidateAllClientesByTipoCaches(
  queryClient: QueryClient,
  tipo: TipoOperacion,
): void {
  void queryClient.invalidateQueries({
    queryKey: ['clientes-by-tipo', tipo],
  });
}

export function patchClienteInAllByTipoCaches(
  queryClient: QueryClient,
  tipo: TipoOperacion,
  clienteId: string,
  patch: Partial<Cliente>,
): void {
  forEachClientesByTipoCache(queryClient, tipo, (data) => {
    let changed = false;
    const rows = data.rows.map((row) => {
      if (row.cliente.id !== clienteId) return row;
      changed = true;
      return {
        ...row,
        cliente: {
          ...row.cliente,
          ...patch,
          gestion_estado:
            patch.gestion_estado ?? row.cliente.gestion_estado,
          workers: patch.workers ?? row.cliente.workers,
          worker_ids: patch.worker_ids ?? row.cliente.worker_ids,
          workers_count: patch.workers_count ?? row.cliente.workers_count,
        },
      };
    });
    if (!changed) return undefined;
    return { ...data, rows };
  });
}

export function patchLinkRowInAllByTipoCaches(
  queryClient: QueryClient,
  tipo: TipoOperacion,
  inmuebleId: string,
  clienteId: string,
  link: {
    gestion_estado?: string | null;
    fecha_ultima_gestion?: string | null;
  },
): void {
  const patch: Partial<Cliente> = {};
  if (link.gestion_estado != null) {
    patch.gestion_estado = link.gestion_estado as ClienteGestionEstado;
  }
  if (link.fecha_ultima_gestion !== undefined) {
    patch.fecha_ultima_gestion = link.fecha_ultima_gestion;
  }
  if (Object.keys(patch).length === 0) return;

  const rowKey = `${inmuebleId}-${clienteId}`;
  forEachClientesByTipoCache(queryClient, tipo, (data) => {
    const index = data.rows.findIndex((row) => row.row_key === rowKey);
    if (index === -1) return undefined;
    const rows = [...data.rows];
    rows[index] = {
      ...rows[index],
      cliente: { ...rows[index].cliente, ...patch },
    };
    return { ...data, rows };
  });
}

export function removeRowFromAllByTipoCaches(
  queryClient: QueryClient,
  tipo: TipoOperacion,
  rowKey: string,
): void {
  forEachClientesByTipoCache(queryClient, tipo, (data) => {
    const index = data.rows.findIndex((row) => row.row_key === rowKey);
    if (index === -1) return undefined;
    const rows = data.rows.filter((row) => row.row_key !== rowKey);
    return {
      ...data,
      rows,
      total: Math.max(0, data.total - 1),
    };
  });
}

export function applyClienteWorkersChangeInAllByTipoCaches(
  queryClient: QueryClient,
  tipo: TipoOperacion,
  clienteId: string,
  worker: Worker,
  action: 'add' | 'remove',
): void {
  forEachClientesByTipoCache(queryClient, tipo, (data) => {
    let changed = false;
    const rows = data.rows.map((row) => {
      if (row.cliente.id !== clienteId) return row;

      const current = row.cliente;
      const workerIds = new Set(current.worker_ids ?? []);
      const workers = [...(current.workers ?? [])];

      if (action === 'add') {
        if (workerIds.has(worker.id)) return row;
        workerIds.add(worker.id);
        workers.push(worker);
      } else {
        if (!workerIds.has(worker.id)) return row;
        workerIds.delete(worker.id);
        const filteredWorkers = workers.filter((item) => item.id !== worker.id);
        changed = true;
        return {
          ...row,
          cliente: {
            ...current,
            worker_ids: [...workerIds],
            workers: filteredWorkers,
            workers_count: filteredWorkers.length,
          },
        };
      }

      changed = true;
      return {
        ...row,
        cliente: {
          ...current,
          worker_ids: [...workerIds],
          workers,
          workers_count: workers.length,
        },
      };
    });

    if (!changed) return undefined;
    return { ...data, rows };
  });
}

export function isClienteVisibleInByTipoCaches(
  queryClient: QueryClient,
  tipo: TipoOperacion,
  clienteId: string,
): boolean {
  const entries = queryClient.getQueriesData<ClientesByTipoPageResult>({
    queryKey: ['clientes-by-tipo', tipo],
  });
  return entries.some(([, data]) =>
    data?.rows.some((row) => row.cliente.id === clienteId),
  );
}
