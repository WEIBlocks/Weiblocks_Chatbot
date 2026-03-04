'use client';

import { useState } from 'react';
import { Sparkles, X, Lock, Zap, Star } from 'lucide-react';

interface LeadFormProps {
  sessionId: string;
  projectType?: string;
  onClose: () => void;
  onSuccess: () => void;
  widgetUrl?: string;
}

export default function LeadForm({ sessionId, projectType, onClose, onSuccess, widgetUrl }: LeadFormProps) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    if (!name.trim() || !email.trim() || !subject.trim()) { setError('Name, email, and subject are required.'); return; }

    setLoading(true);
    try {
      const res = await fetch(`${widgetUrl || ''}/api/leads`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId, name: name.trim(), email: email.trim(),
          phone: phone.trim() || undefined,
          projectType: projectType || 'General',
          subject: subject.trim(),
          message: message.trim() || undefined,
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

  const inp: React.CSSProperties = {
    width: '100%', padding: '11px 14px',
    background: 'rgba(255,255,255,0.05)',
    border: '1px solid rgba(245,164,80,0.2)',
    borderRadius: '12px', color: '#fff', fontSize: '13.5px',
    outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit',
    transition: 'border-color 0.2s, background 0.2s',
  };

  const ta: React.CSSProperties = {
    ...inp, borderRadius: '12px', resize: 'none',
    height: '76px', paddingTop: '10px', lineHeight: '1.5',
  };

  return (
    <div style={{
      margin: '4px 0 12px',
      background: 'rgba(255,255,255,0.03)',
      border: '1px solid rgba(245,164,80,0.2)',
      borderRadius: '20px',
      padding: '18px 16px',
      animation: 'wb-formIn 0.35s cubic-bezier(0.16,1,0.3,1)',
      boxShadow: '0 8px 32px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.06)',
      backdropFilter: 'blur(20px)',
    }}>
      <style>{`
        @keyframes wb-formIn {
          from { opacity:0; transform:translateY(12px) scale(0.97); }
          to   { opacity:1; transform:translateY(0) scale(1); }
        }
        .wb-finput:focus { border-color: rgba(245,164,80,0.5) !important; background: rgba(255,255,255,0.08) !important; }
      `}</style>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
        <div>
          <div style={{
            display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px',
          }}>
            <div style={{
              width: '28px', height: '28px', borderRadius: '8px',
              background: 'linear-gradient(135deg, #F5A450, #BC403E)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Sparkles size={15} color="white" />
            </div>
            <span style={{ color: '#F5A450', fontWeight: 700, fontSize: '14px' }}>
              Let&apos;s Connect!
            </span>
          </div>
          <p style={{ margin: 0, color: 'rgba(255,255,255,0.4)', fontSize: '12px', lineHeight: 1.4 }}>
            Share your details and our team will reach out within 24 hours
          </p>
        </div>
        <button onClick={onClose} style={{
          background: 'none', border: 'none',
          color: 'rgba(255,255,255,0.3)', cursor: 'pointer',
          padding: '2px', lineHeight: 1, marginLeft: '8px', flexShrink: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }} aria-label="Close"><X size={16} /></button>
      </div>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '9px' }}>
        <input
          className="wb-finput" type="text"
          placeholder="Your Name *" value={name}
          onChange={e => setName(e.target.value)}
          style={inp} required disabled={loading}
        />
        <input
          className="wb-finput" type="email"
          placeholder="Email Address *" value={email}
          onChange={e => setEmail(e.target.value)}
          style={inp} required disabled={loading}
        />
        <input
          className="wb-finput" type="tel"
          placeholder="Phone (optional)" value={phone}
          onChange={e => setPhone(e.target.value)}
          style={inp} disabled={loading}
        />
        <input
          className="wb-finput" type="text"
          placeholder="Subject *" value={subject}
          onChange={e => setSubject(e.target.value)}
          style={inp} required disabled={loading}
        />
        <textarea
          className="wb-finput"
          placeholder="Message (optional)" value={message}
          onChange={e => setMessage(e.target.value)}
          style={ta} disabled={loading}
        />

        {error && (
          <div style={{
            padding: '9px 12px',
            background: 'rgba(188,64,62,0.12)',
            border: '1px solid rgba(188,64,62,0.3)',
            borderRadius: '10px',
            color: '#f87171', fontSize: '12px',
          }}>{error}</div>
        )}

        <button type="submit" disabled={loading} style={{
          padding: '12px',
          background: loading
            ? 'rgba(245,164,80,0.3)'
            : 'linear-gradient(135deg, #F5A450 0%, #c96e1a 100%)',
          border: 'none', borderRadius: '12px', color: '#fff',
          fontSize: '13.5px', fontWeight: 700,
          cursor: loading ? 'not-allowed' : 'pointer',
          marginTop: '3px',
          transition: 'all 0.2s',
          fontFamily: 'inherit',
          boxShadow: loading ? 'none' : '0 4px 16px rgba(245,164,80,0.4)',
          letterSpacing: '0.2px',
        }}>
          {loading ? (
            <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
              <span style={{
                width: '14px', height: '14px', borderRadius: '50%',
                border: '2px solid rgba(255,255,255,0.3)',
                borderTopColor: '#fff',
                animation: 'wb-spin 0.7s linear infinite',
                display: 'inline-block',
              }} />
              Submitting...
            </span>
          ) : 'Get In Touch →'}
          <style>{`@keyframes wb-spin { to { transform: rotate(360deg); } }`}</style>
        </button>
      </form>

      {/* Trust badges */}
      <div style={{
        marginTop: '12px',
        display: 'flex', justifyContent: 'center', gap: '16px',
        color: 'rgba(255,255,255,0.2)', fontSize: '10.5px',
      }}>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
          <Lock size={11} /> Secure
        </span>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
          <Zap size={11} /> Fast Response
        </span>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
          <Star size={11} /> Free Consultation
        </span>
      </div>
    </div>
  );
}
