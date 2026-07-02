-- Origen de ingresos del cliente (contrato / freelance)

ALTER TABLE public.clientes
  ADD COLUMN IF NOT EXISTS tipo_ingreso TEXT;
