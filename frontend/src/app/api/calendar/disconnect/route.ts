import { proxyToBackend } from '@/lib/proxy-auth';

export async function DELETE() {
  return proxyToBackend('/calendar/disconnect', { method: 'DELETE' });
}
