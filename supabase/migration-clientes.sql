-- Clientes con relación many-to-many a inmuebles y workers

CREATE TABLE IF NOT EXISTS public.clientes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre TEXT NOT NULL,
  email TEXT,
  telefono TEXT,
  ciudad TEXT,
  estado TEXT CHECK (estado IN ('activo', 'inactivo', 'pendiente')) DEFAULT 'pendiente',
  origen TEXT CHECK (origen IN ('email', 'call', 'otro')),
  estado_contacto TEXT,
  descripcion TEXT,
  ref_cliente TEXT,
  mensaje TEXT,
  fecha_contacto TIMESTAMPTZ,
  notas TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.clientes ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'clientes' AND policyname = 'Service role full access clientes'
  ) THEN
    CREATE POLICY "Service role full access clientes"
      ON public.clientes FOR ALL USING (true) WITH CHECK (true);
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS public.cliente_inmuebles (
  cliente_id UUID NOT NULL REFERENCES public.clientes(id) ON DELETE CASCADE,
  inmueble_id UUID NOT NULL REFERENCES public.inmuebles(id) ON DELETE CASCADE,
  PRIMARY KEY (cliente_id, inmueble_id)
);

CREATE TABLE IF NOT EXISTS public.cliente_workers (
  cliente_id UUID NOT NULL REFERENCES public.clientes(id) ON DELETE CASCADE,
  worker_id UUID NOT NULL REFERENCES public.workers(id) ON DELETE CASCADE,
  PRIMARY KEY (cliente_id, worker_id)
);

CREATE INDEX IF NOT EXISTS idx_cliente_inmuebles_inmueble ON public.cliente_inmuebles(inmueble_id);
CREATE INDEX IF NOT EXISTS idx_cliente_workers_worker ON public.cliente_workers(worker_id);

ALTER TABLE public.cliente_inmuebles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cliente_workers ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'cliente_inmuebles' AND policyname = 'Service role full access cliente_inmuebles'
  ) THEN
    CREATE POLICY "Service role full access cliente_inmuebles"
      ON public.cliente_inmuebles FOR ALL USING (true) WITH CHECK (true);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'cliente_workers' AND policyname = 'Service role full access cliente_workers'
  ) THEN
    CREATE POLICY "Service role full access cliente_workers"
      ON public.cliente_workers FOR ALL USING (true) WITH CHECK (true);
  END IF;
END $$;
