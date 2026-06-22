-- Gestión status per cliente–inmueble (rental workflow)

ALTER TABLE public.cliente_inmuebles
  ADD COLUMN IF NOT EXISTS gestion_estado TEXT NOT NULL DEFAULT 'no_gestionando'
  CHECK (
    gestion_estado IN (
      'no_gestionando',
      'gestionando',
      'visita_concertada',
      'nc',
      'pendiente_cuadrar_docs'
    )
  );

UPDATE public.cliente_inmuebles
SET gestion_estado = 'no_gestionando'
WHERE gestion_estado IS NULL;
