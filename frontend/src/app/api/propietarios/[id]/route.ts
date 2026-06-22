import { NextRequest } from 'next/server';
import { proxyToBackend } from '@/lib/proxy-auth';

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, context: RouteContext) {
  const { id } = await context.params;
  return proxyToBackend(`/propietarios/${id}`);
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  const { id } = await context.params;
  const body = await request.json();
  return proxyToBackend(`/propietarios/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(body),
  });
}

export async function DELETE(_request: NextRequest, context: RouteContext) {
  const { id } = await context.params;
  return proxyToBackend(`/propietarios/${id}`, { method: 'DELETE' });
}
