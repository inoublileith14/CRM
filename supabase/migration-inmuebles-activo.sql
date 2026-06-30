-- ON/OFF toggle in BCN column (inmuebles rent / sell tables)
ALTER TABLE public.inmuebles
  ADD COLUMN IF NOT EXISTS activo BOOLEAN NOT NULL DEFAULT true;
