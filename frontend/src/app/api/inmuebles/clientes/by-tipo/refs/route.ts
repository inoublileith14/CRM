import { NextRequest } from 'next/server';
import { proxyToBackend } from '@/lib/proxy-auth';

export async function GET(request: NextRequest) {
  const search = request.nextUrl.searchParams.toString();
  const path = search
    ? `/inmuebles/clientes/by-tipo/refs?${search}`
    : '/inmuebles/clientes/by-tipo/refs';
  return proxyToBackend(path);
}
