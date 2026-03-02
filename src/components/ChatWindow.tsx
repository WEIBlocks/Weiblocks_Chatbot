'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import MessageBubble from './MessageBubble';
import TypingIndicator from './TypingIndicator';
import LeadForm from './LeadForm';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface ChatWindowProps {
  onClose: () => void;
  sessionId: string;
  widgetUrl?: string;
}

const WELCOME_MESSAGE: Message = {
  role: 'assistant',
  content: "Hi! I'm Weiblocks' AI assistant — your guide to blockchain & AI development.\n\nI can help you explore our services, discuss your project idea, or connect you with our team. What are you building?",
  timestamp: new Date(),
};

const QUICK_REPLIES = [
  { label: '🤖 AI Development', msg: 'Tell me about your AI development services' },
  { label: '⛓️ Blockchain', msg: 'What blockchain solutions do you offer?' },
  { label: '💎 DeFi & NFTs', msg: 'Do you build DeFi platforms and NFT marketplaces?' },
  { label: '👥 Hire Devs', msg: 'I want to hire blockchain developers' },
];

const CSS = `
  .wb-cw {
    display: flex; flex-direction: column; height: 100%; min-height: 0;
    font-family: 'DM Sans', -apple-system, BlinkMacSystemFont, sans-serif;
    background: #07070f;
    overflow: hidden;
  }

  /* ─── Header ─── */
  .wb-hdr {
    background: linear-gradient(160deg, #0e0e22 0%, #121228 100%);
    padding: 15px 16px;
    display: flex; align-items: center; gap: 11px;
    border-bottom: 1px solid rgba(245,164,80,0.1);
    position: relative; flex-shrink: 0;
  }
  .wb-hdr::after {
    content: ''; position: absolute;
    bottom: 0; left: 0; right: 0; height: 1px;
    background: linear-gradient(90deg, transparent, rgba(245,164,80,0.3), transparent);
  }
  .wb-av {
    width: 44px; height: 44px; border-radius: 14px;
    flex-shrink: 0; overflow: hidden;
    box-shadow: 0 4px 16px rgba(245,164,80,0.4);
    position: relative;
  }
  .wb-av-dot {
    position: absolute; bottom: -2px; right: -2px;
    width: 13px; height: 13px; border-radius: 50%;
    background: #22c55e; border: 2.5px solid #07070f;
    box-shadow: 0 0 8px rgba(34,197,94,0.8);
    animation: wb-blink 2.5s ease-in-out infinite;
  }
  @keyframes wb-blink { 0%,100%{opacity:1} 50%{opacity:0.45} }

  .wb-hinfo { flex: 1; min-width: 0; }
  .wb-hname { color: #fff; font-weight: 700; font-size: 14.5px; letter-spacing: -0.2px; }
  .wb-hstat {
    color: rgba(255,255,255,0.38); font-size: 11px;
    margin-top: 2px; display: flex; align-items: center; gap: 5px;
  }
  .wb-hsdot {
    width: 6px; height: 6px; border-radius: 50%;
    background: #22c55e; box-shadow: 0 0 5px #22c55e;
  }

  .wb-hbook {
    padding: 7px 13px;
    background: rgba(245,164,80,0.1);
    border: 1px solid rgba(245,164,80,0.25);
    border-radius: 11px;
    color: #F5A450; font-size: 11.5px; font-weight: 700;
    text-decoration: none; white-space: nowrap; flex-shrink: 0;
    transition: all 0.18s; font-family: inherit; cursor: pointer;
    display: flex; align-items: center; gap: 4px;
  }
  .wb-hbook:hover { background: rgba(245,164,80,0.18); border-color: rgba(245,164,80,0.45); }

  .wb-hclose {
    width: 30px; height: 30px; border-radius: 9px;
    background: rgba(255,255,255,0.04);
    border: 1px solid rgba(255,255,255,0.06);
    color: rgba(255,255,255,0.32); cursor: pointer;
    display: flex; align-items: center; justify-content: center;
    flex-shrink: 0; transition: all 0.18s;
  }
  .wb-hclose:hover { background: rgba(255,255,255,0.1); color: #fff; }

  /* ─── Messages ─── */
  .wb-msgs {
    flex: 1; overflow-y: auto; min-height: 0;
    padding: 18px 13px 10px;
    scrollbar-width: thin;
    scrollbar-color: rgba(245,164,80,0.15) transparent;
    background:
      radial-gradient(ellipse at 15% 85%, rgba(245,164,80,0.035) 0%, transparent 60%),
      radial-gradient(ellipse at 85% 15%, rgba(188,64,62,0.04) 0%, transparent 60%),
      #07070f;
  }
  .wb-msgs::-webkit-scrollbar { width: 3px; }
  .wb-msgs::-webkit-scrollbar-thumb { background: rgba(245,164,80,0.18); border-radius: 2px; }

  .wb-datesep {
    text-align: center; color: rgba(255,255,255,0.16);
    font-size: 10px; margin: 0 0 18px; font-weight: 500;
    display: flex; align-items: center; gap: 8px;
    text-transform: uppercase; letter-spacing: 0.6px;
  }
  .wb-datesep::before, .wb-datesep::after {
    content: ''; flex: 1; height: 1px;
    background: linear-gradient(90deg, transparent, rgba(255,255,255,0.07), transparent);
  }

  /* ─── Quick replies ─── */
  .wb-qzone {
    padding: 8px 13px 10px;
    display: flex; gap: 6px; flex-wrap: wrap;
    border-top: 1px solid rgba(255,255,255,0.04);
    background: rgba(0,0,0,0.32); flex-shrink: 0;
  }
  .wb-qbtn {
    padding: 6px 12px;
    background: rgba(245,164,80,0.06);
    border: 1px solid rgba(245,164,80,0.18);
    border-radius: 100px;
    color: rgba(245,164,80,0.82);
    font-size: 11.5px; font-weight: 600;
    cursor: pointer; transition: all 0.18s;
    font-family: inherit; white-space: nowrap;
  }
  .wb-qbtn:hover {
    background: rgba(245,164,80,0.14);
    border-color: rgba(245,164,80,0.42);
    color: #F5A450; transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(245,164,80,0.12);
  }

  /* ─── Input ─── */
  .wb-izone {
    padding: 11px 13px 13px;
    display: flex; gap: 9px; align-items: center;
    border-top: 1px solid rgba(255,255,255,0.04);
    background: rgba(0,0,0,0.42); flex-shrink: 0;
  }
  .wb-inp {
    flex: 1; padding: 11px 17px;
    background: rgba(255,255,255,0.05);
    border: 1px solid rgba(245,164,80,0.14);
    border-radius: 100px; color: #fff;
    font-size: 13.5px; outline: none; font-family: inherit;
    transition: border-color 0.2s, background 0.2s;
    caret-color: #F5A450;
  }
  .wb-inp::placeholder { color: rgba(255,255,255,0.2); }
  .wb-inp:focus { border-color: rgba(245,164,80,0.38); background: rgba(255,255,255,0.07); }
  .wb-inp:disabled { opacity: 0.6; }

  .wb-sbtn {
    width: 44px; height: 44px; border-radius: 50%; border: none;
    background: linear-gradient(135deg, #F5A450, #c06010);
    display: flex; align-items: center; justify-content: center;
    flex-shrink: 0; cursor: pointer; transition: all 0.2s;
    box-shadow: 0 4px 16px rgba(245,164,80,0.45);
  }
  .wb-sbtn:hover:not(:disabled) { transform: scale(1.09); box-shadow: 0 6px 22px rgba(245,164,80,0.6); }
  .wb-sbtn:active:not(:disabled) { transform: scale(0.93); }
  .wb-sbtn:disabled { background: rgba(255,255,255,0.07); box-shadow: none; cursor: not-allowed; }

  /* ─── Footer ─── */
  .wb-foot {
    text-align: center; padding: 5px 0 9px;
    font-size: 10px; color: rgba(255,255,255,0.15);
    background: rgba(0,0,0,0.42); flex-shrink: 0; letter-spacing: 0.2px;
  }
  .wb-foot a { color: rgba(245,164,80,0.4); text-decoration: none; }
  .wb-foot a:hover { color: #F5A450; }

  /* ─── Short screen compacting ─── */
  @media (max-height: 600px) {
    .wb-hdr  { padding: 10px 14px; }
    .wb-av   { width: 36px; height: 36px; border-radius: 11px; }
    .wb-hname { font-size: 13.5px; }
    .wb-izone { padding: 8px 11px 10px; }
    .wb-inp   { padding: 9px 15px; font-size: 13px; }
    .wb-sbtn  { width: 38px; height: 38px; }
    .wb-msgs  { padding: 12px 11px 8px; }
    .wb-foot  { padding: 3px 0 6px; }
    .wb-qzone { padding: 6px 11px 8px; }
  }
  @media (max-height: 450px) {
    .wb-hdr  { padding: 8px 12px; }
    .wb-av   { width: 32px; height: 32px; border-radius: 9px; }
    .wb-hbook { display: none; }
    .wb-foot  { display: none; }
    .wb-msgs  { padding: 8px 10px 6px; }
  }
`;

