import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { getBackendUrl } from '@/lib/backend-url';

export async function GET(req: Request) {
  const url = new URL(req.url);
  const limit = url.searchParams.get('limit') ?? '200';

  const cookieStore = await cookies();
  const token = cookieStore.get('cocount_token')?.value;
  if (!token) {
    return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
  }

  let res: Response;
  try {
    res = await fetch(`${getBackendUrl()}/audit-logs?limit=${encodeURIComponent(limit)}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      cache: 'no-store',
    });
  } catch {
    return NextResponse.json({ error: 'No se pudo conectar con el backend' }, { status: 503 });
  }

  const data = await res.json().catch(() => []);
  return NextResponse.json(data, { status: res.status });
}

