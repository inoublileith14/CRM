import { toast } from 'sonner';
import { ApiError } from './api';

const REGISTER_ERROR_MESSAGES: Record<string, string> = {
  NAME_REQUIRED: 'Introduce tu nombre completo',
  EMAIL_REQUIRED: 'Introduce tu correo electrónico',
  INVALID_EMAIL: 'El formato del correo no es válido',
  EMAIL_ALREADY_EXISTS: 'Ya existe una cuenta con ese correo',
  WEAK_PASSWORD: 'La contraseña debe tener al menos 4 caracteres',
  PASSWORD_MISMATCH: 'Las contraseñas no coinciden',
  REGISTER_SUCCESS: '¡Cuenta creada! Redirigiendo al panel…',
  REGISTER_ERROR: 'No se pudo crear la cuenta',
  SUPABASE_CONFIG_ERROR:
    'Error de configuración del servidor (clave Supabase incorrecta)',
  NETWORK_ERROR: 'No se pudo conectar con el servidor',
  UNKNOWN_ERROR: 'Ha ocurrido un error inesperado',
};

export function toastRegisterValidation(message: string) {
  toast.warning(message, { id: 'register-validation' });
}

export function toastRegisterLoading() {
  return toast.loading('Creando tu cuenta…', { id: 'register-loading' });
}

export function dismissRegisterLoading() {
  toast.dismiss('register-loading');
}

export function toastRegisterSuccess(nombre: string) {
  toast.success(`¡Bienvenido, ${nombre}!`, {
    id: 'register-success',
    description: 'Tu cuenta ha sido creada correctamente',
  });
}

export function toastRegisterError(error: unknown) {
  if (error instanceof ApiError) {
    toast.error(REGISTER_ERROR_MESSAGES[error.code] ?? error.message, {
      id: 'register-error',
      description:
        error.code === 'NETWORK_ERROR' ? 'Puerto esperado: 3001' : undefined,
    });
    return;
  }

  toast.error(REGISTER_ERROR_MESSAGES.UNKNOWN_ERROR, { id: 'register-error' });
}

export function validateRegisterForm(
  nombre: string,
  email: string,
  password: string,
  confirmPassword: string,
): string | null {
  if (!nombre.trim()) {
    return 'Introduce tu nombre completo';
  }

  if (nombre.trim().length < 2) {
    return 'El nombre debe tener al menos 2 caracteres';
  }

  const trimmedEmail = email.trim();

  if (!trimmedEmail) {
    return 'Introduce tu correo electrónico';
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
    return 'El formato del correo no es válido';
  }

  if (!password) {
    return 'Introduce una contraseña';
  }

  if (password.length < 4) {
    return 'La contraseña debe tener al menos 4 caracteres';
  }

  if (password !== confirmPassword) {
    return 'Las contraseñas no coinciden';
  }

  return null;
}
