import ChatWidget from '@/components/ChatWidget';

export default function Home() {
  return (
    <main style={{
      minHeight: '100vh',
      background: '#0a0a14',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    }}>
      <a
        href="https://weiblocks.io"
        target="_blank"
        rel="noopener noreferrer"
        style={{
          padding: '14px 32px',
          background: 'linear-gradient(135deg, #F5A450, #B76D28)',
          borderRadius: '12px',
          color: '#fff',
          fontWeight: 700,
          fontSize: '16px',
          textDecoration: 'none',
          fontFamily: 'DM Sans, Roboto, sans-serif',
          boxShadow: '0 8px 24px rgba(245,164,80,0.3)',
        }}
      >
        Visit Weiblocks →
      </a>
      <ChatWidget />
    </main>
  );
}
