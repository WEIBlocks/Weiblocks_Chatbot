import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { generateChatSummary } from '@/lib/summarize';
import { sendLeadEmail } from '@/lib/mailer';
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
  const start = Date.now();
  try {
    const { sessionId, name, email, phone, projectType, budget, subject, message } =
      await req.json();

    console.log(`[leads] New submission | session=${sessionId} | name=${name} | email=${email} | project=${projectType || 'General'}`);

    if (!sessionId || !name || !email) {
      console.warn('[leads] Missing required fields — rejected');
      return NextResponse.json(
        { error: 'sessionId, name, and email are required' },
        { status: 400, headers: corsHeaders }
      );
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      console.warn(`[leads] Invalid email format: ${email}`);
      return NextResponse.json(
        { error: 'Invalid email address' },
        { status: 400, headers: corsHeaders }
      );
    }

    await connectDB();
    console.log('[leads] DB connected');

    // Find the associated conversation
    const conversation = await Conversation.findOne({ sessionId });

    // Generate chat summary from conversation (non-blocking — don't fail the lead)
    let chatSummary = '';
    const transcript: { role: string; content: string }[] = [];
    if (conversation && conversation.messages.length >= 2) {
      const msgs = conversation.messages.map((m) => ({
        role: m.role,
        content: m.content,
      }));
      transcript.push(...msgs);
      try {
        chatSummary = await generateChatSummary(msgs);
        // Save summary to conversation too
        conversation.summary = chatSummary;
        conversation.detectedEmail = conversation.detectedEmail || email;
        await conversation.save();
      } catch (err) {
        console.error('Summary generation failed (non-fatal):', err);
      }
    }

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
          ...(subject && { subject }),
          ...(message && { message }),
          ...(conversation && { conversationId: conversation._id }),
          chatSummary: chatSummary || undefined,
          source: 'form',
          emailSent: true,
        },
      },
      { upsert: true, new: true }
    );

    console.log(`[leads] Lead upserted | leadId=${lead._id} | hasConversation=${!!conversation} | summaryLength=${chatSummary.length}`);

    // Send email with summary + transcript (non-blocking)
    sendLeadEmail({
      name,
      email,
      phone,
      projectType: projectType || 'General',
      subject,
      message,
      summary: chatSummary || 'No chat conversation recorded.',
      transcript,
      sessionId,
      source: 'form',
    }).catch((err) => console.error('[leads] Email send error (non-fatal):', err));

    const duration = Date.now() - start;
    console.log(`[leads] ✓ Done in ${duration}ms | leadId=${lead._id}`);

    return NextResponse.json(
      { success: true, leadId: lead._id.toString() },
      { headers: corsHeaders }
    );
  } catch (error) {
    console.error('[leads] ✗ API error:', error);
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
