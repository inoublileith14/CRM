'use client';

import { ChangeEvent, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { FileUp, X } from 'lucide-react';
import { toast } from 'sonner';
import {
  getClienteImportJob,
  uploadClienteImportJob,
} from '@/lib/clientes-api';
import { TIPO_OPERACION_LABELS, TipoOperacion } from '@/types/inmueble';

const IMPORT_POLL_INTERVAL_MS = 1500;

interface ClienteExcelImportButtonProps {
  onComplete: () => void;
  disabled?: boolean;
  compact?: boolean;
  /** Vincula cada cliente importado a este inmueble (sin trabajador) */
  inmuebleId?: string;
  /** Vincula cada cliente importado a este trabajador (solo importación general) */
  workerId?: string;
  /** Tipo fijo para todos los clientes importados */
  tipoOperacion?: TipoOperacion;
  /** Pide elegir alquiler/venta antes de seleccionar el Excel */
  requireTipoSelection?: boolean;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function CircularProgress({ percent }: { percent: number }) {
  const size = 88;
  const stroke = 6;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percent / 100) * circumference;

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg
        width={size}
        height={size}
        className="-rotate-90"
        aria-hidden
      >
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={stroke}
          className="text-slate-200"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="text-emerald-600 transition-[stroke-dashoffset] duration-300"
        />
      </svg>
      <span className="absolute inset-0 flex items-center justify-center text-sm font-bold text-slate-900">
        {percent}%
      </span>
    </div>
  );
}

