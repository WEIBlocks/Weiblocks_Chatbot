import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import Conversation from '@/models/Conversation';

const SESSION_TOKEN = process.env.ADMIN_SESSION_TOKEN || 'wb-admin-session-secret';

function isAuthed(req: NextRequest) {
  return req.cookies.get('wb_admin')?.value === SESSION_TOKEN;
}

export async function GET(req: NextRequest) {
  if (!isAuthed(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    await connectDB();
    const conversations = await Conversation.find({})
      .sort({ updatedAt: -1 })
      .limit(200)
      .select('sessionId projectType detectedEmail intentDetected status summary createdAt updatedAt messages')
      .lean();

    // Attach message count and last message preview
    const data = conversations.map((c) => ({
      ...c,
      messageCount: c.messages.length,
      lastMessage: c.messages.at(-1)?.content?.slice(0, 100) || '',
      lastActive: c.updatedAt,
    }));

    return NextResponse.json({ conversations: data });
  } catch (err) {
    console.error('[admin/conversations] Error:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
