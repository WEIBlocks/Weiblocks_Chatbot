import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';
import { connectDB } from '@/lib/mongodb';
import Lead from '@/models/Lead';
import Conversation from '@/models/Conversation';

function getResend() {
  const key = process.env.RESEND_API_KEY;
  if (!key) return null;
  return new Resend(key);
}

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
    const { sessionId, name, email, phone, projectType, budget, subject, message } =
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
          ...(subject && { subject }),
          ...(message && { message }),
          ...(conversation && { conversationId: conversation._id }),
        },
      },
      { upsert: true, new: true }
    );

    // Send alert email non-blocking — never fail the response if email fails
    const resend = getResend();
    const alertTo = process.env.ALERT_EMAIL || 'hi@weiblocks.io';
    if (resend) {
      resend.emails.send({
        from: process.env.RESEND_FROM_EMAIL || 'Weiblocks Chatbot <no-reply@weiblocks.io>',
        to: alertTo,
        subject: `🔔 New Lead: ${name} — ${subject || projectType || 'General'}`,
        html: `
          <div style="font-family:sans-serif;max-width:560px;margin:0 auto;background:#f9f9f9;border-radius:12px;overflow:hidden">
            <div style="background:linear-gradient(135deg,#F5A450,#BC403E);padding:24px 28px">
              <h2 style="color:#fff;margin:0;font-size:20px">🔔 New Lead from Weiblocks Chatbot</h2>
              <p style="color:rgba(255,255,255,0.8);margin:6px 0 0;font-size:13px">${new Date().toLocaleString()}</p>
            </div>
            <div style="padding:24px 28px;background:#fff">
              <table style="width:100%;border-collapse:collapse;font-size:14px">
                <tr><td style="padding:8px 0;color:#888;width:120px">Name</td><td style="padding:8px 0;font-weight:600;color:#111">${name}</td></tr>
                <tr><td style="padding:8px 0;color:#888">Email</td><td style="padding:8px 0"><a href="mailto:${email}" style="color:#F5A450">${email}</a></td></tr>
                ${phone ? `<tr><td style="padding:8px 0;color:#888">Phone</td><td style="padding:8px 0"><a href="tel:${phone}" style="color:#F5A450">${phone}</a></td></tr>` : ''}
                <tr><td style="padding:8px 0;color:#888">Project Type</td><td style="padding:8px 0">${projectType || 'General'}</td></tr>
                ${subject ? `<tr><td style="padding:8px 0;color:#888">Subject</td><td style="padding:8px 0;font-weight:600;color:#111">${subject}</td></tr>` : ''}
                ${message ? `<tr><td style="padding:8px 0;color:#888;vertical-align:top">Message</td><td style="padding:8px 0;color:#333;line-height:1.5">${message}</td></tr>` : ''}
                <tr><td style="padding:8px 0;color:#888">Session ID</td><td style="padding:8px 0;font-size:11px;color:#aaa">${sessionId}</td></tr>
              </table>
            </div>
            <div style="padding:16px 28px;background:#f9f9f9;border-top:1px solid #eee;text-align:center">
              <a href="https://weiblocks.io" style="color:#F5A450;font-size:12px;text-decoration:none">weiblocks.io</a>
            </div>
          </div>
        `,
      }).catch(err => console.error('Resend email error:', err));
    }

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
