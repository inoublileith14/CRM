import { proxyToBackend } from '@/lib/proxy-auth';

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: Request, context: RouteContext) {
  const { id } = await context.params;
  return proxyToBackend(`/whatsapp/conversations/${id}/messages`);
}

