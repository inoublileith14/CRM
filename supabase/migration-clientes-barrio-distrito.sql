-- Barrio y distrito en clientes (listas globales alquiler / venta)

ALTER TABLE public.clientes
  ADD COLUMN IF NOT EXISTS barrio TEXT,
  ADD COLUMN IF NOT EXISTS distrito TEXT;
