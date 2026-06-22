import { NextResponse } from 'next/server';
import { getBackendUrl } from '@/lib/backend-url';
import { getAuthToken } from '@/lib/proxy-auth';
import { parseNestProxyError } from '@/lib/parse-api-error';

export async function POST(request: Request) {
  const token = await getAuthToken();

  if (!token) {
    return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
  }

  const formData = await request.formData();

  let res: Response;

  try {
    res = await fetch(`${getBackendUrl()}/clientes/import/upload`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: formData,
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
