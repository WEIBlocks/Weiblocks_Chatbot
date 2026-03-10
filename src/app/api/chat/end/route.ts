import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { generateChatSummary } from '@/lib/summarize';
import { sendLeadEmail } from '@/lib/mailer';
import Conversation from '@/models/Conversation';
import Lead from '@/models/Lead';

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
    const { sessionId, email } = await req.json();

    if (!sessionId) {
      return NextResponse.json(
        { error: 'sessionId is required' },
        { status: 400, headers: corsHeaders }
      );
    }

    await connectDB();

    // Find the conversation
    const conversation = await Conversation.findOne({ sessionId });
    if (!conversation || conversation.messages.length < 2) {
      // Too short to summarize — just mark completed
      if (conversation) {
        conversation.status = 'completed';
        conversation.closedAt = new Date();
        await conversation.save();
      }
      return NextResponse.json({ success: true, summary: null }, { headers: corsHeaders });
    }

    // Already completed? Skip duplicate processing
    if (conversation.status === 'completed') {
      return NextResponse.json(
        { success: true, summary: conversation.summary },
        { headers: corsHeaders }
      );
    }

    // Use the email from the request, or from conversation detection, or from existing lead
    const userEmail = email || conversation.detectedEmail;

    // Generate AI summary
    const msgs = conversation.messages.map((m) => ({
      role: m.role,
      content: m.content,
    }));
    const summary = await generateChatSummary(msgs);

    // Update conversation
    conversation.summary = summary;
    conversation.status = 'completed';
    conversation.closedAt = new Date();
    await conversation.save();

    // If we have an email, create/update lead and send email
    if (userEmail) {
      const existingLead = await Lead.findOne({ sessionId });

      if (existingLead) {
        // Lead already exists (from form) — update summary if not already set
        if (!existingLead.chatSummary) {
          existingLead.chatSummary = summary;
          await existingLead.save();
        }
        // If form lead already sent email, don't send again
        if (existingLead.emailSent) {
          return NextResponse.json({ success: true, summary }, { headers: corsHeaders });
        }
      } else {
        // No form was submitted — create a chat-detected lead
        await Lead.create({
          sessionId,
          email: userEmail,
          projectType: conversation.projectType || 'General',
          chatSummary: summary,
          source: 'chat_detected',
          emailSent: false,
          conversationId: conversation._id,
        });
      }

      // Send the email alert — await so Vercel doesn't kill the function early
      try {
        await sendLeadEmail({
          email: userEmail,
          projectType: conversation.projectType || 'General',
          summary,
          transcript: msgs,
          sessionId,
          source: existingLead ? 'form' : 'chat_detected',
        });
        // Mark emailSent=true only after success
        await Lead.updateOne({ sessionId }, { $set: { emailSent: true } });
      } catch (emailErr) {
        console.error('[chat/end] ✗ Email failed:', emailErr);
      }
    }

    return NextResponse.json({ success: true, summary }, { headers: corsHeaders });
  } catch (error) {
    console.error('Chat end API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500, headers: corsHeaders }
    );
  }
}
