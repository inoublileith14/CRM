-- Replace si/no amueblado with detailed furnishing options for rentals.

ALTER TABLE public.inmuebles
  DROP CONSTRAINT IF EXISTS inmuebles_amueblado_check;

UPDATE public.inmuebles
SET amueblado = 'electro_amueblada'
WHERE amueblado = 'si';

UPDATE public.inmuebles
SET amueblado = 'electro_sin_amueblar'
WHERE amueblado = 'no';

ALTER TABLE public.inmuebles
  ADD CONSTRAINT inmuebles_amueblado_check
  CHECK (
    amueblado IS NULL
    OR amueblado IN (
      'electro_amueblada',
      'electro_sin_amueblar',
      'cocina_vacia_sin_amueblar',
      'no_lo_se'
    )
  );
