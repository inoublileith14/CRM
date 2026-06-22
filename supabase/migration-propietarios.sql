-- Propietarios (owners) — each owner can have multiple inmuebles

CREATE TABLE IF NOT EXISTS public.propietarios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre TEXT NOT NULL,
  telf TEXT,
  email TEXT,
  notas TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.propietarios ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role full access propietarios"
  ON public.propietarios
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Link inmuebles to propietarios
ALTER TABLE public.inmuebles
  ADD COLUMN IF NOT EXISTS propietario_id UUID REFERENCES public.propietarios(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_inmuebles_propietario_id ON public.inmuebles(propietario_id);
CREATE INDEX IF NOT EXISTS idx_inmuebles_tipo_operacion ON public.inmuebles(tipo_operacion);
