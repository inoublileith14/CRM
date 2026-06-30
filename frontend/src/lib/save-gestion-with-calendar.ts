import { QueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  GestionCalendarEventFormValues,
  toCalendarEventPayload,
  toScheduledGestionIso,
} from '@/components/GestionCalendarEventDialog';
import { ClienteGestionEstado } from '@/lib/cliente-gestion-estado';
import { createCalendarEvent } from '@/lib/calendar-api';
import { updateClienteGestionEstado } from '@/lib/inmuebles-api';
import { ApiError } from '@/lib/api';

export async function saveGestionWithCalendar(options: {
  inmuebleId: string;
  clienteId: string;
  next: ClienteGestionEstado;
  formValues?: GestionCalendarEventFormValues;
  queryClient: QueryClient;
}): Promise<{
  gestion_estado: ClienteGestionEstado;
  fecha_ultima_gestion: string;
}> {
  const { inmuebleId, clienteId, next, formValues, queryClient } = options;

  if (formValues?.createInGoogleCalendar) {
    const payload = toCalendarEventPayload(formValues);
    await createCalendarEvent(payload);
    await queryClient.invalidateQueries({ queryKey: ['calendar'] });
  }

  const fechaUltimaGestion = formValues
    ? toScheduledGestionIso(formValues)
    : undefined;

  const result = await updateClienteGestionEstado(
    inmuebleId,
    clienteId,
    next,
    fechaUltimaGestion,
  );

  if (formValues?.createInGoogleCalendar) {
    toast.success('Gestión guardada y evento creado en Google Calendar');
  } else {
    toast.success('Gestión guardada');
  }

  return result;
}

export function handleGestionCalendarError(error: unknown): void {
  if (error instanceof ApiError && error.code === 'CALENDAR_SCOPE_INSUFFICIENT') {
    toast.error(error.message, { duration: 8000 });
    return;
  }

  toast.error(
    error instanceof Error
      ? error.message
      : 'No se pudo guardar el estado de gestión',
  );
}
