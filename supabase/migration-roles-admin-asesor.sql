-- Unificar roles: solo admin | asesor (workers = perfiles / usuarios)

UPDATE public.profiles
SET rol = 'asesor'
WHERE rol IS NULL OR rol IN ('usuario', 'captador');

UPDATE public.profiles
SET rol = 'admin'
WHERE rol = 'administracion';

UPDATE public.workers SET rol = 'asesor' WHERE rol = 'captador';
UPDATE public.workers SET rol = 'admin' WHERE rol = 'administracion';

ALTER TABLE public.workers DROP CONSTRAINT IF EXISTS workers_rol_check;
ALTER TABLE public.workers
  ADD CONSTRAINT workers_rol_check CHECK (rol IN ('admin', 'asesor'));

ALTER TABLE public.workers ALTER COLUMN rol SET DEFAULT 'asesor';

ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_rol_check;
ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_rol_check CHECK (rol IN ('admin', 'asesor'));
