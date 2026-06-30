import { proxyToBackend } from '@/lib/proxy-auth';
import { NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
  const from = request.nextUrl.searchParams.get('from');
  const to = request.nextUrl.searchParams.get('to');
  const params = new URLSearchParams();
  if (from) params.set('from', from);
  if (to) params.set('to', to);
  const path = params.toString()
    ? `/calendar/events?${params.toString()}`
    : '/calendar/events';
  return proxyToBackend(path);
}

export async function POST(request: NextRequest) {
  const body = await request.text();
  return proxyToBackend('/calendar/events', {
    method: 'POST',
    body,
  });
}
