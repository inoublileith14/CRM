import { NextRequest, NextResponse } from 'next/server';
import { getBackendUrl } from '@/lib/backend-url';
import { getAuthToken } from '@/lib/proxy-auth';

function settingsRedirect(
  origin: string,
  params: Record<string, string>,
): NextResponse {
  const url = new URL('/dashboard/calendar', origin);
  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, value);
  }
  return NextResponse.redirect(url);
}

export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;
  const oauthError = searchParams.get('error');

  if (oauthError) {
    return settingsRedirect(origin, {
      calendar: 'error',
      calendar_error: oauthError,
    });
  }

  const code = searchParams.get('code');
  const state = searchParams.get('state');

  if (!code || !state) {
    return settingsRedirect(origin, { calendar: 'error' });
  }

  const token = await getAuthToken();
  if (!token) {
    const loginUrl = new URL('/login', origin);
    loginUrl.searchParams.set(
      'next',
      `${request.nextUrl.pathname}${request.nextUrl.search}`,
    );
    return NextResponse.redirect(loginUrl);
  }

  const query = new URLSearchParams({ code, state });
  let res: Response;

  try {
    res = await fetch(`${getBackendUrl()}/calendar/callback?${query}`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: 'no-store',
    });
  } catch {
    return settingsRedirect(origin, { calendar: 'error' });
  }

  if (res.ok) {
    return settingsRedirect(origin, { calendar: 'connected' });
  }

  return settingsRedirect(origin, { calendar: 'error' });
}
