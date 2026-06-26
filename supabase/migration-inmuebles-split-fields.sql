ALTER TABLE public.inmuebles ADD COLUMN IF NOT EXISTS captador TEXT;
ALTER TABLE public.inmuebles ADD COLUMN IF NOT EXISTS alquilado_por TEXT;
ALTER TABLE public.inmuebles ADD COLUMN IF NOT EXISTS link_idealista TEXT;
ALTER TABLE public.inmuebles ADD COLUMN IF NOT EXISTS link_espejo TEXT;
ALTER TABLE public.inmuebles ADD COLUMN IF NOT EXISTS fecha_visitas DATE;

UPDATE public.inmuebles
SET captador = TRIM(SPLIT_PART(captador_alquilado_por, '//', 1))
WHERE captador IS NULL
  AND captador_alquilado_por IS NOT NULL
  AND captador_alquilado_por <> ''
  AND POSITION('//' IN captador_alquilado_por) > 0;

UPDATE public.inmuebles
SET alquilado_por = TRIM(SPLIT_PART(captador_alquilado_por, '//', 2))
WHERE alquilado_por IS NULL
  AND captador_alquilado_por IS NOT NULL
  AND POSITION('//' IN captador_alquilado_por) > 0;

UPDATE public.inmuebles
SET captador = captador_alquilado_por
WHERE captador IS NULL
  AND captador_alquilado_por IS NOT NULL
  AND captador_alquilado_por <> '';

UPDATE public.inmuebles
SET link_idealista = link_idealista_espejo
WHERE link_idealista IS NULL
  AND link_idealista_espejo IS NOT NULL
  AND link_idealista_espejo <> '';

UPDATE public.inmuebles
SET fecha_visitas = fecha_visitas_entrada::date
WHERE fecha_visitas IS NULL
  AND fecha_visitas_entrada IS NOT NULL
  AND fecha_visitas_entrada ~ '^\d{4}-\d{2}-\d{2}';
