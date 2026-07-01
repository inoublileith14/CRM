'use client';

import { ChangeEvent, useRef, useState } from 'react';
import { FileUp, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import {
  CoconutBrandedDialog,
  CoconutBrandedDialogActions,
  CoconutBrandedDialogCancelButton,
  CoconutBrandedDialogPrimaryButton,
  COCONUT_DIALOG_BODY_TEXT_CLASS,
} from '@/components/CoconutBrandedDialog';
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
        className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 transition hover:bg-slate-50 disabled:opacity-60 sm:w-auto"
      >
        {busy ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <FileUp className="h-4 w-4" />
        )}
        Importar Excel
      </button>

      {(parsing || importing) && (
        <CoconutBrandedDialog
          open
          onClose={() => undefined}
          closable={false}
          blockClose
          title={importing ? 'Importando propietarios' : 'Leyendo Excel'}
          subtitle="IMPORTACIÓN"
          size="sm"
        >
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="h-6 w-6 animate-spin text-[#b8924b]" />
            <p className={`m-0 text-sm font-medium ${COCONUT_DIALOG_BODY_TEXT_CLASS}`}>
              {parseStatus}
            </p>
            {importing ? (
              <div className="h-2 w-full overflow-hidden rounded-full bg-[#eadfcd]">
                <div
                  className="h-full bg-[#b8924b] transition-all"
                  style={{
                    width: `${(progress.current / progress.total) * 100}%`,
                  }}
                />
              </div>
            ) : null}
          </div>
        </CoconutBrandedDialog>
      )}

      {showTipoModal && (
        <CoconutBrandedDialog
          open={showTipoModal}
          onClose={closeTipoModal}
          title="Tipo de operación"
          subtitle="IMPORTACIÓN"
          size="sm"
          align="left"
          description="Elige si los propietarios del Excel son para alquiler o venta."
        >
            <div className="grid grid-cols-2 gap-3">
              {(['alquiler', 'venta'] as TipoOperacion[]).map((tipo) => (
                <button
                  key={tipo}
                  type="button"
                  onClick={() => setSelectedTipo(tipo)}
                  className={`rounded-xl border-2 px-4 py-4 text-sm font-semibold transition ${
                    selectedTipo === tipo
                      ? 'border-[#b8924b] bg-[#faf7f1] text-[#24211f]'
                      : 'border-[#e6ddcf] bg-white text-[#5f574f] hover:border-[#b8924b]/40'
                  }`}
                >
                  {TIPO_OPERACION_LABELS[tipo]}
                  <span className="mt-1 block text-xs font-normal text-[#a49a8f]">
                    {tipo === 'alquiler' ? 'Rent' : 'Sell'}
                  </span>
                </button>
              ))}
            </div>

            <CoconutBrandedDialogActions align="end">
              <CoconutBrandedDialogCancelButton onClick={closeTipoModal}>
                Cancelar
              </CoconutBrandedDialogCancelButton>
              <CoconutBrandedDialogPrimaryButton onClick={confirmTipoAndPickFile}>
                Continuar y elegir Excel
              </CoconutBrandedDialogPrimaryButton>
            </CoconutBrandedDialogActions>
        </CoconutBrandedDialog>
      )}

      {pendingRows && summary && !importing && !parsing && (
        <CoconutBrandedDialog
          open
          onClose={closeConfirm}
          title="Importar propietarios"
          subtitle="IMPORTACIÓN"
          size="sm"
          align="left"
        >
            <ul className={`m-0 list-none space-y-2 p-0 ${COCONUT_DIALOG_BODY_TEXT_CLASS}`}>
              <li>
                <strong className="text-[#24211f]">{summary.rows}</strong> propietarios encontrados
              </li>
              <li>
                <strong className="text-[#24211f]">{summary.totalImages}</strong> imágenes en el Excel
              </li>
              <li>
                Tipo: <strong className="text-[#24211f]">{tipoLabel}</strong>
              </li>
            </ul>
            <p className="mt-3 text-xs text-[#a49a8f]">
              Cada propietario se guardará con sus imágenes (Imagen real y Foto
              espejo) subidas en el momento de crear el registro.
            </p>
            <CoconutBrandedDialogActions align="end">
              <CoconutBrandedDialogCancelButton onClick={closeConfirm}>
                Cancelar
              </CoconutBrandedDialogCancelButton>
              <CoconutBrandedDialogPrimaryButton onClick={confirmImport}>
                Guardar {summary.rows} propietarios
              </CoconutBrandedDialogPrimaryButton>
            </CoconutBrandedDialogActions>
        </CoconutBrandedDialog>
      )}
    </>
  );
}
