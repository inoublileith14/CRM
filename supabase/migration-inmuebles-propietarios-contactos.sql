-- Up to 5 owners per inmueble (name + phone), stored on the house row
ALTER TABLE public.inmuebles
  ADD COLUMN IF NOT EXISTS propietarios_contactos JSONB NOT NULL DEFAULT '[]'::jsonb;

UPDATE public.inmuebles
SET propietarios_contactos = jsonb_build_array(
  jsonb_strip_nulls(
    jsonb_build_object(
      'nombre', trim(nombre_propi),
      'telf', NULLIF(trim(telf), '')
    )
  )
)
WHERE nombre_propi IS NOT NULL
  AND trim(nombre_propi) <> ''
  AND (propietarios_contactos IS NULL OR propietarios_contactos = '[]'::jsonb);
