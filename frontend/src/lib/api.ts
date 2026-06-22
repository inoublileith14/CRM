import { getBackendUrl } from './backend-url';
import { parseApiResponse } from './parse-api-error';

export interface AuthUser {
  id: string;
  email: string;
  nombre: string;
  rol: string;
  avatar_url?: string | null;
}

export type AuthErrorCode =
  | 'INVALID_CREDENTIALS'
  | 'EMAIL_NOT_CONFIRMED'
  | 'EMAIL_REQUIRED'
  | 'EMAIL_NOT_FOUND'
  | 'RESET_EMAIL_SENT'
  | 'INVALID_RESET_TOKEN'
  | 'WEAK_PASSWORD'
  | 'PASSWORD_MISMATCH'
  | 'SAME_PASSWORD'
  | 'PASSWORD_RESET_SUCCESS'
  | 'RESET_ERROR'
  | 'TOO_MANY_REQUESTS'
  | 'PROFILE_NOT_FOUND'
  | 'SUPABASE_UNAVAILABLE'
  | 'SESSION_ERROR'
  | 'AUTH_ERROR'
  | 'NAME_REQUIRED'
  | 'EMAIL_ALREADY_EXISTS'
  | 'INVALID_EMAIL'
  | 'REGISTER_SUCCESS'
  | 'REGISTER_ERROR'
  | 'SUPABASE_CONFIG_ERROR'
  | 'NETWORK_ERROR'
  | 'SERVER_ERROR'
  | 'UNKNOWN_ERROR'
  | 'CLIENTE_DUPLICATE';

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public code: AuthErrorCode = 'UNKNOWN_ERROR',
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export async function login(
  email: string,
  password: string,
): Promise<{ user: AuthUser }> {
  let res: Response;

  try {
    res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
  } catch {
    throw new ApiError(
      'No se pudo conectar con el servidor. Comprueba que el backend esté activo.',
      0,
      'NETWORK_ERROR',
    );
  }

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw parseApiResponse(data, res);
  }

  return data;
}

export async function register(
  nombre: string,
  email: string,
  password: string,
): Promise<{ user: AuthUser; mensaje: string }> {
  let res: Response;

  try {
    res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nombre, email, password }),
    });
  } catch {
    throw new ApiError(
      'No se pudo conectar con el servidor. Comprueba que el backend esté activo.',
      0,
      'NETWORK_ERROR',
    );
  }

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw parseApiResponse(data, res);
  }

  return data;
}

export async function requestPasswordReset(
  email: string,
): Promise<{ mensaje: string }> {
  let res: Response;

  try {
    res = await fetch('/api/auth/forgot-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
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

  return data;
}

export async function resetPassword(
  accessToken: string,
  refreshToken: string,
  password: string,
): Promise<{ mensaje: string }> {
  let res: Response;

  try {
    res = await fetch('/api/auth/reset-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ accessToken, refreshToken, password }),
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

  return data;
}

export async function logout(): Promise<void> {
  try {
    await fetch('/api/auth/logout', { method: 'POST' });
  } catch {
    // La cookie se borra en el cliente aunque falle la petición
  }
}

export async function getMe(): Promise<AuthUser | null> {
  try {
    const res = await fetch('/api/auth/me');
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

export async function updateProfile(data: {
  nombre?: string;
  avatar_url?: string | null;
}): Promise<AuthUser> {
  const res = await fetch('/api/auth/profile', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw parseApiResponse(body, res);
  }
  return body as AuthUser;
}

export { getBackendUrl as API_URL };
