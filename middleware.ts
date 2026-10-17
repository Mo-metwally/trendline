import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 1. If someone accesses /login, redirect permanently to /admin/login
  if (pathname === '/login') {
    const url = request.nextUrl.clone();
    url.pathname = '/admin/login';
    return NextResponse.redirect(url);
  }

  // Check for authenticated session token in cookies
  const authToken =
    request.cookies.get('token')?.value ||
    request.cookies.get('trendline_token')?.value ||
    request.cookies.get('next-auth.session-token')?.value ||
    request.cookies.get('__Secure-next-auth.session-token')?.value;

  const isAuthenticated = !!authToken;

  // 2. Admin Login page rules:
  if (pathname === '/admin/login') {
    // If already logged in, redirect to /admin
    if (isAuthenticated) {
      const url = request.nextUrl.clone();
      url.pathname = '/admin';
      return NextResponse.redirect(url);
    }
    // Allow access to /admin/login
    return NextResponse.next();
  }

  // 3. Protected /admin routes rules:
  if (pathname.startsWith('/admin')) {
    // If not authenticated, redirect to /admin/login
    if (!isAuthenticated) {
      const url = request.nextUrl.clone();
      url.pathname = '/admin/login';
      return NextResponse.redirect(url);
    }
    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*', '/login'],
};
