import { NextResponse } from 'next/server';
import { getBackendUrl } from '@/lib/backend-url';

export async function POST() {
  try {
    await fetch(`${getBackendUrl()}/auth/logout`, { method: 'POST' });
  } catch {
    // Ignorar si el backend no está disponible
  }

  const response = NextResponse.json({ mensaje: 'Sesión cerrada' });
  response.cookies.delete('cocount_token');
  response.cookies.delete('coconut_sb_access');
  response.cookies.delete('coconut_sb_refresh');
  return response;
}
