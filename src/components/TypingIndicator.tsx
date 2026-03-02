'use client';

export default function TypingIndicator() {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: '4px',
      padding: '12px 16px',
      background: '#1e1e2e',
      borderRadius: '18px 18px 18px 4px',
      width: 'fit-content',
      marginBottom: '8px',
    }}>
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          style={{
            width: '8px',
            height: '8px',
            borderRadius: '50%',
            background: '#F5A450',
            animation: 'wb-bounce 1.4s infinite ease-in-out',
            animationDelay: `${i * 0.16}s`,
            display: 'block',
          }}
        />
      ))}
      <style>{`
        @keyframes wb-bounce {
          0%, 80%, 100% { transform: scale(0.6); opacity: 0.4; }
          40% { transform: scale(1); opacity: 1; }
        }
      `}</style>
    </div>
  );
}
