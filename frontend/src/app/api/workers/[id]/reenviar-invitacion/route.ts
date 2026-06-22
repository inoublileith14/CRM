import { NextRequest } from 'next/server';
import { proxyToBackend } from '@/lib/proxy-auth';

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(_request: NextRequest, context: RouteContext) {
  const { id } = await context.params;
  return proxyToBackend(`/workers/${id}/reenviar-invitacion`, {
    method: 'POST',
  });
}
