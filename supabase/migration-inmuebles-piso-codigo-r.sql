-- Add R (pink row) to alquilado_codigo and vendido_codigo

ALTER TABLE public.inmuebles
  DROP CONSTRAINT IF EXISTS inmuebles_alquilado_codigo_check;

ALTER TABLE public.inmuebles
  DROP CONSTRAINT IF EXISTS inmuebles_vendido_codigo_check;

ALTER TABLE public.inmuebles
  ADD CONSTRAINT inmuebles_alquilado_codigo_check
  CHECK (alquilado_codigo IS NULL OR alquilado_codigo IN ('C', 'O', 'R'));

ALTER TABLE public.inmuebles
  ADD CONSTRAINT inmuebles_vendido_codigo_check
  CHECK (vendido_codigo IS NULL OR vendido_codigo IN ('C', 'O', 'R'));
