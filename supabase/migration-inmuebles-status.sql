-- Añadir columna status a inmuebles (ejecutar si la tabla ya existe)

ALTER TABLE public.inmuebles
  ADD COLUMN IF NOT EXISTS status TEXT CHECK (status IN ('I', 'P', 'I-M'));
