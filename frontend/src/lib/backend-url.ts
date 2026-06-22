/** Backend NestJS base URL (no trailing slash). */
export function getBackendUrl(): string {
  const raw =
    process.env.API_URL ??
    process.env.NEXT_PUBLIC_API_URL ??
    'http://localhost:3001';

  return raw.trim().replace(/\/+$/, '');
}
