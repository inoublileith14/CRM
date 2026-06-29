import { NextRequest, NextResponse } from 'next/server';
import { getBackendUrl } from '@/lib/backend-url';
import { parseNestProxyError } from '@/lib/parse-api-error';

export async function POST(request: NextRequest) {
  const body = await request.json();

  let res: Response;

  try {
    res = await fetch(`${getBackendUrl()}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
  } catch {
    return NextResponse.json(
      {
        error: 'No se pudo conectar con el servidor',
        code: 'NETWORK_ERROR',
      },
      { status: 503 },
    );
  }

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    const { error, code } = parseNestProxyError(data);
    return NextResponse.json({ error, code }, { status: res.status });
  }

  const response = NextResponse.json({
    user: data.user,
    supabase_session: data.supabase_session ?? null,
  });
  response.cookies.set('cocount_token', data.access_token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 7,
  });

  if (data.supabase_session?.access_token && data.supabase_session?.refresh_token) {
    const cookieOptions = {
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax' as const,
      path: '/',
      maxAge: 60 * 60 * 24 * 7,
    };
    response.cookies.set(
      'coconut_sb_access',
      data.supabase_session.access_token,
      cookieOptions,
    );
    response.cookies.set(
      'coconut_sb_refresh',
      data.supabase_session.refresh_token,
      cookieOptions,
    );
  }

  return response;
}
