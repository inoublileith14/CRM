import { NextRequest } from 'next/server';
import { proxyToBackend } from '@/lib/proxy-auth';

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(request: NextRequest, context: RouteContext) {
  const { id } = await context.params;
  const body = await request.json();
  return proxyToBackend(`/clientes/${id}/perfiles`, {
    method: 'POST',
    body: JSON.stringify(body),
  });
}
