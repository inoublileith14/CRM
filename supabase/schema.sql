-- Ejecutar en Supabase → SQL Editor

CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  nombre TEXT NOT NULL DEFAULT '',
  rol TEXT NOT NULL DEFAULT 'admin',
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role full access"
  ON public.profiles
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Propietarios (owners) — each can have multiple inmuebles
CREATE TABLE IF NOT EXISTS public.propietarios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre TEXT NOT NULL,
  telf TEXT,
  email TEXT,
  notas TEXT,
  tipo_operacion TEXT CHECK (tipo_operacion IN ('alquiler', 'venta')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.propietarios ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role full access propietarios"
  ON public.propietarios
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Trabajadores (workers / captadores)
CREATE TABLE IF NOT EXISTS public.workers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre TEXT NOT NULL,
  telf TEXT,
  email TEXT,
  rol TEXT CHECK (rol IN ('admin', 'asesor')) DEFAULT 'asesor',
  activo BOOLEAN NOT NULL DEFAULT true,
  notas TEXT,
  profile_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  invitation_sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.workers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role full access workers"
  ON public.workers
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Inmuebles (casas alquiler / venta)
CREATE TABLE IF NOT EXISTS public.inmuebles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  fecha_entrada_inmueble DATE,
  imagen_real TEXT,
  direccion_piso_real TEXT,
  foto_espejo TEXT,
  espejo_direccion TEXT,
  barrio_distrito TEXT,
  distrito_ciudad TEXT,
  precio NUMERIC(12, 2),
  hab INTEGER,
  banos INTEGER,
  metros NUMERIC(10, 2),
  larga_estancia_temporada TEXT CHECK (larga_estancia_temporada IN ('larga', 't')),
  propietario_id UUID REFERENCES public.propietarios(id) ON DELETE SET NULL,
  propietarios_contactos JSONB NOT NULL DEFAULT '[]'::jsonb,
  nombre_propi TEXT,
  telf TEXT,
  ficha_del_piso_real TEXT,
  link_idealista TEXT,
  link_espejo TEXT,
  link_idealista_espejo TEXT,
  fecha_visitas DATE,
  fecha_visitas_entrada TEXT,
  observaciones TEXT,
  requisitos_propietario TEXT,
  amueblado TEXT CHECK (
    amueblado IS NULL
    OR amueblado IN (
      'electro_amueblada',
      'electro_sin_amueblar',
      'cocina_vacia_sin_amueblar',
      'no_lo_se'
    )
  ),
  captador TEXT,
  alquilado_por TEXT,
  captador_alquilado_por TEXT,
  status TEXT CHECK (status IN ('I', 'P', 'I-M')),
  activo BOOLEAN NOT NULL DEFAULT true,
  row_color TEXT,
  tipo_operacion TEXT CHECK (tipo_operacion IN ('alquiler', 'venta')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.inmuebles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role full access inmuebles"
  ON public.inmuebles
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Background jobs for large cliente Excel imports
CREATE TABLE IF NOT EXISTS public.cliente_import_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  total_rows INTEGER NOT NULL DEFAULT 0,
  processed_rows INTEGER NOT NULL DEFAULT 0,
  created_count INTEGER NOT NULL DEFAULT 0,
  skipped_count INTEGER NOT NULL DEFAULT 0,
  failed_count INTEGER NOT NULL DEFAULT 0,
  error_message TEXT,
  options JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.cliente_import_jobs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role full access cliente_import_jobs"
  ON public.cliente_import_jobs
  FOR ALL
  USING (true)
  WITH CHECK (true);
