-- C/O row code for pisos alquilados (separate from status I/P/I-M)

ALTER TABLE public.inmuebles
  ADD COLUMN IF NOT EXISTS alquilado_codigo TEXT
  CHECK (alquilado_codigo IS NULL OR alquilado_codigo IN ('C', 'O', 'R'));

-- Move legacy C/O values from status into alquilado_codigo
UPDATE public.inmuebles
SET alquilado_codigo = status
WHERE status IN ('C', 'O');

UPDATE public.inmuebles
SET status = NULL
WHERE status IN ('C', 'O');

ALTER TABLE public.inmuebles
  DROP CONSTRAINT IF EXISTS inmuebles_status_check;

ALTER TABLE public.inmuebles
  ADD CONSTRAINT inmuebles_status_check
  CHECK (status IS NULL OR status IN ('I', 'P', 'I-M'));
