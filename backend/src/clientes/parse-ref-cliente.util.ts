export interface ParsedRefCliente {
  presupuesto: string | null;
  habitaciones: number | null;
  banos: number | null;
  metros: number | null;
  zona: string | null;
}

export function parseRefCliente(
  ref: string | null | undefined,
): ParsedRefCliente {
  const empty: ParsedRefCliente = {
    presupuesto: null,
    habitaciones: null,
    banos: null,
    metros: null,
    zona: null,
  };

  if (!ref?.trim()) return empty;

  let rest = ref.trim().replace(/\//g, ' ').replace(/\s+/g, ' ');
  rest = rest.replace(/^ESP\s+/i, '');

  let presupuesto: string | null = null;

  const priceKMatch = rest.match(/(\d+(?:[.,]\d+)?)\s*[kK]\b/);
  if (priceKMatch) {
    presupuesto = `${priceKMatch[1].replace(',', '.')}k`;
    rest = rest.replace(priceKMatch[0], ' ').trim();
  }

  if (!presupuesto) {
    const priceMMatch = rest.match(/^(\d+(?:[.,]\d+)?)\s*[mM]\b/);
    if (priceMMatch) {
      const n = Number(priceMMatch[1].replace(',', '.'));
      if (Number.isFinite(n) && n < 20) {
        presupuesto = `${priceMMatch[1].replace(',', '.')}M`;
        rest = rest.replace(priceMMatch[0], ' ').trim();
      }
    }
  }

  if (!presupuesto) {
    const plainPriceMatch = rest.match(/^(\d{3,})\b/);
    if (plainPriceMatch) {
      presupuesto = plainPriceMatch[1];
      rest = rest.replace(plainPriceMatch[0], ' ').trim();
    }
  }

  const hMatches = [...rest.matchAll(/\b(\d+)\s*[hH]\b/g)];
  const habitaciones =
    hMatches[0] != null ? Number(hMatches[0][1]) : null;

  const bMatch = rest.match(/\b(\d+)\s*[bB]\b/);
  let banos: number | null = null;
  if (bMatch) {
    banos = Number(bMatch[1]);
    rest = rest.replace(bMatch[0], ' ').trim();
  } else if (hMatches[1] != null) {
    banos = Number(hMatches[1][1]);
  }

  for (const match of hMatches) {
    rest = rest.replace(match[0], ' ').trim();
  }

  let metros: number | null = null;
  const metrosMatch = rest.match(/\b(\d+)\s*[mM]\b/);
  if (metrosMatch) {
    metros = Number(metrosMatch[1]);
    rest = rest.replace(metrosMatch[0], ' ').trim();
  }

  const zona = rest.trim() || null;

  return { presupuesto, habitaciones, banos, metros, zona };
}

export function resolveClienteBanos(
  banos: number | null | undefined,
  refCliente: string | null | undefined,
): number | null {
  if (banos != null && Number.isFinite(banos)) return banos;
  return parseRefCliente(refCliente).banos;
}

export function normalizeRefForMatch(ref: string | null | undefined): string {
  if (!ref?.trim()) return '';

  return ref
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .replace(/\//g, ' ')
    .replace(/^esp\s+/, '')
    .replace(/,/g, '.')
    .replace(/\s+/g, ' ')
    .trim();
}

export function refsMatchForInmueble(
  clienteRef: string | null | undefined,
  inmuebleRef: string | null | undefined,
): boolean {
  const cliente = normalizeRefForMatch(clienteRef);
  const inmueble = normalizeRefForMatch(inmuebleRef);

  if (!cliente || !inmueble) return false;
  if (cliente === inmueble) return true;

  if (cliente.startsWith(inmueble)) {
    return cliente.length === inmueble.length || cliente[inmueble.length] === ' ';
  }

  if (inmueble.startsWith(cliente)) {
    return inmueble.length === cliente.length || inmueble[cliente.length] === ' ';
  }

  return false;
}
