import { NextRequest, NextResponse } from 'next/server';

const ADMIN_EMAIL    = process.env.ADMIN_EMAIL    || 'admin@weiblocks.io';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'weiblocks-admin-2026';
const SESSION_TOKEN  = process.env.ADMIN_SESSION_TOKEN || 'wb-admin-session-secret';

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();

    if (email !== ADMIN_EMAIL || password !== ADMIN_PASSWORD) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    const res = NextResponse.json({ success: true });
    res.cookies.set('wb_admin', SESSION_TOKEN, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: '/',
    });
    return res;
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function DELETE() {
  const res = NextResponse.json({ success: true });
  res.cookies.delete('wb_admin');
  return res;
}
