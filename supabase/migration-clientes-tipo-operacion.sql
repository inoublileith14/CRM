-- Tipo de cliente (alquiler / venta) cuando aún no está vinculado a un inmueble
ALTER TABLE public.clientes
  ADD COLUMN IF NOT EXISTS tipo_operacion TEXT CHECK (tipo_operacion IN ('alquiler', 'venta'));
