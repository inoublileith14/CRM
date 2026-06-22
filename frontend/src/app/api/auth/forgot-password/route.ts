import { NextRequest, NextResponse } from 'next/server';
import { getBackendUrl } from '@/lib/backend-url';
import { parseNestProxyError } from '@/lib/parse-api-error';

export async function POST(request: NextRequest) {
  const body = await request.json();

  let res: Response;

  try {
    res = await fetch(`${getBackendUrl()}/auth/forgot-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
  } catch {
    return NextResponse.json(
      { error: 'No se pudo conectar con el servidor', code: 'NETWORK_ERROR' },
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
