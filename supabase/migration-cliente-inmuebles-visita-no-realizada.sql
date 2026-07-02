-- Per cliente–inmueble: true when the client did not attend a scheduled visit / videollamada.

ALTER TABLE public.cliente_inmuebles
  ADD COLUMN IF NOT EXISTS visita_no_realizada BOOLEAN NOT NULL DEFAULT false;
