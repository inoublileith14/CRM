-- Add optional house reference (ref) to inmuebles
ALTER TABLE public.inmuebles
  ADD COLUMN IF NOT EXISTS ref TEXT;
