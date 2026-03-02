'use client';

export default function TypingIndicator() {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      marginBottom: '16px',
      padding: '0 2px',
    }}>
      {/* Avatar */}
      <img src="/weiblocks.png" alt="Weiblocks" style={{
        width: '30px', height: '30px', borderRadius: '10px',
        objectFit: 'cover', flexShrink: 0,
        boxShadow: '0 2px 10px rgba(245,164,80,0.35)',
      }} />

      {/* Bubble */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '5px',
        padding: '12px 18px',
        background: 'rgba(255,255,255,0.05)',
        border: '1px solid rgba(245,164,80,0.12)',
        borderRadius: '18px 18px 18px 4px',
        boxShadow: '0 2px 12px rgba(0,0,0,0.25)',
      }}>
        {[0, 1, 2].map((i) => (
          <span key={i} style={{
            width: '7px', height: '7px', borderRadius: '50%',
            background: `rgba(245,164,80,${0.9 - i * 0.1})`,
            display: 'block',
            animation: 'wb-typing 1.3s ease-in-out infinite',
            animationDelay: `${i * 0.18}s`,
          }} />
        ))}
        <style>{`
          @keyframes wb-typing {
            0%, 60%, 100% { transform: translateY(0); opacity: 0.4; }
            30%            { transform: translateY(-6px); opacity: 1; }
          }
        `}</style>
      </div>

      <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.25)', fontStyle: 'italic' }}>
        typing...
      </span>
    </div>
  );
}
