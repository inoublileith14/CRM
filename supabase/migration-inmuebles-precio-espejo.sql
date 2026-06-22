-- Precio del anuncio espejo (venta)
ALTER TABLE public.inmuebles
  ADD COLUMN IF NOT EXISTS precio_espejo NUMERIC(12, 2);
