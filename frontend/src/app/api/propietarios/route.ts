import { NextRequest } from 'next/server';
import { proxyToBackend } from '@/lib/proxy-auth';

export async function GET() {
  return proxyToBackend('/propietarios');
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  return proxyToBackend('/propietarios', {
    method: 'POST',
    body: JSON.stringify(body),
  });
}
