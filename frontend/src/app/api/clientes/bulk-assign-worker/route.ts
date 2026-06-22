import { NextRequest } from 'next/server';
import { proxyToBackend } from '@/lib/proxy-auth';

export async function POST(request: NextRequest) {
  const body = await request.json();
  return proxyToBackend('/clientes/bulk-assign-worker', {
    method: 'POST',
    body: JSON.stringify(body),
  });
}
