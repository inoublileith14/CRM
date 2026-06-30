import { getAuthToken } from '@/lib/proxy-auth';
import { getBackendUrl } from '@/lib/backend-url';
import { NextResponse } from 'next/server';

export async function GET() {
  const token = await getAuthToken();
  if (!token) {
    return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
  }

  let backendRes: Response;
  try {
    backendRes = await fetch(`${getBackendUrl()}/calendar/stream`, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'text/event-stream',
      },
      cache: 'no-store',
    });
  } catch {
    return NextResponse.json(
      { error: 'No se pudo conectar con el servidor' },
      { status: 502 },
    );
  }

  if (!backendRes.ok || !backendRes.body) {
    const data = await backendRes.json().catch(() => ({}));
    return NextResponse.json(data, { status: backendRes.status });
  }

  return new Response(backendRes.body, {
    status: 200,
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  });
}