export function ClienteExcelImportButton({
  onComplete,
  disabled,
  compact = false,
  inmuebleId,
  workerId,
  tipoOperacion,
  requireTipoSelection = false,
}: ClienteExcelImportButtonProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [importing, setImporting] = useState(false);
  const [importPhase, setImportPhase] = useState<'uploading' | 'processing'>(
    'uploading',
  );
  const [importProgress, setImportProgress] = useState({ current: 0, total: 0 });
  const [tipoModalOpen, setTipoModalOpen] = useState(false);
  const [pendingTipo, setPendingTipo] = useState<TipoOperacion | null>(
    tipoOperacion ?? null,
  );

  useEffect(() => {
    if (!importing) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    function handleBeforeUnload(event: BeforeUnloadEvent) {
      event.preventDefault();
      event.returnValue = '';
    }

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [importing]);

  async function pollImportJob(jobId: string) {
    while (true) {
      const job = await getClienteImportJob(jobId);

      setImportProgress({
        current: job.processed_rows,
        total: job.total_rows,
      });

      if (job.status === 'completed') {
        const { created_count: ok, skipped_count: skipped, failed_count: failed } =
          job;

        if (ok > 0) {
          toast.success(
            `${ok} cliente${ok !== 1 ? 's' : ''} importado${ok !== 1 ? 's' : ''}`,
          );
          onComplete();
        } else if (skipped > 0 && failed === 0) {
          onComplete();
        }
        if (skipped > 0) {
          toast.message(
            `${skipped} fila${skipped !== 1 ? 's' : ''} omitida${skipped !== 1 ? 's' : ''} (mismo teléfono, fecha e inmueble)`,
          );
        }
        if (failed > 0) {
          toast.error(
            `${failed} fila${failed !== 1 ? 's' : ''} no se pudieron importar`,
          );
        }
        if (ok === 0 && skipped === 0 && failed === 0) {
          toast.error('No hay clientes nuevos para importar');
        }
        return;
      }

      if (job.status === 'failed') {
        toast.error(job.error_message ?? 'Error al importar clientes');
        return;
      }

      await sleep(IMPORT_POLL_INTERVAL_MS);
    }
  }

  async function runImport(
    file: File,
    resolvedTipo: TipoOperacion | null | undefined,
  ) {
    setImporting(true);
    setImportPhase('uploading');
    setImportProgress({ current: 0, total: 0 });
    try {
      const importOptions = {
        inmueble_id: inmuebleId,
        worker_id: workerId,
        tipo_operacion: resolvedTipo ?? undefined,
        skip_duplicates: true,
      };

      const { jobId } = await uploadClienteImportJob(file, importOptions);

      setImportPhase('processing');
      await pollImportJob(jobId);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Error al importar el Excel',
      );
    } finally {
      setImporting(false);
      setImportProgress({ current: 0, total: 0 });
      setPendingTipo(tipoOperacion ?? null);
    }
  }

  async function handleFileChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    const lower = file.name.toLowerCase();
    if (!lower.endsWith('.xls') && !lower.endsWith('.xlsx')) {
      toast.error('Selecciona un archivo Excel (.xls o .xlsx)');
      return;
    }

    const resolvedTipo = tipoOperacion ?? pendingTipo;
    if (requireTipoSelection && !inmuebleId && !resolvedTipo) {
      toast.error('Selecciona el tipo de cliente (alquiler o venta)');
      return;
    }

    await runImport(file, resolvedTipo);
  }

  function openImportFlow() {
    if (requireTipoSelection && !tipoOperacion && !inmuebleId) {
      setPendingTipo(null);
      setTipoModalOpen(true);
      return;
    }
    inputRef.current?.click();
  }

  function confirmTipoAndPickFile() {
    if (!pendingTipo) {
      toast.error('Selecciona alquiler o venta');
      return;
    }
    setTipoModalOpen(false);
    inputRef.current?.click();
  }

  const tipoChoiceClass = (tipo: TipoOperacion) =>
    `rounded-lg border px-4 py-3 text-left text-sm font-semibold transition ${
      pendingTipo === tipo
        ? tipo === 'alquiler'
          ? 'border-emerald-600 bg-emerald-50 text-emerald-800'
          : 'border-blue-600 bg-blue-50 text-blue-800'
        : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
    }`;

  const progressPercent =
    importPhase === 'uploading'
      ? 0
      : importProgress.total > 0
        ? Math.round((importProgress.current / importProgress.total) * 100)
        : 0;

  const importOverlay =
    importing && typeof document !== 'undefined'
      ? createPortal(
          <div
            className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-900/70 p-6 backdrop-blur-sm"
            role="alertdialog"
            aria-modal="true"
            aria-busy="true"
            aria-labelledby="cliente-import-title"
            aria-describedby="cliente-import-desc"
          >
            <div className="w-full max-w-sm rounded-2xl border border-slate-200 bg-white px-8 py-10 text-center shadow-2xl">
              <div className="mx-auto mb-6 flex justify-center">
                {importPhase === 'uploading' ||
                (importPhase === 'processing' && importProgress.total === 0) ? (
                  <div className="h-[88px] w-[88px] animate-spin rounded-full border-[6px] border-slate-200 border-t-emerald-600" />
                ) : (
                  <CircularProgress percent={progressPercent} />
                )}
              </div>
              <h2
                id="cliente-import-title"
                className="text-lg font-semibold text-slate-900"
              >
                {importPhase === 'uploading'
                  ? 'Subiendo Excel…'
                  : importProgress.total > 0
                    ? 'Guardando clientes…'
                    : 'Procesando Excel…'}
              </h2>
              <p id="cliente-import-desc" className="mt-2 text-sm text-slate-600">
                No cierres esta ventana ni navegues a otra página hasta que
                termine la importación.
              </p>
              {importPhase === 'processing' && importProgress.total > 0 && (
                <p className="mt-3 text-xs font-medium text-slate-500">
                  {importProgress.current} de {importProgress.total} filas
                </p>
              )}
            </div>
          </div>,
          document.body,
        )
      : null;

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept=".xls,.xlsx,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        className="hidden"
        onChange={handleFileChange}
      />
      <button
        type="button"
        onClick={openImportFlow}
        disabled={disabled || importing}
        className={
          compact
            ? 'inline-flex shrink-0 items-center justify-center gap-1 rounded-md border border-slate-300 bg-white px-2 py-1 text-xs font-medium text-slate-700 transition hover:bg-slate-50 disabled:opacity-60'
            : 'inline-flex w-full items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-60 sm:w-auto'
        }
      >
        <FileUp className={compact ? 'h-3.5 w-3.5' : 'h-4 w-4'} />
        {compact ? 'Importar' : 'Importar Excel'}
      </button>

      {importOverlay}

      {tipoModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <button
            type="button"
            aria-label="Cerrar"
            className="absolute inset-0 bg-slate-900/50"
            onClick={() => setTipoModalOpen(false)}
          />
          <div className="relative z-10 w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl">
            <div className="mb-4 flex items-start justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">
                  Tipo de clientes
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Elige si estos clientes son de alquiler o de venta antes de
                  importar el Excel.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setTipoModalOpen(false)}
                className="rounded p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="grid gap-2 sm:grid-cols-2">
              {(['alquiler', 'venta'] as const).map((tipo) => (
                <button
                  key={tipo}
                  type="button"
                  onClick={() => setPendingTipo(tipo)}
                  className={tipoChoiceClass(tipo)}
                >
                  {TIPO_OPERACION_LABELS[tipo]}
                </button>
              ))}
            </div>

            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setTipoModalOpen(false)}
                className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={confirmTipoAndPickFile}
                disabled={!pendingTipo}
                className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-500 disabled:opacity-50"
              >
                Elegir archivo
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
