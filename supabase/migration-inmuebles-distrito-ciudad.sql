-- Distrito / Ciudad column for inmuebles (separate from barrio_distrito)
ALTER TABLE public.inmuebles
  ADD COLUMN IF NOT EXISTS distrito_ciudad TEXT;