export default function ChatWindow({ onClose, sessionId, widgetUrl }: ChatWindowProps) {
  const [messages, setMessages] = useState<Message[]>([WELCOME_MESSAGE]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showLeadForm, setShowLeadForm] = useState(false);
  const [leadSubmitted, setLeadSubmitted] = useState(false);
  const [currentProjectType, setCurrentProjectType] = useState('General');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const apiBase = widgetUrl || '';

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => { scrollToBottom(); }, [messages, isLoading, showLeadForm, scrollToBottom]);
  useEffect(() => { setTimeout(() => inputRef.current?.focus(), 120); }, []);

  async function sendMessage(text?: string) {
    const msg = (text || input).trim();
    if (!msg || isLoading) return;
    setInput('');
    setIsLoading(true);
    setMessages(prev => [...prev, { role: 'user', content: msg, timestamp: new Date() }]);

    try {
      const res = await fetch(`${apiBase}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: msg, sessionId,
          history: messages.slice(-10).map(m => ({ role: m.role, content: m.content })),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setMessages(prev => [...prev, { role: 'assistant', content: data.reply, timestamp: new Date() }]);

      if (data.intent?.isLead && !showLeadForm && !leadSubmitted) {
        setCurrentProjectType(data.intent.projectType || 'General');
        setTimeout(() => setShowLeadForm(true), 900);
      }
    } catch {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: "I'm having trouble connecting. Please reach out directly:\n\n- Email: hi@weiblocks.io\n- Phone: +1 302-366-3496",
        timestamp: new Date(),
      }]);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <>
      <style>{CSS}</style>
      <div className="wb-cw">

        {/* Header */}
        <div className="wb-hdr">
          <div className="wb-av">
            <img src="/weiblocks.png" alt="Weiblocks" style={{ width: '44px', height: '44px', objectFit: 'cover', display: 'block' }} />
          </div>
          <div className="wb-hinfo">
            <div className="wb-hname">Weiblocks AI</div>
            <div className="wb-hstat">
              <span className="wb-hsdot" />
              Online · Replies instantly
            </div>
          </div>
          <a href="https://weiblocks.io/contact" target="_blank" rel="noopener noreferrer" className="wb-hbook">
            📅 Book Call
          </a>
          <button className="wb-hclose" onClick={onClose} aria-label="Close chat">
            <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
              <path d="M9 1L1 9M1 1l8 8" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
            </svg>
          </button>
        </div>

        {/* Messages */}
        <div className="wb-msgs">
          <div className="wb-datesep">Today</div>

          {messages.map((msg, idx) => (
            <MessageBubble key={idx} message={msg} />
          ))}

          {isLoading && <TypingIndicator />}

          {showLeadForm && !leadSubmitted && (
            <LeadForm
              sessionId={sessionId}
              projectType={currentProjectType}
              widgetUrl={apiBase}
              onClose={() => setShowLeadForm(false)}
              onSuccess={() => {
                setLeadSubmitted(true);
                setShowLeadForm(false);
                setMessages(prev => [...prev, {
                  role: 'assistant',
                  content: "**Perfect!** We've received your details.\n\nOur team will reach out within 24 hours. In the meantime:\n\n- Browse our work at **weiblocks.io**\n- Call us at **+1 302-366-3496**\n- Email **hi@weiblocks.io**",
                  timestamp: new Date(),
                }]);
              }}
            />
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Quick Replies */}
        {messages.length <= 1 && (
          <div className="wb-qzone">
            {QUICK_REPLIES.map(r => (
              <button key={r.label} className="wb-qbtn" onClick={() => sendMessage(r.msg)}>
                {r.label}
              </button>
            ))}
          </div>
        )}

        {/* Input */}
        <div className="wb-izone">
          <input
            ref={inputRef}
            className="wb-inp"
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }}}
            placeholder="Ask me anything..."
            disabled={isLoading}
          />
          <button
            className="wb-sbtn"
            onClick={() => sendMessage()}
            disabled={isLoading || !input.trim()}
            aria-label="Send message"
          >
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none">
              <path d="M22 2L11 13M22 2L15 22l-4-9-9-4 20-7z" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        </div>

        {/* Footer */}
        <div className="wb-foot">
          Powered by <a href="https://weiblocks.io" target="_blank" rel="noopener noreferrer">Weiblocks</a>
        </div>
      </div>
    </>
  );
}
