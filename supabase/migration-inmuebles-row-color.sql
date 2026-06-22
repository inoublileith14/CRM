-- Row background color for inmuebles table (Excel-style highlighting)
ALTER TABLE public.inmuebles
  ADD COLUMN IF NOT EXISTS row_color TEXT;
