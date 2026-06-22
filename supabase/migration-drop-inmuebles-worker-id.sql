-- Los trabajadores se asignan a clientes (cliente_workers), no a inmuebles

DROP INDEX IF EXISTS idx_inmuebles_worker_id;

ALTER TABLE public.inmuebles
  DROP COLUMN IF EXISTS worker_id;
