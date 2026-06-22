import { ApiError } from './api';
import { parseApiResponse } from './parse-api-error';

export async function uploadImage(
  file: File | Blob,
  filename = 'image.jpg',
): Promise<{ url: string; path: string }> {
  const blob = file instanceof File ? file : new File([file], filename);
  const formData = new FormData();
  formData.append('file', blob);

  let res: Response;

  try {
    res = await fetch('/api/storage/upload', {
      method: 'POST',
      body: formData,
    });
  } catch {
    throw new ApiError(
      'No se pudo conectar con el servidor',
      0,
      'NETWORK_ERROR',
    );
  }

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw parseApiResponse(data, res);
  }

  return data as { url: string; path: string };
}
