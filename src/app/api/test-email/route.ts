// Diagnostic endpoint disabled — uncomment to re-enable for debugging.
// import { NextResponse } from 'next/server';
// import { Resend } from 'resend';
//
// export async function GET() {
//   const diagnostics: Record<string, unknown> = {
//     timestamp: new Date().toISOString(),
//     RESEND_API_KEY_set: !!process.env.RESEND_API_KEY,
//     RESEND_API_KEY_prefix: process.env.RESEND_API_KEY?.slice(0, 8) || 'NOT SET',
//     RESEND_FROM_EMAIL: process.env.RESEND_FROM_EMAIL || 'NOT SET',
//     ALERT_EMAIL: process.env.ALERT_EMAIL || 'NOT SET',
//   };
//
//   if (!process.env.RESEND_API_KEY) {
//     return NextResponse.json({ success: false, error: 'RESEND_API_KEY not set', diagnostics });
//   }
//
//   const resend = new Resend(process.env.RESEND_API_KEY);
//   const from = process.env.RESEND_FROM_EMAIL || 'Weiblocks Chatbot <no-reply@weiblocks.io>';
//   const to = process.env.ALERT_EMAIL || 'hi@weiblocks.io';
//
//   try {
//     const result = await resend.emails.send({
//       from, to,
//       subject: '✅ Weiblocks Email Test',
//       html: '<h2 style="color:#F5A450">It works!</h2>',
//     });
//     return NextResponse.json({ success: true, resend_response: result, diagnostics });
//   } catch (err: unknown) {
//     return NextResponse.json({ success: false, error: err }, { status: 500 });
//   }
// }
