-- Campos del Excel "estadísticas por anuncio" (Idealista leads)

ALTER TABLE public.clientes
  ADD COLUMN IF NOT EXISTS origen TEXT CHECK (origen IN ('email', 'call', 'otro')),
  ADD COLUMN IF NOT EXISTS estado_contacto TEXT,
  ADD COLUMN IF NOT EXISTS descripcion TEXT,
  ADD COLUMN IF NOT EXISTS ref_cliente TEXT,
  ADD COLUMN IF NOT EXISTS mensaje TEXT,
  ADD COLUMN IF NOT EXISTS fecha_contacto TIMESTAMPTZ;
