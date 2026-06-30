-- ============================================================
-- Coconut — Google Calendar push watch channel per user
-- Ejecutar en: Supabase Dashboard → SQL Editor → New query → Run
-- ============================================================

ALTER TABLE public.user_google_calendar
  ADD COLUMN IF NOT EXISTS watch_channel_id TEXT,
  ADD COLUMN IF NOT EXISTS watch_resource_id TEXT,
  ADD COLUMN IF NOT EXISTS watch_expiration_ms BIGINT;

CREATE INDEX IF NOT EXISTS idx_user_google_calendar_watch_channel
  ON public.user_google_calendar (watch_channel_id)
  WHERE watch_channel_id IS NOT NULL;
