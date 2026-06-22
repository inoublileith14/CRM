import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { getBackendUrl } from '@/lib/backend-url';

export async function GET() {
  const cookieStore = await cookies();
  const token = cookieStore.get('cocount_token')?.value;

  if (!token) {
    return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
  }

  let res: Response;

  try {
    res = await fetch(`${getBackendUrl()}/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: 'no-store',
    });
  } catch {
    return NextResponse.json(
      { error: 'Servidor no disponible', code: 'NETWORK_ERROR' },
      { status: 503 },
    );
  }

  if (!res.ok) {
    const response = NextResponse.json(
      { error: 'Sesión no válida', code: 'SESSION_EXPIRED' },
      { status: 401 },
    );
    response.cookies.delete('cocount_token');
    return response;
  }

  const user = await res.json();
  return NextResponse.json(user);
}
