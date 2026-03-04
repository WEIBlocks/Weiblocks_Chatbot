import { Resend } from 'resend';

function getResend() {
  const key = process.env.RESEND_API_KEY;
  if (!key) return null;
  return new Resend(key);
}

const FROM = () => process.env.RESEND_FROM_EMAIL || 'Weiblocks Chatbot <no-reply@weiblocks.io>';
const TO = () => process.env.ALERT_EMAIL || 'hi@weiblocks.io';

interface TranscriptMsg {
  role: string;
  content: string;
}

function buildTranscriptHtml(messages: TranscriptMsg[]): string {
  return messages
    .map((m) => {
      const isUser = m.role === 'user';
      const label = isUser ? '👤 User' : '🤖 Bot';
      const bg = isUser ? '#FFF7ED' : '#F0F0F0';
      const text = m.content.replace(/\n/g, '<br/>').replace(/\[([^\]]+)\]\([^)]+\)/g, '$1');
      return `<div style="margin:4px 0;padding:8px 12px;background:${bg};border-radius:8px;font-size:13px">
        <strong style="color:${isUser ? '#F5A450' : '#666'}">${label}:</strong> ${text}
      </div>`;
    })
    .join('');
}

/** Send lead alert email with chat summary + transcript */
export async function sendLeadEmail(opts: {
  name?: string;
  email: string;
  phone?: string;
  projectType?: string;
  subject?: string;
  message?: string;
  summary: string;
  transcript: TranscriptMsg[];
  sessionId: string;
  source: 'form' | 'chat_detected';
}) {
  const resend = getResend();
  if (!resend) {
    console.warn('RESEND_API_KEY not set — skipping email');
    return;
  }

  const sourceLabel = opts.source === 'form' ? 'Form Submission' : 'Chat (Auto-Detected Email)';
  const subjectLine = opts.source === 'form'
    ? `🔔 New Lead: ${opts.name || opts.email} — ${opts.subject || opts.projectType || 'General'}`
    : `💬 Chat Lead: ${opts.email} — ${opts.projectType || 'General'}`;

  try {
    await resend.emails.send({
      from: FROM(),
      to: TO(),
      subject: subjectLine,
      html: `
        <div style="font-family:'Segoe UI',sans-serif;max-width:600px;margin:0 auto;background:#f9f9f9;border-radius:12px;overflow:hidden">
          <div style="background:linear-gradient(135deg,#F5A450,#BC403E);padding:24px 28px">
            <h2 style="color:#fff;margin:0;font-size:20px">${subjectLine}</h2>
            <p style="color:rgba(255,255,255,0.8);margin:6px 0 0;font-size:13px">${new Date().toLocaleString()} · ${sourceLabel}</p>
          </div>

          <div style="padding:24px 28px;background:#fff">
            <h3 style="margin:0 0 12px;color:#333;font-size:15px">Contact Info</h3>
            <table style="width:100%;border-collapse:collapse;font-size:14px">
              ${opts.name ? `<tr><td style="padding:6px 0;color:#888;width:110px">Name</td><td style="padding:6px 0;font-weight:600;color:#111">${opts.name}</td></tr>` : ''}
              <tr><td style="padding:6px 0;color:#888;width:110px">Email</td><td style="padding:6px 0"><a href="mailto:${opts.email}" style="color:#F5A450">${opts.email}</a></td></tr>
              ${opts.phone ? `<tr><td style="padding:6px 0;color:#888">Phone</td><td style="padding:6px 0"><a href="tel:${opts.phone}" style="color:#F5A450">${opts.phone}</a></td></tr>` : ''}
              <tr><td style="padding:6px 0;color:#888">Project Type</td><td style="padding:6px 0">${opts.projectType || 'General'}</td></tr>
              ${opts.subject ? `<tr><td style="padding:6px 0;color:#888">Subject</td><td style="padding:6px 0;font-weight:600">${opts.subject}</td></tr>` : ''}
              ${opts.message ? `<tr><td style="padding:6px 0;color:#888;vertical-align:top">Message</td><td style="padding:6px 0;color:#333;line-height:1.5">${opts.message}</td></tr>` : ''}
            </table>
          </div>

          <div style="padding:20px 28px;background:#fff;border-top:1px solid #eee">
            <h3 style="margin:0 0 10px;color:#333;font-size:15px">AI Chat Summary</h3>
            <div style="padding:12px 16px;background:#FFF7ED;border-left:3px solid #F5A450;border-radius:6px;font-size:13px;color:#333;line-height:1.6">
              ${opts.summary}
            </div>
          </div>

          <div style="padding:20px 28px;background:#fff;border-top:1px solid #eee">
            <h3 style="margin:0 0 10px;color:#333;font-size:15px">Full Transcript</h3>
            ${buildTranscriptHtml(opts.transcript)}
          </div>

          <div style="padding:14px 28px;background:#f9f9f9;border-top:1px solid #eee;text-align:center;font-size:11px;color:#aaa">
            Session: ${opts.sessionId} · <a href="https://weiblocks.io" style="color:#F5A450;text-decoration:none">weiblocks.io</a>
          </div>
        </div>
      `,
    });
  } catch (err) {
    console.error('Email send error:', err);
  }
}
