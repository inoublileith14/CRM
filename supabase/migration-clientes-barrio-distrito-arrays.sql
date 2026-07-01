-- Store multiple barrios / distritos per cliente (Barcelona zones)

ALTER TABLE public.clientes
  ALTER COLUMN barrio DROP DEFAULT,
  ALTER COLUMN distrito DROP DEFAULT;

ALTER TABLE public.clientes
  ALTER COLUMN barrio TYPE TEXT[] USING (
    CASE
      WHEN barrio IS NULL THEN ARRAY[]::TEXT[]
      WHEN barrio::text = '' THEN ARRAY[]::TEXT[]
      ELSE ARRAY[barrio::text]
    END
  ),
  ALTER COLUMN distrito TYPE TEXT[] USING (
    CASE
      WHEN distrito IS NULL THEN ARRAY[]::TEXT[]
      WHEN distrito::text = '' THEN ARRAY[]::TEXT[]
      ELSE ARRAY[distrito::text]
    END
  );

ALTER TABLE public.clientes
  ALTER COLUMN barrio SET DEFAULT ARRAY[]::TEXT[],
  ALTER COLUMN distrito SET DEFAULT ARRAY[]::TEXT[];
