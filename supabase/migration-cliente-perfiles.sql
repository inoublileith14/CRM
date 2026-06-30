-- Perfiles financieros por cliente (P1, P2, co-titular, aval…)

CREATE TABLE IF NOT EXISTS public.cliente_perfiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cliente_id UUID NOT NULL REFERENCES public.clientes(id) ON DELETE CASCADE,
  orden SMALLINT NOT NULL CHECK (orden >= 1),
  nombre TEXT,
  telefono TEXT,
  tipo_nomina TEXT,
  tipo_ingreso TEXT,
  ingreso_monto NUMERIC(12, 2),
  pais TEXT,
  notas TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (cliente_id, orden)
);

CREATE INDEX IF NOT EXISTS idx_cliente_perfiles_cliente_id
  ON public.cliente_perfiles(cliente_id);

ALTER TABLE public.cliente_perfiles ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'cliente_perfiles'
      AND policyname = 'Service role full access cliente_perfiles'
  ) THEN
    CREATE POLICY "Service role full access cliente_perfiles"
      ON public.cliente_perfiles FOR ALL USING (true) WITH CHECK (true);
  END IF;
END $$;
