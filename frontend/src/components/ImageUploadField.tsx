'use client';

import { ChangeEvent, useState } from 'react';
import { Expand, ImageIcon, Loader2, Trash2, Upload } from 'lucide-react';
import { toast } from 'sonner';
import { ImagePreviewModal } from '@/components/ImagePreviewModal';
import { uploadImage } from '@/lib/storage-api';

interface ImageUploadFieldProps {
  name: string;
  label: string;
  defaultUrl?: string | null;
  disabled?: boolean;
}

export function ImageUploadField({
  name,
  label,
  defaultUrl,
  disabled = false,
}: ImageUploadFieldProps) {
  const [url, setUrl] = useState(defaultUrl ?? '');
  const [uploading, setUploading] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);

  async function handleFileChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Selecciona un archivo de imagen');
      e.target.value = '';
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('La imagen no puede superar 5 MB');
      e.target.value = '';
      return;
    }

    setUploading(true);
    try {
      const { url: uploadedUrl } = await uploadImage(file);
      setUrl(uploadedUrl);
      toast.success('Imagen subida');
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Error al subir la imagen',
      );
      e.target.value = '';
    } finally {
      setUploading(false);
    }
  }

  function clearImage() {
    setUrl('');
  }

  const fileInput = (
    <input
      type="file"
      accept="image/jpeg,image/png,image/webp,image/gif"
      className="hidden"
      onChange={handleFileChange}
      disabled={disabled || uploading}
    />
  );

  return (
    <div className="flex h-full flex-col">
      <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-600">
        {label}
      </label>

      <input type="hidden" name={name} value={url} />

      {url ? (
        <div className="flex flex-1 flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <button
            type="button"
            onClick={() => setPreviewOpen(true)}
            className="group relative flex min-h-[300px] flex-1 cursor-zoom-in items-center justify-center bg-gradient-to-b from-slate-50 to-slate-100 p-6"
            title="Ver imagen en grande"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={url}
              alt={label}
              className="max-h-[400px] w-auto max-w-full rounded-md object-contain shadow-md ring-1 ring-slate-200/80"
            />
            <span className="absolute bottom-4 right-4 inline-flex items-center gap-1.5 rounded-full bg-slate-900/75 px-3 py-1.5 text-xs font-medium text-white opacity-0 backdrop-blur-sm transition group-hover:opacity-100">
              <Expand className="h-3.5 w-3.5" />
              Ver en grande
            </span>
          </button>

          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 bg-slate-50 px-4 py-3">
            <span className="text-xs text-slate-500">Imagen guardada</span>
            {!disabled && !uploading && (
              <div className="flex flex-wrap gap-2">
                <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 transition hover:border-emerald-400 hover:text-emerald-700">
                  <Upload className="h-3.5 w-3.5" />
                  Cambiar
                  {fileInput}
                </label>
                <button
                  type="button"
                  onClick={clearImage}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 bg-white px-3 py-1.5 text-xs font-medium text-red-600 transition hover:bg-red-50"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  Quitar
                </button>
              </div>
            )}
          </div>
        </div>
      ) : (
        <label
          className={`flex min-h-[300px] flex-1 cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 px-6 py-10 text-center transition hover:border-emerald-400 hover:bg-emerald-50/40 ${
            disabled || uploading ? 'pointer-events-none opacity-60' : ''
          }`}
        >
          {uploading ? (
            <>
              <Loader2 className="h-10 w-10 animate-spin text-emerald-600" />
              <span className="mt-3 text-sm text-slate-600">Subiendo imagen…</span>
            </>
          ) : (
            <>
              <div className="rounded-full bg-white p-4 shadow-sm ring-1 ring-slate-200">
                <ImageIcon className="h-8 w-8 text-slate-400" />
              </div>
              <span className="mt-4 text-sm font-medium text-slate-700">
                Clic para subir imagen
              </span>
              <span className="mt-1 text-xs text-slate-400">
                JPEG, PNG, WebP o GIF — máx. 5 MB
              </span>
            </>
          )}
          {fileInput}
        </label>
      )}

      {previewOpen && url && (
        <ImagePreviewModal
          src={url}
          alt={label}
          onClose={() => setPreviewOpen(false)}
        />
      )}
    </div>
  );
}
