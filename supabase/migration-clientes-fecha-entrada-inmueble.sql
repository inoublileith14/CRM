-- Fecha de entrada del cliente al inmueble (listas globales alquiler / venta)

ALTER TABLE public.clientes
  ADD COLUMN IF NOT EXISTS fecha_entrada_inmueble DATE;
