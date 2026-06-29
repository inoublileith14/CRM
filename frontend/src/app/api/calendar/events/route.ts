import { proxyToBackend } from '@/lib/proxy-auth';
import { NextRequest } from 'next/server';

export async function GET() {
  return proxyToBackend('/calendar/events');
}

export async function POST(request: NextRequest) {
  const body = await request.text();
  return proxyToBackend('/calendar/events', {
    method: 'POST',
    body,
  });
}
