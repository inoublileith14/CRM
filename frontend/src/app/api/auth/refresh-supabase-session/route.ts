import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

function getSupabaseConfig() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) return null;
  return { url, anonKey };
}

export async function POST() {
  const cookieStore = await cookies();
  const refreshToken = cookieStore.get('coconut_sb_refresh')?.value;

  if (!refreshToken) {
    return NextResponse.json(
      { error: 'Sin sesión de Supabase', code: 'SUPABASE_SESSION_MISSING' },
      { status: 401 },
    );
  }

  const config = getSupabaseConfig();
  if (!config) {
    return NextResponse.json(
      { error: 'Supabase no configurado', code: 'SUPABASE_CONFIG_ERROR' },
      { status: 503 },
    );
  }

  const supabase = createClient(config.url, config.anonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data, error } = await supabase.auth.refreshSession({
    refresh_token: refreshToken,
  });

  if (error || !data.session) {
    const response = NextResponse.json(
      {
        error: 'No se pudo renovar la sesión de Supabase',
        code: 'SUPABASE_SESSION_EXPIRED',
      },
      { status: 401 },
    );
    response.cookies.delete('coconut_sb_access');
    response.cookies.delete('coconut_sb_refresh');
    return response;
  }

  const response = NextResponse.json({
    access_token: data.session.access_token,
    refresh_token: data.session.refresh_token,
  });

  const cookieOptions = {
    httpOnly: false,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    path: '/',
    maxAge: 60 * 60 * 24 * 7,
  };

  response.cookies.set(
    'coconut_sb_access',
    data.session.access_token,
    cookieOptions,
  );
  response.cookies.set(
    'coconut_sb_refresh',
    data.session.refresh_token,
    cookieOptions,
  );

  return response;
}
