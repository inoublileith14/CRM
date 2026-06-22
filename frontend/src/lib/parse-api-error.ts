import { ApiError, AuthErrorCode } from './api';

export function parseApiResponse(data: Record<string, unknown>, res: Response) {
  if (typeof data.error === 'string') {
    let code = (data.code as AuthErrorCode) ?? 'UNKNOWN_ERROR';

    if (res.status >= 500 && code === 'UNKNOWN_ERROR') {
      code = 'SERVER_ERROR';
    }

    if (res.status === 503 && code === 'UNKNOWN_ERROR') {
      code = 'SUPABASE_UNAVAILABLE';
    }

    return new ApiError(data.error, res.status, code);
  }

  const nested = data.message;

  const message =
    typeof nested === 'object' && nested !== null
      ? ((nested as { message?: string }).message ?? (data.error as string))
      : ((nested as string) ?? (data.error as string) ?? 'Error en la solicitud');

  let code: AuthErrorCode =
    (typeof nested === 'object' && nested !== null
      ? (nested as { code?: AuthErrorCode }).code
      : (data.code as AuthErrorCode)) ?? 'UNKNOWN_ERROR';

  if (res.status >= 500 && code === 'UNKNOWN_ERROR') {
    code = 'SERVER_ERROR';
  }

  if (res.status === 503 && code === 'UNKNOWN_ERROR') {
    code = 'SUPABASE_UNAVAILABLE';
  }

  return new ApiError(message, res.status, code);
}

export function parseNestProxyError(data: Record<string, unknown>) {
  const nested = data.message;

  if (typeof nested === 'object' && nested !== null) {
    const obj = nested as { message?: string; code?: string };
    return {
      error: obj.message ?? 'Error en la solicitud',
      code: obj.code ?? 'UNKNOWN_ERROR',
    };
  }

  return {
    error: (nested as string) ?? (data.error as string) ?? 'Error en la solicitud',
    code: (data.code as string) ?? 'UNKNOWN_ERROR',
  };
}
