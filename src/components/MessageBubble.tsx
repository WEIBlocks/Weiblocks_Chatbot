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

// Regex to detect markdown links: [text](url)
const MD_LINK_RE = /\[([^\]]+)\]\((https?:\/\/[^)]+)\)/g;

function linkify(text: string): string {
  // emails
  text = text.replace(
    /([a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,})/g,
    `<a href="mailto:$1" style="${LINK_STYLE}" target="_blank" rel="noopener noreferrer">$1</a>`
  );
  // URLs (http/https) — skip if already inside an href
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

/** Extract markdown links from a line, return { cleaned, links[] } */
function extractLinks(line: string): { cleaned: string; links: { text: string; url: string }[] } {
  const links: { text: string; url: string }[] = [];
  const cleaned = line.replace(MD_LINK_RE, (_match, text, url) => {
    links.push({ text, url });
    return ''; // remove from text
  }).replace(/→\s*$/, '').trimEnd(); // remove trailing → arrow
  return { cleaned, links };
}

function LinkButton({ text, url }: { text: string; url: string }) {
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '6px',
        padding: '7px 13px',
        margin: '3px 3px 3px 0',
        background: 'rgba(245,164,80,0.1)',
        border: '1px solid rgba(245,164,80,0.35)',
        borderRadius: '100px',
        color: '#F5A450',
        fontSize: '12px',
        fontWeight: 600,
        textDecoration: 'none',
        cursor: 'pointer',
        transition: 'all 0.18s',
        fontFamily: 'inherit',
        whiteSpace: 'normal',
        maxWidth: '100%',
        minWidth: 0,
        lineHeight: 1.4,
      }}
      onMouseEnter={e => {
        const t = e.currentTarget;
        t.style.background = 'rgba(245,164,80,0.2)';
        t.style.borderColor = 'rgba(245,164,80,0.6)';
        t.style.transform = 'translateY(-1px)';
        t.style.boxShadow = '0 4px 12px rgba(245,164,80,0.15)';
      }}
      onMouseLeave={e => {
        const t = e.currentTarget;
        t.style.background = 'rgba(245,164,80,0.1)';
        t.style.borderColor = 'rgba(245,164,80,0.35)';
        t.style.transform = 'none';
        t.style.boxShadow = 'none';
      }}
    >
      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0 }}>
        <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6M15 3h6v6M10 14L21 3"
          stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
      {text}
    </a>
  );
}

function renderContent(content: string) {
  const lines = content.split('\n');
  const collectedLinks: { text: string; url: string }[] = [];
  const elements: React.ReactNode[] = [];

  lines.forEach((line, i) => {
    const { cleaned, links } = extractLinks(line);
    const trimmed = cleaned.trim();
    const isBulletLine = /^(\*|-|•)\s*$/.test(trimmed); // line is ONLY a bullet marker after link removal
    const isNumberedLine = /^\d+\.\s*$/.test(trimmed);

    // Inline markdown → HTML (bold, italic)
    const toHtml = (text: string) => linkify(
      text
        .replace(/\*\*(.*?)\*\*/g, '<strong style="color:#F5A450;font-weight:700">$1</strong>')
        .replace(/\*(.*?)\*/g, '<em>$1</em>')
    );

    // Case: bullet/numbered line whose text content was entirely a markdown link
    // e.g. "- [Blog Title](url)"  →  render as bullet row with inline LinkButton
    if (links.length > 0 && (isBulletLine || isNumberedLine || !trimmed)) {
      elements.push(
        <div key={i} style={{ display: 'flex', gap: '8px', marginTop: i > 0 ? '4px' : 0, alignItems: 'center', flexWrap: 'wrap' }}>
          {links.map((link, j) => <LinkButton key={j} text={link.text} url={link.url} />)}
        </div>
      );
      return;
    }

    // Line has both text and links — collect links for bottom buttons, render text normally
    if (links.length > 0) collectedLinks.push(...links);

    // ## or ### heading
    if (/^#{1,3}\s/.test(trimmed)) {
      const text = trimmed.replace(/^#{1,3}\s+/, '');
      elements.push(
        <p key={i} style={{ margin: '8px 0 3px', fontWeight: 700, color: '#F5A450', fontSize: '13px' }}
          dangerouslySetInnerHTML={{ __html: toHtml(text) }} />
      );
    // Bullet: - item / * item / • item
    } else if (/^(\*|-|•)\s/.test(trimmed)) {
      elements.push(
        <div key={i} style={{ display: 'flex', gap: '8px', marginTop: i > 0 ? '5px' : 0, alignItems: 'flex-start' }}>
          <span style={{
            width: '5px', height: '5px', borderRadius: '50%',
            background: '#F5A450', flexShrink: 0, marginTop: '7px',
            boxShadow: '0 0 4px rgba(245,164,80,0.5)',
          }} />
          <span dangerouslySetInnerHTML={{ __html: toHtml(trimmed.replace(/^[*\-•]\s+/, '')) }} />
        </div>
      );
    // Numbered list: 1. item
    } else if (/^\d+\.\s/.test(trimmed)) {
      const num = trimmed.match(/^(\d+)\./)?.[1] ?? '';
      const text = trimmed.replace(/^\d+\.\s+/, '');
      elements.push(
        <div key={i} style={{ display: 'flex', gap: '8px', marginTop: i > 0 ? '5px' : 0, alignItems: 'flex-start' }}>
          <span style={{
            minWidth: '18px', height: '18px', borderRadius: '50%',
            background: 'rgba(245,164,80,0.18)', color: '#F5A450',
            fontSize: '10px', fontWeight: 700, flexShrink: 0,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            marginTop: '2px',
          }}>{num}</span>
          <span dangerouslySetInnerHTML={{ __html: toHtml(text) }} />
        </div>
      );
    // Empty line → small spacer
    } else if (trimmed === '') {
      elements.push(<div key={i} style={{ height: '6px' }} />);
    // Normal paragraph
    } else {
      elements.push(
        <p key={i} style={{ margin: '1px 0', lineHeight: 1.55 }}
          dangerouslySetInnerHTML={{ __html: toHtml(cleaned) }} />
      );
    }
  });

  // Render all collected link buttons at the bottom
  if (collectedLinks.length > 0) {
    elements.push(
      <div key="link-buttons" style={{ display: 'flex', flexWrap: 'wrap', marginTop: '8px', gap: '4px', minWidth: 0, overflow: 'hidden' }}>
        {collectedLinks.map((link, j) => (
          <LinkButton key={j} text={link.text} url={link.url} />
        ))}
      </div>
    );
  }

  return elements;
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
        minWidth: 0,
        overflow: 'hidden',
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
