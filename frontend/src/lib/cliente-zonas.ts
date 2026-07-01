export function normalizeClienteZonas(value: unknown): string[] {
  if (value == null) return [];
  if (Array.isArray(value)) {
    const seen = new Set<string>();
    const result: string[] = [];
    for (const item of value) {
      if (typeof item !== 'string') continue;
      const trimmed = item.trim();
      if (!trimmed || seen.has(trimmed)) continue;
      seen.add(trimmed);
      result.push(trimmed);
    }
    return result;
  }
  if (typeof value === 'string') {
    const trimmed = value.trim();
    return trimmed ? [trimmed] : [];
  }
  return [];
}

export function formatClienteZonasLabel(
  values: string[] | null | undefined,
  emptyLabel = '—',
): string {
  const list = normalizeClienteZonas(values);
  if (list.length === 0) return emptyLabel;
  return list.join(', ');
}

export function formatClienteZonasCompact(
  values: string[] | null | undefined,
  maxVisible = 2,
): string {
  const list = normalizeClienteZonas(values);
  if (list.length === 0) return '—';
  if (list.length <= maxVisible) return list.join(', ');
  return `${list.slice(0, maxVisible).join(', ')} +${list.length - maxVisible}`;
}

export function clienteZonasMatchQuery(
  values: string[] | null | undefined,
  query: string,
): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  return normalizeClienteZonas(values).some((value) =>
    value.toLowerCase().includes(q),
  );
}
