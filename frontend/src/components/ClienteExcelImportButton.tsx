'use client';

import { ChangeEvent, useEffect, useRef, useState } from 'react';
import { FileUp } from 'lucide-react';
import { toast } from 'sonner';
import {
  CoconutBrandedDialog,
  CoconutBrandedDialogActions,
  CoconutBrandedDialogCancelButton,
  CoconutBrandedDialogPrimaryButton,
  COCONUT_DIALOG_BODY_TEXT_CLASS,
} from '@/components/CoconutBrandedDialog';
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
    `rounded-xl border-2 px-4 py-3 text-left text-sm font-semibold transition ${
      pendingTipo === tipo
        ? 'border-[#b8924b] bg-[#faf7f1] text-[#24211f]'
        : 'border-[#e6ddcf] bg-white text-[#5f574f] hover:border-[#b8924b]/40'
    }`;

  const progressPercent =
    importPhase === 'uploading'
      ? 0
      : importProgress.total > 0
        ? Math.round((importProgress.current / importProgress.total) * 100)
        : 0;

  const importOverlay = (
    <CoconutBrandedDialog
      open={importing}
      onClose={() => undefined}
      closable={false}
      blockClose
      title={
        importPhase === 'uploading'
          ? 'Subiendo Excel…'
          : importProgress.total > 0
            ? 'Guardando clientes…'
            : 'Procesando Excel…'
      }
      subtitle="IMPORTACIÓN"
      titleId="cliente-import-title"
      size="sm"
      zIndexClass="z-[200]"
    >
      <div className="flex flex-col items-center">
        <div className="mx-auto mb-6 flex justify-center">
          {importPhase === 'uploading' ||
          (importPhase === 'processing' && importProgress.total === 0) ? (
            <div className="h-[88px] w-[88px] animate-spin rounded-full border-[6px] border-[#eadfcd] border-t-[#b8924b]" />
          ) : (
            <CircularProgress percent={progressPercent} />
          )}
        </div>
        <p id="cliente-import-desc" className={`m-0 ${COCONUT_DIALOG_BODY_TEXT_CLASS}`}>
          No cierres esta ventana ni navegues a otra página hasta que termine la
          importación.
        </p>
        {importPhase === 'processing' && importProgress.total > 0 ? (
          <p className="mt-3 text-xs font-medium text-[#a49a8f]">
            {importProgress.current} de {importProgress.total} filas
          </p>
        ) : null}
      </div>
    </CoconutBrandedDialog>
  );

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
        <CoconutBrandedDialog
          open={tipoModalOpen}
          onClose={() => setTipoModalOpen(false)}
          title="Tipo de clientes"
          subtitle="IMPORTACIÓN"
          size="sm"
          align="left"
          description="Elige si estos clientes son de alquiler o de venta antes de importar el Excel."
        >
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

            <CoconutBrandedDialogActions align="end">
              <CoconutBrandedDialogCancelButton onClick={() => setTipoModalOpen(false)}>
                Cancelar
              </CoconutBrandedDialogCancelButton>
              <CoconutBrandedDialogPrimaryButton
                onClick={confirmTipoAndPickFile}
                disabled={!pendingTipo}
              >
                Elegir archivo
              </CoconutBrandedDialogPrimaryButton>
            </CoconutBrandedDialogActions>
        </CoconutBrandedDialog>
      )}
    </>
  );
}
