import { NextRequest } from 'next/server';
import { proxyToBackend } from '@/lib/proxy-auth';

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ eventId: string }> },
) {
  const { eventId } = await context.params;
  const body = await request.text();
  return proxyToBackend(`/calendar/events/${encodeURIComponent(eventId)}`, {
    method: 'PATCH',
    body,
  });
}
