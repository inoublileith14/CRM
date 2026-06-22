import { NextRequest } from 'next/server';
import { proxyToBackend } from '@/lib/proxy-auth';

type RouteContext = { params: Promise<{ jobId: string }> };

export async function GET(_request: NextRequest, context: RouteContext) {
  const { jobId } = await context.params;
  return proxyToBackend(`/clientes/import/${jobId}`);
}
