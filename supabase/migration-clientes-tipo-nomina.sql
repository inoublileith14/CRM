-- Tipo de nómina del cliente (listas globales alquiler / venta)

ALTER TABLE public.clientes
  ADD COLUMN IF NOT EXISTS tipo_nomina TEXT;
