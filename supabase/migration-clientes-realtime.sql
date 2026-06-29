-- Enable Supabase Realtime for house client tables (run in Supabase SQL Editor)

ALTER PUBLICATION supabase_realtime ADD TABLE public.clientes;
ALTER PUBLICATION supabase_realtime ADD TABLE public.cliente_inmuebles;
ALTER PUBLICATION supabase_realtime ADD TABLE public.cliente_workers;

ALTER TABLE public.clientes REPLICA IDENTITY FULL;
ALTER TABLE public.cliente_inmuebles REPLICA IDENTITY FULL;
ALTER TABLE public.cliente_workers REPLICA IDENTITY FULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'clientes'
      AND policyname = 'Authenticated staff read clientes'
  ) THEN
    CREATE POLICY "Authenticated staff read clientes"
      ON public.clientes FOR SELECT TO authenticated
      USING (EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid()));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'cliente_inmuebles'
      AND policyname = 'Authenticated staff read cliente_inmuebles'
  ) THEN
    CREATE POLICY "Authenticated staff read cliente_inmuebles"
      ON public.cliente_inmuebles FOR SELECT TO authenticated
      USING (EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid()));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'cliente_workers'
      AND policyname = 'Authenticated staff read cliente_workers'
  ) THEN
    CREATE POLICY "Authenticated staff read cliente_workers"
      ON public.cliente_workers FOR SELECT TO authenticated
      USING (EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid()));
  END IF;
END $$;
