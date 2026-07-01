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
