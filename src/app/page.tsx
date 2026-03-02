import ChatWidget from '@/components/ChatWidget';

export default function Home() {
  return (
    <main style={{
      minHeight: '100vh',
      background: 'linear-gradient(180deg, #0a0a14 0%, #12121f 100%)',
      color: '#fff',
      fontFamily: 'DM Sans, Roboto, sans-serif',
    }}>
      {/* Navbar */}
      <nav style={{
        borderBottom: '1px solid rgba(245,164,80,0.15)',
        padding: '16px 40px',
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        background: 'rgba(0,0,0,0.3)',
        backdropFilter: 'blur(10px)',
        position: 'sticky',
        top: 0,
        zIndex: 100,
      }}>
        <div style={{
          width: '36px',
          height: '36px',
          borderRadius: '10px',
          background: 'linear-gradient(135deg, #F5A450, #BC403E)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontWeight: 900,
          fontSize: '16px',
        }}>W</div>
        <span style={{ fontWeight: 700, fontSize: '18px' }}>Weiblocks</span>
        <div style={{ flex: 1 }} />
        <a href="https://weiblocks.io" target="_blank" rel="noopener noreferrer"
          style={{ color: '#F5A450', fontSize: '14px', textDecoration: 'none' }}>
          Visit Website →
        </a>
      </nav>

      {/* Hero */}
      <section style={{ textAlign: 'center', padding: '80px 40px 60px' }}>
        <div style={{
          display: 'inline-block',
          padding: '6px 16px',
          background: 'rgba(245,164,80,0.1)',
          border: '1px solid rgba(245,164,80,0.3)',
          borderRadius: '20px',
          fontSize: '12px',
          color: '#F5A450',
          fontWeight: 600,
          marginBottom: '20px',
          letterSpacing: '0.5px',
        }}>
          AI CHATBOT WIDGET — DEMO
        </div>
        <h1 style={{
          fontSize: 'clamp(2rem, 5vw, 3.5rem)',
          fontWeight: 900,
          lineHeight: 1.15,
          marginBottom: '20px',
          background: 'linear-gradient(135deg, #fff 30%, #F5A450)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
        }}>
          Build With Confidence.<br />Ship With Security.
        </h1>
        <p style={{
          fontSize: '18px',
          color: 'rgba(255,255,255,0.6)',
          maxWidth: '600px',
          margin: '0 auto 40px',
          lineHeight: 1.6,
        }}>
          Weiblocks is a premier blockchain and AI development agency.
          Try the AI assistant by clicking the chat button in the bottom-right corner.
        </p>

        <a href="https://weiblocks.io/contact" target="_blank" rel="noopener noreferrer"
          style={{
            display: 'inline-block',
            padding: '14px 32px',
            background: 'linear-gradient(135deg, #F5A450, #B76D28)',
            borderRadius: '12px',
            color: '#fff',
            fontWeight: 700,
            fontSize: '16px',
            textDecoration: 'none',
            boxShadow: '0 8px 24px rgba(245,164,80,0.3)',
          }}>
          Book a Free Consultation
        </a>
      </section>

      {/* Services Grid */}
      <section style={{ padding: '40px', maxWidth: '1100px', margin: '0 auto' }}>
        <h2 style={{ textAlign: 'center', marginBottom: '40px', fontSize: '28px', fontWeight: 700 }}>
          Our Services
        </h2>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
          gap: '20px',
        }}>
          {[
            { icon: '🤖', title: 'AI Agent Development', desc: 'Autonomous agents, workflow automation, intelligent systems' },
            { icon: '⛓️', title: 'Blockchain Solutions', desc: 'DeFi, NFTs, multi-chain deployment, Web3 platforms' },
            { icon: '📜', title: 'Smart Contracts', desc: 'Audited contracts on Ethereum, Solana, Tron, EVM chains' },
            { icon: '💼', title: 'Staff Augmentation', desc: 'Pre-vetted developer teams that integrate seamlessly' },
            { icon: '🪙', title: 'Token Development', desc: 'ERC-20, BEP-20, SPL tokens with tokenomics design' },
            { icon: '🌍', title: 'RWA Tokenization', desc: 'Real-world asset tokenization platforms' },
          ].map((s) => (
            <div key={s.title} style={{
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(245,164,80,0.15)',
              borderRadius: '16px',
              padding: '24px',
            }}>
              <div style={{ fontSize: '28px', marginBottom: '12px' }}>{s.icon}</div>
              <h3 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '8px', color: '#F5A450' }}>{s.title}</h3>
              <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.55)', lineHeight: 1.5 }}>{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Test scenarios */}
      <section style={{
        padding: '40px',
        maxWidth: '800px',
        margin: '0 auto 80px',
        background: 'rgba(245,164,80,0.05)',
        border: '1px solid rgba(245,164,80,0.15)',
        borderRadius: '20px',
      }}>
        <h2 style={{ fontSize: '20px', fontWeight: 700, marginBottom: '16px', color: '#F5A450' }}>
          Test the AI Assistant
        </h2>
        <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.6)', marginBottom: '20px' }}>
          Click the orange chat button (bottom-right) and try these scenarios:
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {[
            { num: '1', msg: 'Hi, what does Weiblocks do?', tag: 'Greeting' },
            { num: '2', msg: 'Do you build DeFi platforms?', tag: 'Service Inquiry' },
            { num: '3', msg: 'How much does it cost to build a blockchain app?', tag: 'Pricing Lead' },
            { num: '4', msg: 'I want to build an NFT marketplace', tag: 'Project Discussion' },
            { num: '5', msg: 'Can I schedule a demo or consultation?', tag: 'Contact Capture' },
            { num: '6', msg: 'I need to hire blockchain developers', tag: 'Staff Aug' },
            { num: '7', msg: 'What is the weather today?', tag: 'Off-topic' },
          ].map((t) => (
            <div key={t.num} style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '10px 14px',
              background: 'rgba(0,0,0,0.2)',
              borderRadius: '10px',
            }}>
              <span style={{
                width: '24px', height: '24px',
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #F5A450, #B76D28)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '12px', fontWeight: 700,
                flexShrink: 0,
              }}>{t.num}</span>
              <span style={{ fontSize: '13px', color: 'rgba(255,255,255,0.8)', flex: 1 }}>{t.msg}</span>
              <span style={{
                fontSize: '11px',
                padding: '3px 8px',
                background: 'rgba(245,164,80,0.15)',
                border: '1px solid rgba(245,164,80,0.3)',
                borderRadius: '8px',
                color: '#F5A450',
                whiteSpace: 'nowrap',
              }}>{t.tag}</span>
            </div>
          ))}
        </div>

        <div style={{
          marginTop: '20px',
          padding: '14px',
          background: 'rgba(0,0,0,0.3)',
          borderRadius: '10px',
          fontSize: '13px',
          color: 'rgba(255,255,255,0.5)',
        }}>
          <strong style={{ color: '#F5A450' }}>WordPress embed:</strong>{' '}
          <code style={{ color: '#4ade80', fontSize: '12px' }}>
            {'<script src="https://your-domain.com/api/widget.js" async></script>'}
          </code>
        </div>
      </section>

      {/* The actual chat widget */}
      <ChatWidget />
    </main>
  );
}
