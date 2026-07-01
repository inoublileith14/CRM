-- C/O row code for pisos vendidos (separate from status I/P/I-M)

ALTER TABLE public.inmuebles
  ADD COLUMN IF NOT EXISTS vendido_codigo TEXT
  CHECK (vendido_codigo IS NULL OR vendido_codigo IN ('C', 'O', 'R'));
