import { NextResponse, type NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  if (request.nextUrl.pathname === '/registro') {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    return NextResponse.redirect(url);
  }

  const token = request.cookies.get('cocount_token')?.value;
  const isDashboard = request.nextUrl.pathname.startsWith('/dashboard');
  const isAuthPage = request.nextUrl.pathname === '/login';

  if (!token && isDashboard) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    url.searchParams.set('reason', 'session_required');
    return NextResponse.redirect(url);
  }

  if (token && isAuthPage) {
    const url = request.nextUrl.clone();
    url.pathname = '/dashboard';
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/:path*', '/login', '/registro'],
};
