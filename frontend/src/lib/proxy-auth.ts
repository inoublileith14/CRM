import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { getBackendUrl } from './backend-url';
import { parseNestProxyError } from './parse-api-error';

export async function getAuthToken(): Promise<string | null> {
  const cookieStore = await cookies();
  return cookieStore.get('cocount_token')?.value ?? null;
}

export async function proxyToBackend(
  path: string,
  init?: RequestInit,
): Promise<Response> {
  const token = await getAuthToken();

  if (!token) {
    return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
  }

  let res: Response;

  try {
    res = await fetch(`${getBackendUrl()}${path}`, {
      ...init,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
        ...init?.headers,
      },
      cache: 'no-store',
    });
  } catch {
    return NextResponse.json(
      { error: 'Servidor no disponible', code: 'NETWORK_ERROR' },
      { status: 503 },
    );
  }

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    const { error, code } = parseNestProxyError(data);
    return NextResponse.json({ error, code }, { status: res.status });
  }

  return NextResponse.json(data);
}
