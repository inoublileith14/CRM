const PREFIX = 'n8n:table-state:';

export function loadPersistedTableState<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback;
  try {
    const raw = localStorage.getItem(PREFIX + key);
    if (!raw) return fallback;
    const parsed: unknown = JSON.parse(raw);
    if (
      fallback !== null &&
      typeof fallback === 'object' &&
      !Array.isArray(fallback) &&
      parsed !== null &&
      typeof parsed === 'object' &&
      !Array.isArray(parsed)
    ) {
      return { ...(fallback as object), ...(parsed as object) } as T;
    }
    return parsed as T;
  } catch {
    return fallback;
  }
}

export function savePersistedTableState(key: string, value: unknown): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(PREFIX + key, JSON.stringify(value));
  } catch {
    // ignore quota errors
  }
}

export function clearPersistedTableState(key: string): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(PREFIX + key);
  } catch {
    // ignore
  }
}

export function buildTableStateKey(pathname: string, scope?: string): string {
  return scope ? `${pathname}:${scope}` : pathname;
}
