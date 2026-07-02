-- Gestión status: Alquilado por COC (alquiler)

ALTER TABLE public.cliente_inmuebles
  DROP CONSTRAINT IF EXISTS cliente_inmuebles_gestion_estado_check;

ALTER TABLE public.cliente_inmuebles
  ADD CONSTRAINT cliente_inmuebles_gestion_estado_check
  CHECK (
    gestion_estado IN (
      'no_gestionando',
      'gestionando',
      'visita_concertada',
      'reservado',
      'alquilado_por_coc',
      'nc',
      'pendiente_cuadrar_docs',
      'int_pendiente_docs',
      'perfil_no_encaja',
      'ya_encontro_piso',
      'videollamada',
      'cliente_no_interesado',
      'no_gestionado',
      'gestionando_w',
      'pendiente_cuadrar_visita',
      'ya_compro'
    )
  );
