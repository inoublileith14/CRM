-- Add GESTIONANDO to gestión status options

ALTER TABLE public.cliente_inmuebles
  DROP CONSTRAINT IF EXISTS cliente_inmuebles_gestion_estado_check;

ALTER TABLE public.cliente_inmuebles
  ADD CONSTRAINT cliente_inmuebles_gestion_estado_check
  CHECK (
    gestion_estado IN (
      'no_gestionando',
      'gestionando',
      'visita_concertada',
      'nc',
      'pendiente_cuadrar_docs'
    )
  );
