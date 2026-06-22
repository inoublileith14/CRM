import { NextRequest } from 'next/server';
import { proxyToBackend } from '@/lib/proxy-auth';

type RouteContext = {
  params: Promise<{ id: string; clienteId: string }>;
};

export async function PATCH(request: NextRequest, context: RouteContext) {
  const { id, clienteId } = await context.params;
  const body = await request.json();
  return proxyToBackend(
    `/inmuebles/${id}/clientes/${clienteId}/gestion-estado`,
    {
      method: 'PATCH',
      body: JSON.stringify(body),
    },
  );
}
