'use client';

import { useState } from 'react';

interface LeadFormProps {
  sessionId: string;
  projectType?: string;
  onClose: () => void;
  onSuccess: () => void;
  widgetUrl?: string;
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '10px 14px',
  background: 'rgba(255,255,255,0.06)',
  border: '1px solid rgba(245,164,80,0.3)',
  borderRadius: '10px',
  color: '#fff',
  fontSize: '14px',
  outline: 'none',
  boxSizing: 'border-box',
  transition: 'border-color 0.2s',
  fontFamily: 'inherit',
};

export default function LeadForm({ sessionId, projectType, onClose, onSuccess, widgetUrl }: LeadFormProps) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const apiBase = widgetUrl || '';

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    if (!name.trim() || !email.trim()) {
      setError('Name and email are required.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${apiBase}/api/leads`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          name: name.trim(),
          email: email.trim(),
          phone: phone.trim() || undefined,
          projectType: projectType || 'General',
          message: `Interested in ${projectType || 'Weiblocks services'}`,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to submit');

      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{
      background: 'linear-gradient(135deg, #12121f 0%, #1a1a2e 100%)',
      border: '1px solid rgba(245,164,80,0.3)',
      borderRadius: '16px',
      padding: '20px',
      margin: '8px 8px 0',
      boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
      animation: 'wb-slideUp 0.3s ease',
    }}>
      <style>{`
        @keyframes wb-slideUp {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
        <div>
          <h3 style={{ margin: 0, color: '#F5A450', fontSize: '15px', fontWeight: 700 }}>
            Let&apos;s Connect!
          </h3>
          <p style={{ margin: '4px 0 0', color: 'rgba(255,255,255,0.55)', fontSize: '12px' }}>
            Share your details and we&apos;ll reach out shortly
          </p>
        </div>
        <button
          onClick={onClose}
          style={{
            background: 'none',
            border: 'none',
            color: 'rgba(255,255,255,0.4)',
            cursor: 'pointer',
            fontSize: '18px',
            padding: '4px',
            lineHeight: 1,
          }}
          aria-label="Close form"
        >✕</button>
      </div>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <input
          type="text"
          placeholder="Your Name *"
          value={name}
          onChange={e => setName(e.target.value)}
          style={inputStyle}
          required
          disabled={loading}
        />
        <input
          type="email"
          placeholder="Email Address *"
          value={email}
          onChange={e => setEmail(e.target.value)}
          style={inputStyle}
          required
          disabled={loading}
        />
        <input
          type="tel"
          placeholder="Phone (optional)"
          value={phone}
          onChange={e => setPhone(e.target.value)}
          style={inputStyle}
          disabled={loading}
        />

        {error && (
          <p style={{ color: '#BC403E', fontSize: '12px', margin: 0 }}>{error}</p>
        )}

        <button
          type="submit"
          disabled={loading}
          style={{
            padding: '11px',
            background: loading ? 'rgba(245,164,80,0.4)' : 'linear-gradient(135deg, #F5A450, #B76D28)',
            border: 'none',
            borderRadius: '10px',
            color: '#fff',
            fontSize: '14px',
            fontWeight: 700,
            cursor: loading ? 'not-allowed' : 'pointer',
            marginTop: '4px',
            transition: 'all 0.2s',
            fontFamily: 'inherit',
          }}
        >
          {loading ? 'Submitting...' : 'Get In Touch →'}
        </button>
      </form>
    </div>
  );
}
