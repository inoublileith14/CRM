-- Trabajadores (workers / captadores)

CREATE TABLE IF NOT EXISTS public.workers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre TEXT NOT NULL,
  telf TEXT,
  email TEXT,
  rol TEXT CHECK (rol IN ('admin', 'asesor')) DEFAULT 'asesor',
  activo BOOLEAN NOT NULL DEFAULT true,
  notas TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.workers ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'workers'
      AND policyname = 'Service role full access workers'
  ) THEN
    CREATE POLICY "Service role full access workers"
      ON public.workers
      FOR ALL
      USING (true)
      WITH CHECK (true);
  END IF;
END $$;

-- Los trabajadores se asignan a clientes (cliente_workers), no a inmuebles.
