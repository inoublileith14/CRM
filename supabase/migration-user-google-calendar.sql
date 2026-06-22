-- ============================================================
-- Coconut — Google Calendar OAuth tokens per user
-- Ejecutar en: Supabase Dashboard → SQL Editor → New query → Run
-- ============================================================

CREATE TABLE IF NOT EXISTS public.user_google_calendar (
  user_id UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  refresh_token TEXT NOT NULL,
  access_token TEXT,
  token_expires_at TIMESTAMPTZ,
  google_email TEXT,
  calendar_id TEXT NOT NULL DEFAULT 'primary',
  connected_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.user_google_calendar ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Service role full access" ON public.user_google_calendar;

CREATE POLICY "Service role full access"
  ON public.user_google_calendar
  FOR ALL
  USING (true)
  WITH CHECK (true);
