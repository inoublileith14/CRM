import { toast } from 'sonner';
import { ApiError, AuthErrorCode } from './api';

const ERROR_MESSAGES: Partial<Record<AuthErrorCode, string>> = {
  INVALID_CREDENTIALS: 'Correo o contraseña incorrectos',
  EMAIL_NOT_CONFIRMED: 'Debes confirmar tu correo antes de iniciar sesión',
  TOO_MANY_REQUESTS: 'Demasiados intentos. Espera un momento e inténtalo de nuevo',
  PROFILE_NOT_FOUND: 'Tu cuenta no tiene perfil en la base de datos. Contacta al administrador',
  SUPABASE_UNAVAILABLE: 'El servicio de autenticación no está disponible',
  SESSION_ERROR: 'No se pudo crear la sesión. Inténtalo de nuevo',
  AUTH_ERROR: 'Error al iniciar sesión. Inténtalo de nuevo',
  NETWORK_ERROR: 'No se pudo conectar con el servidor. ¿Está el backend activo?',
  SERVER_ERROR: 'Error interno del servidor. Inténtalo más tarde',
  UNKNOWN_ERROR: 'Ha ocurrido un error inesperado',
};

const REASON_MESSAGES: Record<string, string> = {
  session_required: 'Debes iniciar sesión para acceder al panel',
  session_expired: 'Tu sesión ha expirado. Vuelve a iniciar sesión',
};

export function toastLoginReason(reason: string | null) {
  if (!reason || !REASON_MESSAGES[reason]) return;
  toast.warning(REASON_MESSAGES[reason], { id: `reason-${reason}` });
}

export function toastValidationError(message: string) {
  toast.warning(message, { id: 'validation-error' });
}

export function toastLoginLoading() {
  return toast.loading('Verificando credenciales…', { id: 'login-loading' });
}

export function toastLoginSuccess(nombre: string) {
  toast.success(`¡Bienvenido, ${nombre}!`, {
    id: 'login-success',
    description: 'Redirigiendo al panel…',
  });
}

export function toastLoginError(error: unknown) {
  if (error instanceof ApiError) {
    const message = ERROR_MESSAGES[error.code] ?? error.message;
    toast.error(message, {
      id: 'login-error',
      description: error.code === 'NETWORK_ERROR' ? 'Puerto esperado: 3001' : undefined,
    });
    return;
  }

  toast.error(ERROR_MESSAGES.UNKNOWN_ERROR, { id: 'login-error' });
}

export function dismissLoginLoading() {
  toast.dismiss('login-loading');
}

export function validateLoginForm(email: string, password: string): string | null {
  const trimmedEmail = email.trim();

  if (!trimmedEmail) {
    return 'Introduce tu correo electrónico';
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
    return 'El formato del correo no es válido';
  }

  if (!password) {
    return 'Introduce tu contraseña';
  }

  if (password.length < 4) {
    return 'La contraseña debe tener al menos 4 caracteres';
  }

  return null;
}
