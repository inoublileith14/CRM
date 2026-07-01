export interface BarcelonaDistrito {
  distrito: string;
  barrios: readonly string[];
}

export const BARCELONA_ZONAS: readonly BarcelonaDistrito[] = [
  {
    distrito: 'Ciutat Vella',
    barrios: [
      'El Raval',
      'Barri Gòtic',
      'La Barceloneta',
      'Sant Pere',
      'Santa Caterina i la Ribera',
    ],
  },
  {
    distrito: 'Eixample',
    barrios: [
      'Fort Pienc',
      'Sagrada Família',
      "Dreta de l'Eixample",
      "Antiga Esquerra de l'Eixample",
      "Nova Esquerra de l'Eixample",
      'Sant Antoni',
    ],
  },
  {
    distrito: 'Sants-Montjuïc',
    barrios: [
      'El Poble-sec',
      'La Marina del Prat Vermell',
      'La Marina de Port',
      'La Font de la Guatlla',
      'Hostafrancs',
      'La Bordeta',
      'Sants-Badal',
      'Sants',
      'Plus Ultra',
      'Zona Franca - Port',
    ],
  },
  {
    distrito: 'Les Corts',
    barrios: ['Les Corts', 'La Maternitat i Sant Ramon', 'Pedralbes'],
  },
  {
    distrito: 'Sarrià–Sant Gervasi',
    barrios: [
      'Vallvidrera',
      'el Tibidabo i les Planes',
      'Sarrià',
      'Les Tres Torres',
      'Sant Gervasi - la Bonanova',
      'Sant Gervasi - Galvany',
      'El Putxet i el Farró',
    ],
  },
  {
    distrito: 'Gràcia',
    barrios: [
      'Vallcarca i els Penitents',
      'El Coll',
      'La Salut',
      'Vila de Gràcia',
      "Camp d'en Grassot i Gràcia Nova",
    ],
  },
  {
    distrito: 'Horta-Guinardó',
    barrios: [
      'El Baix Guinardó',
      'Can Baró',
      'El Guinardó',
      "La Font d'en Fargues",
      'El Carmel',
      'La Teixonera',
      'Sant Genís dels Agudells',
      'Montbau',
      "La Vall d'Hebron",
      'La Clota',
      'Horta',
    ],
  },
  {
    distrito: 'Nou Barris',
    barrios: [
      'Vilapicina i la Torre Llobeta',
      'Porta',
      'El Turó de la Peira',
      'Can Peguera',
      'La Guineueta',
      'Canyelles',
      'Les Roquetes',
      'Verdun',
      'La Prosperitat',
      'La Trinitat Nova',
      'Torre Baró',
      'Ciutat Meridiana',
      'Vallbona',
    ],
  },
  {
    distrito: 'Sant Andreu',
    barrios: [
      'La Trinitat Vella',
      'Baró de Viver',
      'Bon Pastor',
      'Sant Andreu',
      'La Sagrera',
      'El Congrés i els Indians',
      'Navas',
    ],
  },
  {
    distrito: 'Sant Martí',
    barrios: [
      "El Camp de l'Arpa del Clot",
      'El Clot',
      'Parc i la Llacuna del Poblenou',
      'Vila Olímpica del Poblenou',
      'Poblenou',
      'Diagonal Mar i el Front Marítim del Poblenou',
      'El Besòs i el Maresme',
      'Provençals del Poblenou',
      'Sant Martí de Provençals',
      'La Verneda i la Pau',
    ],
  },
] as const;

export const BARCELONA_DISTRITOS = BARCELONA_ZONAS.map((z) => z.distrito);

export const BARCELONA_BARRIOS = BARCELONA_ZONAS.flatMap((z) => z.barrios);

function normalizeZonaKey(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .replace(/\s+/g, ' ');
}

const barrioToDistrito = new Map<string, string>();
for (const { distrito, barrios } of BARCELONA_ZONAS) {
  barrioToDistrito.set(normalizeZonaKey(distrito), distrito);
  for (const barrio of barrios) {
    barrioToDistrito.set(normalizeZonaKey(barrio), distrito);
  }
}

export function findDistritoForBarrio(
  barrio: string | null | undefined,
): string | null {
  if (!barrio?.trim()) return null;
  return barrioToDistrito.get(normalizeZonaKey(barrio)) ?? null;
}

export function isCatalogBarrio(barrio: string): boolean {
  if (!barrio.trim()) return false;
  const distrito = barrioToDistrito.get(normalizeZonaKey(barrio));
  if (!distrito) return false;
  const zone = BARCELONA_ZONAS.find((z) => z.distrito === distrito);
  return zone?.barrios.some(
    (b) => normalizeZonaKey(b) === normalizeZonaKey(barrio),
  ) ?? false;
}

