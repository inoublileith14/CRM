import { NextRequest } from 'next/server';
import { proxyToBackend } from '@/lib/proxy-auth';

export async function PATCH(request: NextRequest) {
  const body = await request.json();
  return proxyToBackend('/auth/profile', {
    method: 'PATCH',
    body: JSON.stringify(body),
  });
}
