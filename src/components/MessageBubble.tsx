'use client';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp?: Date | string;
}

function formatTime(ts?: Date | string): string {
  if (!ts) return '';
  return new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

const LINK_STYLE = 'color:#F5A450;text-decoration:underline;text-underline-offset:2px;';

const LINK_BUTTON_STYLE = [
  'display:inline-flex',
  'align-items:center',
  'gap:6px',
  'padding:8px 16px',
  'margin:4px 4px 4px 0',
  'background:rgba(245,164,80,0.1)',
  'border:1px solid rgba(245,164,80,0.35)',
  'border-radius:100px',
  'color:#F5A450',
  'font-size:12.5px',
  'font-weight:600',
  'text-decoration:none',
  'cursor:pointer',
  'transition:all 0.18s',
  'font-family:inherit',
  'white-space:nowrap',
  'line-height:1.4',
].join(';');

function linkify(text: string): string {
  // Markdown-style links [Button Text](URL) → styled button links
  text = text.replace(
    /\[([^\]]+)\]\((https?:\/\/[^)]+)\)/g,
    `<a href="$2" style="${LINK_BUTTON_STYLE}" target="_blank" rel="noopener noreferrer" onmouseover="this.style.background='rgba(245,164,80,0.2)';this.style.borderColor='rgba(245,164,80,0.6)';this.style.transform='translateY(-1px)';this.style.boxShadow='0 4px 12px rgba(245,164,80,0.15)'" onmouseout="this.style.background='rgba(245,164,80,0.1)';this.style.borderColor='rgba(245,164,80,0.35)';this.style.transform='none';this.style.boxShadow='none'"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" style="flex-shrink:0"><path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6M15 3h6v6M10 14L21 3" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>$1</a>`
  );
  // emails
  text = text.replace(
    /([a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,})/g,
    `<a href="mailto:$1" style="${LINK_STYLE}" target="_blank" rel="noopener noreferrer">$1</a>`
  );
  // URLs (http/https) — skip if already inside an href or button
  text = text.replace(
    /(?<!href=")(https?:\/\/[^\s<"']+)/g,
    `<a href="$1" style="${LINK_STYLE}" target="_blank" rel="noopener noreferrer">$1</a>`
  );
  // phone numbers e.g. +1 302-366-3496
  text = text.replace(
    /(\+?[\d][\d\s\-().]{7,}[\d])/g,
    `<a href="tel:$1" style="${LINK_STYLE}">$1</a>`
  );
  return text;
}

function renderContent(content: string) {
  const lines = content.split('\n');
  return lines.map((line, i) => {
    const html = linkify(
      line
        .replace(/\*\*(.*?)\*\*/g, '<strong style="color:#F5A450;font-weight:700">$1</strong>')
        .replace(/\*(.*?)\*/g, '<em>$1</em>')
    );

    if (line.trim().startsWith('- ') || line.trim().startsWith('• ')) {
      return (
        <div key={i} style={{ display: 'flex', gap: '8px', marginTop: i > 0 ? '5px' : 0, alignItems: 'flex-start' }}>
          <span style={{
            width: '5px', height: '5px', borderRadius: '50%',
            background: '#F5A450', flexShrink: 0, marginTop: '7px',
            boxShadow: '0 0 4px rgba(245,164,80,0.5)',
          }} />
          <span dangerouslySetInnerHTML={{ __html: html.replace(/^[-•]\s+/, '') }} />
        </div>
      );
    }
    if (line === '') return <div key={i} style={{ height: '6px' }} />;
    return (
      <p key={i} style={{ margin: '1px 0', lineHeight: 1.55 }}
        dangerouslySetInnerHTML={{ __html: html }} />
    );
  });
}

export default function MessageBubble({ message }: { message: Message }) {
  const isUser = message.role === 'user';

  return (
    <div style={{
      display: 'flex',
      flexDirection: isUser ? 'row-reverse' : 'row',
      alignItems: 'flex-end',
      gap: '8px',
      marginBottom: '14px',
      padding: '0 2px',
      animation: 'wb-msgIn 0.25s ease both',
    }}>
      <style>{`
        @keyframes wb-msgIn {
          from { opacity: 0; transform: translateY(8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      {/* Bot avatar */}
      {!isUser && (
        <img src="/weiblocks.png" alt="Weiblocks" style={{
          width: '30px', height: '30px', borderRadius: '10px',
          objectFit: 'cover', flexShrink: 0,
          boxShadow: '0 2px 10px rgba(245,164,80,0.3)',
        }} />
      )}

      <div style={{
        maxWidth: '80%',
        display: 'flex', flexDirection: 'column',
        alignItems: isUser ? 'flex-end' : 'flex-start',
      }}>
        {/* Bubble */}
        <div style={{
          padding: '11px 16px',
          borderRadius: isUser
            ? '20px 20px 5px 20px'
            : '20px 20px 20px 5px',
          background: isUser
            ? 'linear-gradient(135deg, #F5A450 0%, #d4751c 100%)'
            : 'rgba(255,255,255,0.055)',
          border: isUser
            ? 'none'
            : '1px solid rgba(255,255,255,0.08)',
          color: '#fff',
          fontSize: '13.5px',
          lineHeight: 1.55,
          wordBreak: 'break-word',
          boxShadow: isUser
            ? '0 4px 18px rgba(245,164,80,0.3), inset 0 1px 0 rgba(255,255,255,0.15)'
            : '0 2px 12px rgba(0,0,0,0.3)',
          backdropFilter: isUser ? 'none' : 'blur(10px)',
        }}>
          {renderContent(message.content)}
        </div>

        {/* Timestamp */}
        {message.timestamp && (
          <span style={{
            fontSize: '10.5px',
            color: 'rgba(255,255,255,0.22)',
            marginTop: '4px',
            padding: '0 4px',
          }}>
            {formatTime(message.timestamp)}
          </span>
        )}
      </div>

      {/* User avatar */}
      {isUser && (
        <div style={{
          width: '30px', height: '30px', borderRadius: '10px',
          background: 'linear-gradient(135deg, rgba(255,255,255,0.15), rgba(255,255,255,0.08))',
          border: '1px solid rgba(255,255,255,0.12)',
          flexShrink: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '13px', color: 'rgba(255,255,255,0.7)',
        }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="8" r="4" stroke="currentColor" strokeWidth="1.8"/>
            <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
          </svg>
        </div>
      )}
    </div>
  );
}