export function isCatalogDistrito(distrito: string): boolean {
  return BARCELONA_DISTRITOS.some(
    (d) => normalizeZonaKey(d) === normalizeZonaKey(distrito),
  );
}

export function getBarriosForDistrito(distrito: string): string[] {
  const zone = BARCELONA_ZONAS.find(
    (z) => normalizeZonaKey(z.distrito) === normalizeZonaKey(distrito),
  );
  return zone ? [...zone.barrios] : [];
}

function unionZonas(...lists: string[][]): string[] {
  const seen = new Set<string>();
  const result: string[] = [];
  for (const list of lists) {
    for (const item of list) {
      const trimmed = item.trim();
      if (!trimmed || seen.has(trimmed)) continue;
      seen.add(trimmed);
      result.push(trimmed);
    }
  }
  return result;
}

function removeZona(list: string[], value: string): string[] {
  const key = normalizeZonaKey(value);
  return list.filter((item) => normalizeZonaKey(item) !== key);
}

function hasZona(list: string[], value: string): boolean {
  const key = normalizeZonaKey(value);
  return list.some((item) => normalizeZonaKey(item) === key);
}

export function toggleClienteDistritoSelection(
  distrito: string,
  checked: boolean,
  current: { barrios: string[]; distritos: string[] },
): { barrios: string[]; distritos: string[] } {
  if (checked) {
    const catalogBarrios = getBarriosForDistrito(distrito);
    return {
      distritos: hasZona(current.distritos, distrito)
        ? current.distritos
        : [...current.distritos, distrito],
      barrios:
        catalogBarrios.length > 0
          ? unionZonas(current.barrios, catalogBarrios)
          : current.barrios,
    };
  }

  const catalogBarrios = getBarriosForDistrito(distrito);
  const nextDistritos = removeZona(current.distritos, distrito);
  const catalogBarrioKeys = new Set(
    catalogBarrios.map((barrio) => normalizeZonaKey(barrio)),
  );
  const remainingDistritoKeys = new Set(
    nextDistritos.flatMap((d) =>
      getBarriosForDistrito(d).map((barrio) => normalizeZonaKey(barrio)),
    ),
  );

  const nextBarrios = current.barrios.filter((barrio) => {
    const key = normalizeZonaKey(barrio);
    if (!catalogBarrioKeys.has(key)) return true;
    return remainingDistritoKeys.has(key);
  });

  return { barrios: nextBarrios, distritos: nextDistritos };
}

export function toggleClienteBarrioSelection(
  barrio: string,
  checked: boolean,
  current: { barrios: string[]; distritos: string[] },
): { barrios: string[]; distritos: string[] } {
  if (checked) {
    const parentDistrito = findDistritoForBarrio(barrio);
    const nextBarrios = hasZona(current.barrios, barrio)
      ? current.barrios
      : [...current.barrios, barrio];
    const nextDistritos =
      parentDistrito && isCatalogBarrio(barrio)
        ? hasZona(current.distritos, parentDistrito)
          ? current.distritos
          : [...current.distritos, parentDistrito]
        : current.distritos;
    return { barrios: nextBarrios, distritos: nextDistritos };
  }

  return {
    barrios: removeZona(current.barrios, barrio),
    distritos: current.distritos,
  };
}

export function addCustomClienteZona(
  kind: 'barrio' | 'distrito',
  value: string,
  current: { barrios: string[]; distritos: string[] },
): { barrios: string[]; distritos: string[] } {
  const trimmed = value.trim();
  if (!trimmed) return current;
  if (kind === 'distrito') {
    return toggleClienteDistritoSelection(trimmed, true, current);
  }
  return toggleClienteBarrioSelection(trimmed, true, current);
}

export function listBarrioGroupsForSelection(distritos: string[]): Array<{
  distrito: string;
  barrios: readonly string[];
}> {
  if (distritos.length === 0) return [...BARCELONA_ZONAS];
  return BARCELONA_ZONAS.filter((zone) =>
    distritos.some(
      (distrito) =>
        normalizeZonaKey(distrito) === normalizeZonaKey(zone.distrito),
    ),
  );
}

export function filterBarrioOptions(query: string): string[] {
  const q = normalizeZonaKey(query);
  if (!q) return [...BARCELONA_BARRIOS];
  return BARCELONA_BARRIOS.filter((barrio) =>
    normalizeZonaKey(barrio).includes(q),
  );
}

export function filterDistritoOptions(query: string): string[] {
  const q = normalizeZonaKey(query);
  if (!q) return [...BARCELONA_DISTRITOS];
  return BARCELONA_DISTRITOS.filter((distrito) =>
    normalizeZonaKey(distrito).includes(q),
  );
}
