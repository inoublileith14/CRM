import { NextRequest } from 'next/server';
import { proxyToBackend } from '@/lib/proxy-auth';

export async function GET() {
  return proxyToBackend('/clientes');
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  return proxyToBackend('/clientes', {
    method: 'POST',
    body: JSON.stringify(body),
  });
}
