import { NextRequest } from 'next/server';
import { proxyToBackend } from '@/lib/proxy-auth';

export async function GET(request: NextRequest) {
  const search = request.nextUrl.searchParams.toString();
  const path = search ? `/inmuebles?${search}` : '/inmuebles';
  return proxyToBackend(path);
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  return proxyToBackend('/inmuebles', {
    method: 'POST',
    body: JSON.stringify(body),
  });
}
