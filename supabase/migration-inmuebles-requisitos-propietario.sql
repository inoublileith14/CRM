ALTER TABLE public.inmuebles
  ADD COLUMN IF NOT EXISTS requisitos_propietario TEXT;
