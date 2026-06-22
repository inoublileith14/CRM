import { toast } from 'sonner';
import { ApiError, AuthErrorCode } from './api';

const RESET_ERROR_MESSAGES: Record<string, string> = {
  EMAIL_REQUIRED: 'Introduce tu correo electrónico',
  EMAIL_NOT_FOUND: 'No existe una cuenta con ese correo',
  RESET_EMAIL_SENT: 'Revisa tu bandeja de entrada. Te enviamos un enlace de recuperación',
  INVALID_RESET_TOKEN: 'El enlace ha expirado. Solicita uno nuevo',
  WEAK_PASSWORD: 'La contraseña debe tener al menos 4 caracteres',
  PASSWORD_MISMATCH: 'Las contraseñas no coinciden',
  SAME_PASSWORD: 'La nueva contraseña debe ser diferente a la anterior',
  PASSWORD_RESET_SUCCESS: '¡Contraseña actualizada! Ya puedes iniciar sesión',
  TOO_MANY_REQUESTS: 'Demasiados intentos. Espera un momento',
  SUPABASE_UNAVAILABLE: 'El servicio no está disponible',
  RESET_ERROR: 'No se pudo restablecer la contraseña',
  NETWORK_ERROR: 'No se pudo conectar con el servidor',
  UNKNOWN_ERROR: 'Ha ocurrido un error inesperado',
};

export function toastResetError(error: unknown) {
  if (error instanceof ApiError) {
    toast.error(RESET_ERROR_MESSAGES[error.code] ?? error.message, {
      id: 'reset-error',
    });
    return;
  }

  toast.error(RESET_ERROR_MESSAGES.UNKNOWN_ERROR, { id: 'reset-error' });
}

export function toastResetSuccess(message: string) {
  toast.success(message, { id: 'reset-success' });
}

export function toastResetLoading(message: string) {
  return toast.loading(message, { id: 'reset-loading' });
}

export function dismissResetLoading() {
  toast.dismiss('reset-loading');
}

export function toastResetValidation(message: string) {
  toast.warning(message, { id: 'reset-validation' });
}

export function getResetErrorMessage(code: AuthErrorCode | string): string {
  return RESET_ERROR_MESSAGES[code] ?? RESET_ERROR_MESSAGES.UNKNOWN_ERROR;
}
