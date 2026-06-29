-- Tipo de cliente (estudiante, parejas, familia con hijos, compartir)

ALTER TABLE public.clientes
  ADD COLUMN IF NOT EXISTS tipo_cliente TEXT;
