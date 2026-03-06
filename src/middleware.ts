import { NextRequest, NextResponse } from 'next/server';

const SESSION_TOKEN = process.env.ADMIN_SESSION_TOKEN || 'wb-admin-session-secret';

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Only protect /admin routes, not /admin/login
  if (pathname.startsWith('/admin') && !pathname.startsWith('/admin/login')) {
    const token = req.cookies.get('wb_admin')?.value;
    if (token !== SESSION_TOKEN) {
      return NextResponse.redirect(new URL('/admin/login', req.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*'],
};
