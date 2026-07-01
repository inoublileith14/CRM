-- ============================================================
-- Cocount — tabla inmuebles (Propietarios de viviendas)
--
-- Cómo ejecutar:
--   1. Supabase Dashboard → SQL Editor → New query
--   2. Pega todo este archivo
--   3. Pulsa Run
--   4. Reinicia el backend y recarga /dashboard/propietarios
-- ============================================================

CREATE TABLE IF NOT EXISTS public.inmuebles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  fecha_entrada_inmueble DATE,
  imagen_real TEXT,
  direccion_piso_real TEXT,
  foto_espejo TEXT,
  espejo_direccion TEXT,
  barrio_distrito TEXT,
  precio NUMERIC(12, 2),
  hab INTEGER,
  banos INTEGER,
  metros NUMERIC(10, 2),
  larga_estancia_temporada TEXT CHECK (larga_estancia_temporada IN ('larga', 't')),
  nombre_propi TEXT,
  telf TEXT,
  ficha_del_piso_real TEXT,
  link_idealista_espejo TEXT,
  fecha_visitas_entrada TEXT,
  observaciones TEXT,
  amueblado TEXT CHECK (
    amueblado IS NULL
    OR amueblado IN (
      'electro_amueblada',
      'electro_sin_amueblar',
      'cocina_vacia_sin_amueblar',
      'no_lo_se'
    )
  ),
  captador_alquilado_por TEXT,
  status TEXT CHECK (status IN ('I', 'P', 'I-M')),
  tipo_operacion TEXT CHECK (tipo_operacion IN ('alquiler', 'venta')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.inmuebles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Service role full access inmuebles" ON public.inmuebles;

CREATE POLICY "Service role full access inmuebles"
  ON public.inmuebles
  FOR ALL
  USING (true)
  WITH CHECK (true);
