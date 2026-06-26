export type GestionOption = {
  label: string;
  backgroundColor: string;
  textColor: string;
};

export const GESTION_OPTIONS_ALQUILER: GestionOption[] = [
  { label: 'NO GESTIONANDO', backgroundColor: '#c6e0b4', textColor: '#000000' },
  { label: 'GESTIONANDO', backgroundColor: '#ffc000', textColor: '#000000' },
  { label: 'VISITA CONCERTADA', backgroundColor: '#39ff14', textColor: '#000000' },
  { label: 'NC', backgroundColor: '#a9b8a0', textColor: '#000000' },
  { label: 'PENDIENTE CUADRAR HORARIO/DOCS', backgroundColor: '#5b9bd5', textColor: '#ffffff' },
  { label: 'PERFIL NO ENCAJA', backgroundColor: '#ff0000', textColor: '#ffffff' },
  { label: 'VIDEOLLAMADA', backgroundColor: '#7030a0', textColor: '#ffffff' },
  { label: 'YA ENCONTRÓ PISO', backgroundColor: '#ff0000', textColor: '#000000' },
];

export const GESTION_OPTIONS_VENTA: GestionOption[] = [
  { label: 'NO GESTIONADO', backgroundColor: '#c6e0b4', textColor: '#000000' },
  { label: 'GESTIONANDO (w)', backgroundColor: '#ffc000', textColor: '#000000' },
  { label: 'VISITA CONCERTADA', backgroundColor: '#39ff14', textColor: '#000000' },
  { label: 'NC', backgroundColor: '#a9b8a0', textColor: '#000000' },
  { label: 'PENDIENTE CUADRAR VISITA', backgroundColor: '#5b9bd5', textColor: '#ffffff' },
  { label: 'YA COMPRÓ', backgroundColor: '#ff0000', textColor: '#ffffff' },
  { label: 'PERFIL NO ENCAJA', backgroundColor: '#ff0000', textColor: '#ffffff' },
  { label: 'VIDEOLLAMADA', backgroundColor: '#7030a0', textColor: '#ffffff' },
];

export const HERO_TABLE_ROWS = [
  {
    cliente: 'María G.',
    telefono: '+34 612…',
    gestion: GESTION_OPTIONS_ALQUILER[1],
    fecha: '23/06/2026',
    showWhatsApp: false,
  },
  {
    cliente: 'Carlos R.',
    telefono: '+34 698…',
    gestion: GESTION_OPTIONS_ALQUILER[2],
    fecha: '22/06/2026',
    showWhatsApp: true,
  },
  {
    cliente: 'Ana L.',
    telefono: '+34 677…',
    gestion: GESTION_OPTIONS_ALQUILER[0],
    fecha: '20/06/2026',
    showWhatsApp: false,
  },
] as const;
