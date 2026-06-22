import { proxyToBackend } from '@/lib/proxy-auth';

export async function GET() {
  return proxyToBackend('/workers/me');
}
