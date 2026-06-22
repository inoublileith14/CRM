'use client';

import { ChangeEvent, useRef, useState } from 'react';
import { FileUp, Loader2, X } from 'lucide-react';
import { toast } from 'sonner';
import { createInmueble } from '@/lib/inmuebles-api';
import {
  ExcelParseProgress,
  ImportRow,
  bufferToFile,
  parseInmuebleExcel,
} from '@/lib/parse-inmueble-excel';
import { uploadImage } from '@/lib/storage-api';
import {
  TIPO_OPERACION_LABELS,
  TipoOperacion,
} from '@/types/inmueble';

interface ExcelImportButtonProps {
  onComplete: () => void;
  disabled?: boolean;
  fixedTipo?: TipoOperacion;
}

interface ImportSummary {
  rows: number;
  totalImages: number;
}

const EXCEL_EXTENSIONS = ['.xlsx', '.xlsm'];

function isExcelFile(name: string): boolean {
  const lower = name.toLowerCase();
  return EXCEL_EXTENSIONS.some((ext) => lower.endsWith(ext));
}

export function ExcelImportButton({
  onComplete,
  disabled,
  fixedTipo,
}: ExcelImportButtonProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [importing, setImporting] = useState(false);
  const [parsing, setParsing] = useState(false);
  const [parseStatus, setParseStatus] = useState('');
  const [progress, setProgress] = useState({ current: 0, total: 0 });
  const [showTipoModal, setShowTipoModal] = useState(false);
  const [selectedTipo, setSelectedTipo] = useState<TipoOperacion | null>(null);
  const [pendingRows, setPendingRows] = useState<ImportRow[] | null>(null);
  const [summary, setSummary] = useState<ImportSummary | null>(null);

  function openTipoModal() {
    if (fixedTipo) {
      setSelectedTipo(fixedTipo);
      inputRef.current?.click();
      return;
    }
    setSelectedTipo(null);
    setShowTipoModal(true);
  }

  function closeTipoModal() {
    if (!importing && !parsing) {
      setShowTipoModal(false);
      setSelectedTipo(null);
    }
  }

  function confirmTipoAndPickFile() {
    if (!selectedTipo) {
      toast.error('Selecciona alquiler o venta antes de continuar');
      return;
    }
    setShowTipoModal(false);
    inputRef.current?.click();
  }

  function handleParseProgress(p: ExcelParseProgress) {
    if (p.phase === 'reading') {
      setParseStatus('Leyendo Excel…');
    } else {
      setParseStatus(
        `Guardando propietario ${p.current} / ${p.total} (con imágenes)…`,
      );
    }
  }

  const activeTipo = selectedTipo ?? fixedTipo ?? null;

  async function handleFileChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    if (!activeTipo) {
      toast.error('Selecciona alquiler o venta primero');
      return;
    }

    if (!isExcelFile(file.name)) {
      toast.error('Selecciona un archivo Excel (.xlsx)');
      return;
    }

    setParsing(true);
    setParseStatus('Leyendo Excel…');

    try {
      const buffer = await file.arrayBuffer();
      const result = await parseInmuebleExcel(buffer, handleParseProgress, {
        tipoOperacion: activeTipo,
      });

      if (result.rows.length === 0) {
        toast.error('El Excel no contiene propietarios válidos');
        return;
      }

      setSummary({
        rows: result.totalRows,
        totalImages: result.totalImages,
      });
      setPendingRows(result.rows);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Error al leer el Excel',
      );
    } finally {
      setParsing(false);
      setParseStatus('');
    }
  }

  function closeConfirm() {
    if (!importing) {
      setPendingRows(null);
      setSummary(null);
      setSelectedTipo(null);
    }
  }

  async function confirmImport() {
    if (!pendingRows?.length || !activeTipo) return;

    setImporting(true);
    setProgress({ current: 0, total: pendingRows.length });

    let ok = 0;
    let failed = 0;
    const errors: string[] = [];

    for (let i = 0; i < pendingRows.length; i++) {
      const { data, images } = pendingRows[i];

      handleParseProgress({
        phase: 'saving',
        current: i + 1,
        total: pendingRows.length,
      });
      setParseStatus(
        `Guardando propietario ${i + 1} / ${pendingRows.length} (subiendo imágenes)…`,
      );

      try {
        const payload = { ...data, tipo_operacion: activeTipo };

        for (const img of images) {
          try {
            const file = bufferToFile(img.buffer, img.extension);
            const { url } = await uploadImage(file);
            payload[img.field] = url;
          } catch {
            // Si una imagen falla, se guarda el inmueble sin esa imagen
          }
        }

        const ownerName = payload.nombre_propi?.trim();
        if (ownerName) {
          payload.propietarios_contactos = [
            {
              nombre: ownerName,
              telf: payload.telf?.trim() || null,
            },
          ];
        } else {
          payload.propietarios_contactos = [];
        }
        payload.propietario_id = null;

        await createInmueble(payload);
        ok++;
      } catch (err) {
        failed++;
        if (errors.length < 3) {
          const msg =
            err instanceof Error ? err.message : 'Error desconocido al guardar';
          errors.push(`Fila ${i + 1}: ${msg}`);
        }
      }

      setProgress({ current: i + 1, total: pendingRows.length });
    }

    setImporting(false);
    setPendingRows(null);
    setSummary(null);
    setSelectedTipo(null);
    setParseStatus('');

    if (ok > 0) {
      toast.success(
        `${ok} propietario${ok !== 1 ? 's' : ''} importado${ok !== 1 ? 's' : ''} con todos sus datos e imágenes`,
      );
      onComplete();
    }
    if (failed > 0) {
      const detail = errors.length ? ` (${errors.join('; ')})` : '';
      toast.error(
        `${failed} propietario${failed !== 1 ? 's' : ''} no se pudieron guardar${detail}`,
      );
    }
  }

  const tipoLabel = activeTipo ? TIPO_OPERACION_LABELS[activeTipo] : '';
  const busy = importing || parsing;

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept=".xlsx,.xlsm,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        className="hidden"
        onChange={handleFileChange}
      />

      <button
        type="button"
        onClick={openTipoModal}
        disabled={disabled || busy}
        className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-60 sm:w-auto"
      >
        {busy ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <FileUp className="h-4 w-4" />
        )}
        Importar Excel
      </button>

      {(parsing || importing) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
          <div className="flex min-w-[280px] flex-col items-center gap-3 rounded-xl bg-white px-6 py-4 shadow-xl">
            <Loader2 className="h-5 w-5 animate-spin text-emerald-600" />
            <p className="text-sm font-medium text-slate-700">{parseStatus}</p>
            {importing && (
              <div className="h-2 w-full overflow-hidden rounded-full bg-slate-200">
                <div
                  className="h-full bg-emerald-600 transition-all"
                  style={{
                    width: `${(progress.current / progress.total) * 100}%`,
                  }}
                />
              </div>
            )}
          </div>
        </div>
      )}

      {showTipoModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <button
            type="button"
            aria-label="Cerrar"
            className="absolute inset-0 bg-slate-900/50"
            onClick={closeTipoModal}
          />
          <div className="relative z-10 w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-slate-900">
                Tipo de operación
              </h2>
              <button
                type="button"
                onClick={closeTipoModal}
                className="rounded p-1 text-slate-400 hover:bg-slate-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <p className="mb-4 text-sm text-slate-600">
              Elige si los propietarios del Excel son para alquiler o venta.
            </p>

            <div className="grid grid-cols-2 gap-3">
              {(['alquiler', 'venta'] as TipoOperacion[]).map((tipo) => (
                <button
                  key={tipo}
                  type="button"
                  onClick={() => setSelectedTipo(tipo)}
                  className={`rounded-xl border-2 px-4 py-4 text-sm font-semibold transition ${
                    selectedTipo === tipo
                      ? 'border-emerald-600 bg-emerald-50 text-emerald-800'
                      : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                  }`}
                >
                  {TIPO_OPERACION_LABELS[tipo]}
                  <span className="mt-1 block text-xs font-normal text-slate-500">
                    {tipo === 'alquiler' ? 'Rent' : 'Sell'}
                  </span>
                </button>
              ))}
            </div>

            <div className="mt-6 flex flex-wrap justify-end gap-3">
              <button
                type="button"
                onClick={closeTipoModal}
                className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={confirmTipoAndPickFile}
                className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-500"
              >
                Continuar y elegir Excel
              </button>
            </div>
          </div>
        </div>
      )}

      {pendingRows && summary && !importing && !parsing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <button
            type="button"
            aria-label="Cerrar"
            className="absolute inset-0 bg-slate-900/50"
            onClick={closeConfirm}
          />
          <div className="relative z-10 w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-slate-900">
                Importar propietarios
              </h2>
              <button
                type="button"
                onClick={closeConfirm}
                className="rounded p-1 text-slate-400 hover:bg-slate-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <ul className="space-y-2 text-sm text-slate-600">
              <li>
                <strong>{summary.rows}</strong> propietarios encontrados
              </li>
              <li>
                <strong>{summary.totalImages}</strong> imágenes en el Excel
              </li>
              <li>
                Tipo: <strong>{tipoLabel}</strong>
              </li>
            </ul>
            <p className="mt-3 text-xs text-slate-400">
              Cada propietario se guardará con sus imágenes (Imagen real y Foto
              espejo) subidas en el momento de crear el registro.
            </p>
            <div className="mt-6 flex flex-wrap justify-end gap-3">
              <button
                type="button"
                onClick={closeConfirm}
                className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={confirmImport}
                className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-500"
              >
                Guardar {summary.rows} propietarios
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
