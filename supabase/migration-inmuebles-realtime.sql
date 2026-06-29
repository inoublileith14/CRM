-- Enable Supabase Realtime for inmuebles (run in Supabase SQL Editor)

ALTER PUBLICATION supabase_realtime ADD TABLE public.inmuebles;

-- Include full old row in UPDATE/DELETE realtime payloads
ALTER TABLE public.inmuebles REPLICA IDENTITY FULL;

-- Authenticated staff can receive realtime row events (SELECT required by Realtime RLS)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'inmuebles'
      AND policyname = 'Authenticated staff read inmuebles'
  ) THEN
    CREATE POLICY "Authenticated staff read inmuebles"
      ON public.inmuebles
      FOR SELECT
      TO authenticated
      USING (
        EXISTS (
          SELECT 1
          FROM public.profiles
          WHERE profiles.id = auth.uid()
        )
      );
  END IF;
END $$;
