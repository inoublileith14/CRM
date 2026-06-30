import { NextRequest } from 'next/server';
import { proxyToBackend } from '@/lib/proxy-auth';

type RouteContext = {
  params: Promise<{ id: string; perfilId: string }>;
};

export async function PATCH(request: NextRequest, context: RouteContext) {
  const { id, perfilId } = await context.params;
  const body = await request.json();
  return proxyToBackend(`/clientes/${id}/perfiles/${perfilId}`, {
    method: 'PATCH',
    body: JSON.stringify(body),
  });
}

export async function DELETE(_request: NextRequest, context: RouteContext) {
  const { id, perfilId } = await context.params;
  return proxyToBackend(`/clientes/${id}/perfiles/${perfilId}`, {
    method: 'DELETE',
  });
}
