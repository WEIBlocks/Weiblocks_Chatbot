'use client';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp?: Date | string;
}

interface MessageBubbleProps {
  message: Message;
}

function formatTime(ts?: Date | string): string {
  if (!ts) return '';
  const d = new Date(ts);
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function renderContent(content: string) {
  // Simple markdown-like rendering for bold and bullet points
  const lines = content.split('\n');
  return lines.map((line, i) => {
    // Bold text: **text**
    const boldReplaced = line.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    // Bullet points
    if (line.trim().startsWith('- ') || line.trim().startsWith('• ')) {
      return (
        <div key={i} style={{ display: 'flex', gap: '8px', marginTop: i > 0 ? '4px' : 0 }}>
          <span style={{ color: '#F5A450', flexShrink: 0 }}>•</span>
          <span dangerouslySetInnerHTML={{ __html: boldReplaced.replace(/^[-•]\s+/, '') }} />
        </div>
      );
    }
    if (line === '') return <br key={i} />;
    return <p key={i} style={{ margin: '2px 0' }} dangerouslySetInnerHTML={{ __html: boldReplaced }} />;
  });
}

export default function MessageBubble({ message }: MessageBubbleProps) {
  const isUser = message.role === 'user';

  return (
    <div style={{
      display: 'flex',
      flexDirection: isUser ? 'row-reverse' : 'row',
      alignItems: 'flex-end',
      gap: '8px',
      marginBottom: '12px',
      padding: '0 4px',
    }}>
      {/* Avatar */}
      {!isUser && (
        <div style={{
          width: '32px',
          height: '32px',
          borderRadius: '50%',
          background: 'linear-gradient(135deg, #F5A450, #BC403E)',
          flexShrink: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '14px',
          fontWeight: 700,
          color: '#fff',
          boxShadow: '0 2px 8px rgba(245,164,80,0.3)',
        }}>W</div>
      )}

      <div style={{ maxWidth: '78%', display: 'flex', flexDirection: 'column', alignItems: isUser ? 'flex-end' : 'flex-start' }}>
        {/* Bubble */}
        <div style={{
          padding: '10px 14px',
          borderRadius: isUser ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
          background: isUser
            ? 'linear-gradient(135deg, #F5A450, #B76D28)'
            : '#1e1e2e',
          color: '#fff',
          fontSize: '14px',
          lineHeight: '1.5',
          boxShadow: isUser
            ? '0 2px 12px rgba(245,164,80,0.25)'
            : '0 2px 8px rgba(0,0,0,0.3)',
          border: isUser ? 'none' : '1px solid rgba(245,164,80,0.15)',
          wordBreak: 'break-word',
        }}>
          {renderContent(message.content)}
        </div>

        {/* Timestamp */}
        {message.timestamp && (
          <span style={{
            fontSize: '11px',
            color: 'rgba(255,255,255,0.35)',
            marginTop: '4px',
            padding: '0 4px',
          }}>
            {formatTime(message.timestamp)}
          </span>
        )}
      </div>
    </div>
  );
}
