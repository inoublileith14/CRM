-- Entrada prevista clientes: texto (YA, SEMANA, 15 DIAS, MES, MAS MES) en lugar de fecha

ALTER TABLE public.clientes
  ALTER COLUMN fecha_entrada_inmueble TYPE TEXT
  USING NULL;
