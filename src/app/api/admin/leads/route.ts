import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import Lead from '@/models/Lead';

const SESSION_TOKEN = process.env.ADMIN_SESSION_TOKEN || 'wb-admin-session-secret';

function isAuthed(req: NextRequest) {
  return req.cookies.get('wb_admin')?.value === SESSION_TOKEN;
}

export async function GET(req: NextRequest) {
  if (!isAuthed(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    await connectDB();
    const leads = await Lead.find({}).sort({ createdAt: -1 }).limit(200).lean();
    return NextResponse.json({ leads });
  } catch (err) {
    console.error('[admin/leads] Error:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  if (!isAuthed(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const { id, status } = await req.json();
    await connectDB();
    await Lead.findByIdAndUpdate(id, { status });
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[admin/leads PATCH] Error:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
