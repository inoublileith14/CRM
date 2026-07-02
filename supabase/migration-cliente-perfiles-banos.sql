-- Baños por perfil financiero (P1, P2, …)

ALTER TABLE public.cliente_perfiles
  ADD COLUMN IF NOT EXISTS banos SMALLINT;
