/** Supabase puts tokens in the URL hash (#access_token=...&type=invite). */
export function getAuthHashRedirectPath(hash: string): string | null {
  if (!hash || hash.length <= 1) return null;

  const params = new URLSearchParams(hash.startsWith('#') ? hash.slice(1) : hash);
  const type = params.get('type');
  const hasTokens =
    Boolean(params.get('access_token')) && Boolean(params.get('refresh_token'));

  if (!hasTokens || !type) return null;

  if (type === 'invite' || type === 'signup') {
    return '/aceptar-invitacion';
  }

  if (type === 'recovery') {
    return '/restablecer-contraseña';
  }

  return null;
}
