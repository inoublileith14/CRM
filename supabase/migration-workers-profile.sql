-- Ejecutar en Supabase → SQL Editor (todo de una vez)

-- 1) Columnas (sin FK primero, para que no falle)
ALTER TABLE public.workers
  ADD COLUMN IF NOT EXISTS profile_id UUID;

ALTER TABLE public.workers
  ADD COLUMN IF NOT EXISTS invitation_sent_at TIMESTAMPTZ;

-- 2) FK a profiles (solo si existe la tabla profiles)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'profiles'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_schema = 'public'
      AND table_name = 'workers'
      AND constraint_name = 'workers_profile_id_fkey'
  ) THEN
    ALTER TABLE public.workers
      ADD CONSTRAINT workers_profile_id_fkey
      FOREIGN KEY (profile_id) REFERENCES public.profiles(id) ON DELETE SET NULL;
  END IF;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS idx_workers_profile_id
  ON public.workers(profile_id)
  WHERE profile_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_workers_email_lower
  ON public.workers(LOWER(email))
  WHERE email IS NOT NULL;
