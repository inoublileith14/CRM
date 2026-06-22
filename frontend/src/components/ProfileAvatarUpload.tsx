'use client';

import { ChangeEvent, useRef, useState } from 'react';
import { Camera, Loader2, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { UserAvatar } from '@/components/UserAvatar';
import { useCurrentUser } from '@/contexts/CurrentUserContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { updateProfile } from '@/lib/api';
import { uploadImage } from '@/lib/storage-api';

export function ProfileAvatarUpload() {
  const { user, setUser } = useCurrentUser();
  const { t } = useLanguage();
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  if (!user) return null;

  const displayName = user.nombre || user.email;

  async function handleFileChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Selecciona un archivo de imagen');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('La imagen no puede superar 5 MB');
      return;
    }

    setUploading(true);
    try {
      const { url } = await uploadImage(file);
      const updated = await updateProfile({ avatar_url: url });
      setUser(updated);
      toast.success('Foto de perfil actualizada');
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Error al subir la foto',
      );
    } finally {
      setUploading(false);
    }
  }

  async function handleRemove() {
    if (!confirm('¿Quitar la foto de perfil?')) return;

    setUploading(true);
    try {
      const updated = await updateProfile({ avatar_url: null });
      setUser(updated);
      toast.success('Foto de perfil eliminada');
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Error al quitar la foto',
      );
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-4">
      <div className="relative">
        <UserAvatar
          name={displayName}
          avatarUrl={user.avatar_url}
          size="lg"
        />
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="absolute bottom-0 right-0 flex h-9 w-9 items-center justify-center rounded-full border-2 border-white bg-emerald-600 text-white shadow transition hover:bg-emerald-500 disabled:opacity-60"
          title={t('profile.changePhoto')}
        >
          {uploading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Camera className="h-4 w-4" />
          )}
        </button>
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          className="hidden"
          onChange={handleFileChange}
          disabled={uploading}
        />
      </div>

      <div>
        <p className="text-lg font-semibold text-slate-900">{user.nombre}</p>
        <p className="text-sm text-slate-500">{user.email}</p>
        {user.avatar_url && (
          <button
            type="button"
            onClick={handleRemove}
            disabled={uploading}
            className="mt-2 inline-flex items-center gap-1.5 text-sm font-medium text-red-600 hover:text-red-500 disabled:opacity-60"
          >
            <Trash2 className="h-3.5 w-3.5" />
            {t('profile.removePhoto')}
          </button>
        )}
      </div>
    </div>
  );
}
