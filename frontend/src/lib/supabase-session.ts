export interface SupabaseSessionTokens {
  access_token: string;
  refresh_token: string;
}

const STORAGE_ACCESS_KEY = 'coconut_supabase_access_token';
const STORAGE_REFRESH_KEY = 'coconut_supabase_refresh_token';

export function saveSupabaseSession(session: SupabaseSessionTokens): void {
  if (typeof window === 'undefined') return;
  sessionStorage.setItem(STORAGE_ACCESS_KEY, session.access_token);
  sessionStorage.setItem(STORAGE_REFRESH_KEY, session.refresh_token);
}

export function readSupabaseSessionFromStorage(): SupabaseSessionTokens | null {
  if (typeof window === 'undefined') return null;
  const access_token = sessionStorage.getItem(STORAGE_ACCESS_KEY);
  const refresh_token = sessionStorage.getItem(STORAGE_REFRESH_KEY);
  if (!access_token || !refresh_token) return null;
  return { access_token, refresh_token };
}

export function readSupabaseSessionFromCookies(): SupabaseSessionTokens | null {
  if (typeof document === 'undefined') return null;
  const cookies = document.cookie.split(';').map((part) => part.trim());
  const access = cookies.find((c) => c.startsWith('coconut_sb_access='));
  const refresh = cookies.find((c) => c.startsWith('coconut_sb_refresh='));
  if (!access || !refresh) return null;
  return {
    access_token: decodeURIComponent(access.slice('coconut_sb_access='.length)),
    refresh_token: decodeURIComponent(refresh.slice('coconut_sb_refresh='.length)),
  };
}

export function readSupabaseSession(): SupabaseSessionTokens | null {
  return readSupabaseSessionFromStorage() ?? readSupabaseSessionFromCookies();
}

export function clearSupabaseSession(): void {
  if (typeof window !== 'undefined') {
    sessionStorage.removeItem(STORAGE_ACCESS_KEY);
    sessionStorage.removeItem(STORAGE_REFRESH_KEY);
  }
  if (typeof document !== 'undefined') {
    document.cookie =
      'coconut_sb_access=; path=/; max-age=0; samesite=lax';
    document.cookie =
      'coconut_sb_refresh=; path=/; max-age=0; samesite=lax';
  }
}

export function persistRefreshedSupabaseSession(
  access_token: string,
  refresh_token: string,
): void {
  saveSupabaseSession({ access_token, refresh_token });
  if (typeof document === 'undefined') return;
  const secure = window.location.protocol === 'https:' ? '; secure' : '';
  const maxAge = 60 * 60 * 24 * 7;
  document.cookie = `coconut_sb_access=${encodeURIComponent(access_token)}; path=/; max-age=${maxAge}; samesite=lax${secure}`;
  document.cookie = `coconut_sb_refresh=${encodeURIComponent(refresh_token)}; path=/; max-age=${maxAge}; samesite=lax${secure}`;
}
