-- Añadir columna tipo_operacion (alquiler / venta)

ALTER TABLE public.inmuebles
  ADD COLUMN IF NOT EXISTS tipo_operacion TEXT CHECK (tipo_operacion IN ('alquiler', 'venta'));
