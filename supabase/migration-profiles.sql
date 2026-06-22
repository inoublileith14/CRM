-- ============================================================
-- Cocount — tabla profiles (usuarios de la app)
-- Ejecutar en: Supabase Dashboard → SQL Editor → New query → Run
-- ============================================================

CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  nombre TEXT NOT NULL DEFAULT '',
  rol TEXT NOT NULL DEFAULT 'usuario',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Service role full access" ON public.profiles;

CREATE POLICY "Service role full access"
  ON public.profiles
  FOR ALL
  USING (true)
  WITH CHECK (true);
