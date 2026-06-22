-- ============================================================
-- Cocount — bucket "images" para imagen_real y foto_espejo
--
-- Cómo ejecutar:
--   1. Supabase Dashboard → SQL Editor → New query
--   2. Pega todo este archivo
--   3. Pulsa Run
-- ============================================================

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'images',
  'images',
  true,
  5242880,
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Lectura pública (bucket público)
DROP POLICY IF EXISTS "Public read images" ON storage.objects;
CREATE POLICY "Public read images"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'images');

-- Subida desde service role (backend)
DROP POLICY IF EXISTS "Service role upload images" ON storage.objects;
CREATE POLICY "Service role upload images"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'images');

-- Actualizar / eliminar desde service role (backend)
DROP POLICY IF EXISTS "Service role update images" ON storage.objects;
CREATE POLICY "Service role update images"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'images');

DROP POLICY IF EXISTS "Service role delete images" ON storage.objects;
CREATE POLICY "Service role delete images"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'images');
