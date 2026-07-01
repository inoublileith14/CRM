-- Additional phone numbers per client (primary stays in clientes.telefono)

ALTER TABLE public.clientes
  ADD COLUMN IF NOT EXISTS telefonos_extra TEXT[] NOT NULL DEFAULT '{}';
