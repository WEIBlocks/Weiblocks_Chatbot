import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import Lead from '@/models/Lead';
import Conversation from '@/models/Conversation';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

export async function OPTIONS() {
  return new NextResponse(null, { headers: corsHeaders });
}

export async function POST(req: NextRequest) {
  try {
    const { sessionId, name, email, phone, projectType, budget, message } =
      await req.json();

    if (!sessionId || !name || !email) {
      return NextResponse.json(
        { error: 'sessionId, name, and email are required' },
        { status: 400, headers: corsHeaders }
      );
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email address' },
        { status: 400, headers: corsHeaders }
      );
    }

    await connectDB();

    // Find the associated conversation
    const conversation = await Conversation.findOne({ sessionId });

    // Upsert lead by sessionId to prevent duplicates
    const lead = await Lead.findOneAndUpdate(
      { sessionId },
      {
        $set: {
          name,
          email,
          ...(phone && { phone }),
          ...(projectType && { projectType }),
          ...(budget && { budget }),
          ...(message && { message }),
          ...(conversation && { conversationId: conversation._id }),
        },
      },
      { upsert: true, new: true }
    );

    return NextResponse.json(
      { success: true, leadId: lead._id.toString() },
      { headers: corsHeaders }
    );
  } catch (error) {
    console.error('Leads API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500, headers: corsHeaders }
    );
  }
}

export async function GET() {
  try {
    await connectDB();
    const leads = await Lead.find({}).sort({ createdAt: -1 }).limit(50);
    return NextResponse.json({ leads }, { headers: corsHeaders });
  } catch (error) {
    console.error('Leads GET error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500, headers: corsHeaders }
    );
  }
}
