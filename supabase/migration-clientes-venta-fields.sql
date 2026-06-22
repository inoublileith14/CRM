-- Campos adicionales para clientes de venta (tabla global)

ALTER TABLE public.clientes
  ADD COLUMN IF NOT EXISTS presupuesto_maximo TEXT,
  ADD COLUMN IF NOT EXISTS banos INTEGER,
  ADD COLUMN IF NOT EXISTS fecha_ultima_gestion TIMESTAMPTZ;

ALTER TABLE public.cliente_inmuebles
  ADD COLUMN IF NOT EXISTS fecha_ultima_gestion TIMESTAMPTZ;
