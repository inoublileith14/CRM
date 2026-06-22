-- Tipo de operación para propietarios (alquiler | venta)
ALTER TABLE public.propietarios
  ADD COLUMN IF NOT EXISTS tipo_operacion TEXT CHECK (tipo_operacion IN ('alquiler', 'venta'));
