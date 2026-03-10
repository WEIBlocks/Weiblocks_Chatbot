import { NextResponse } from 'next/server';
import { Resend } from 'resend';

/**
 * GET /api/test-email
 * Diagnostic endpoint — sends a simple test email via Resend and returns
 * the full result (or error) so you can see exactly what's happening.
 *
 * DELETE THIS FILE before going to production.
 */
export async function GET() {
  const diagnostics: Record<string, unknown> = {
    timestamp: new Date().toISOString(),
    RESEND_API_KEY_set: !!process.env.RESEND_API_KEY,
    RESEND_API_KEY_prefix: process.env.RESEND_API_KEY?.slice(0, 8) || 'NOT SET',
    RESEND_FROM_EMAIL: process.env.RESEND_FROM_EMAIL || 'NOT SET (will default to fallback)',
    ALERT_EMAIL: process.env.ALERT_EMAIL || 'NOT SET (will default to hi@weiblocks.io)',
  };

  // If key is missing, return immediately
  if (!process.env.RESEND_API_KEY) {
    return NextResponse.json({
      success: false,
      error: 'RESEND_API_KEY is not set in environment variables',
      diagnostics,
    }, {
      headers: { 'Access-Control-Allow-Origin': '*' },
    });
  }

  const resend = new Resend(process.env.RESEND_API_KEY);
  const from = process.env.RESEND_FROM_EMAIL || 'Weiblocks Chatbot <no-reply@weiblocks.io>';
  const to = process.env.ALERT_EMAIL || 'hi@weiblocks.io';

  try {
    const result = await resend.emails.send({
      from,
      to,
      subject: '✅ Weiblocks Email Test — It Works!',
      html: `
        <div style="font-family:sans-serif;padding:24px;max-width:500px;margin:0 auto">
          <h2 style="color:#F5A450">Email Sending Works!</h2>
          <p>This is a test email from your Weiblocks chatbot deployment.</p>
          <p style="color:#888;font-size:12px">Sent at: ${new Date().toISOString()}</p>
          <hr style="border:none;border-top:1px solid #eee;margin:16px 0"/>
          <p style="font-size:12px;color:#aaa">From: ${from}<br/>To: ${to}</p>
        </div>
      `,
    });

    return NextResponse.json({
      success: true,
      message: 'Email sent successfully! Check your inbox.',
      resend_response: result,
      diagnostics,
    }, {
      headers: { 'Access-Control-Allow-Origin': '*' },
    });
  } catch (err: unknown) {
    const errorDetails = err instanceof Error
      ? { name: err.name, message: err.message, stack: err.stack?.split('\n').slice(0, 3) }
      : err;

    return NextResponse.json({
      success: false,
      error: 'Email send failed',
      error_details: errorDetails,
      diagnostics,
    }, {
      status: 500,
      headers: { 'Access-Control-Allow-Origin': '*' },
    });
  }
}
