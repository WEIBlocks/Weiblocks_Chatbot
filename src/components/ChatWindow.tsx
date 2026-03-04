'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Bot, Blocks, Layers, Users, CalendarDays, X, Send, Mail } from 'lucide-react';
import MessageBubble from './MessageBubble';
import TypingIndicator from './TypingIndicator';
import LeadForm from './LeadForm';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

// localStorage keys & memory config
const STORAGE_HISTORY_KEY = 'weiblocks_chat_history';
const STORAGE_LEAD_KEY    = 'weiblocks_lead_submitted';
const STORAGE_EMAIL_KEY   = 'weiblocks_user_email';
const MAX_MESSAGES = 20; // trigger trim above this
const TRIM_TO      = 15; // keep last N messages after trim

function loadHistory(welcomeMsg: Message): Message[] {
  if (typeof window === 'undefined') return [welcomeMsg];
  try {
    const raw = localStorage.getItem(STORAGE_HISTORY_KEY);
    if (!raw) return [welcomeMsg];
    const parsed = JSON.parse(raw) as Array<{ role: string; content: string; timestamp: string }>;
    if (!Array.isArray(parsed) || parsed.length === 0) return [welcomeMsg];
    return parsed.map(m => ({ ...m, timestamp: new Date(m.timestamp) })) as Message[];
  } catch {
    return [welcomeMsg];
  }
}

function loadLeadSubmitted(): boolean {
  if (typeof window === 'undefined') return false;
  return localStorage.getItem(STORAGE_LEAD_KEY) === 'true';
}

function loadSavedEmail(): string {
  if (typeof window === 'undefined') return '';
  return localStorage.getItem(STORAGE_EMAIL_KEY) || '';
}

interface ChatWindowProps {
  onClose: () => void;
  sessionId: string;
  widgetUrl?: string;
}

const WELCOME_MESSAGE: Message = {
  role: 'assistant',
  content: "Hi! I'm Nova — Weiblocks' AI agent, your guide to blockchain & AI development.\n\nI can help you explore our services, discuss your project idea, or connect you with our team. What are you building?",
  timestamp: new Date(),
};

const QUICK_REPLIES = [
  { label: 'AI Development', icon: <Bot size={14} style={{ flexShrink: 0 }} />, msg: 'Tell me about your AI development services' },
  { label: 'Blockchain', icon: <Blocks size={14} style={{ flexShrink: 0 }} />, msg: 'What blockchain solutions do you offer?' },
  { label: 'DeFi & NFTs', icon: <Layers size={14} style={{ flexShrink: 0 }} />, msg: 'Do you build DeFi platforms and NFT marketplaces?' },
  { label: 'Hire Devs', icon: <Users size={14} style={{ flexShrink: 0 }} />, msg: 'I want to hire blockchain developers' },
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
    display: inline-flex; align-items: center; gap: 5px;
  }
  .wb-qbtn:hover {
    background: rgba(245,164,80,0.14);
    border-color: rgba(245,164,80,0.42);
    color: #F5A450; transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(245,164,80,0.12);
  }

  /* ─── Inline email capture ─── */
  .wb-ec {
    margin: 4px 0 10px;
    background: rgba(245,164,80,0.06);
    border: 1px solid rgba(245,164,80,0.22);
    border-radius: 16px;
    padding: 13px 14px;
    animation: wb-formIn 0.3s cubic-bezier(0.16,1,0.3,1);
  }
  @keyframes wb-formIn {
    from { opacity:0; transform:translateY(8px); }
    to   { opacity:1; transform:translateY(0); }
  }
  .wb-ec-label {
    color: rgba(255,255,255,0.45); font-size: 11.5px;
    margin-bottom: 8px; display: flex; align-items: center; gap: 5px;
  }
  .wb-ec-row {
    display: flex; gap: 7px; align-items: center;
  }
  .wb-ec-inp {
    flex: 1; padding: 9px 14px;
    background: rgba(255,255,255,0.05);
    border: 1px solid rgba(245,164,80,0.2);
    border-radius: 100px; color: #fff;
    font-size: 13px; outline: none; font-family: inherit;
    transition: border-color 0.2s, background 0.2s;
    caret-color: #F5A450;
  }
  .wb-ec-inp::placeholder { color: rgba(255,255,255,0.22); }
  .wb-ec-inp:focus { border-color: rgba(245,164,80,0.42); background: rgba(255,255,255,0.07); }
  .wb-ec-btn {
    padding: 9px 16px;
    background: linear-gradient(135deg, #F5A450, #c06010);
    border: none; border-radius: 100px;
    color: #fff; font-size: 12.5px; font-weight: 700;
    cursor: pointer; white-space: nowrap; font-family: inherit;
    transition: all 0.2s;
    box-shadow: 0 3px 12px rgba(245,164,80,0.35);
    flex-shrink: 0;
  }
  .wb-ec-btn:hover { transform: scale(1.04); box-shadow: 0 5px 18px rgba(245,164,80,0.5); }
  .wb-ec-btn:disabled { opacity: 0.45; cursor: not-allowed; transform: none; }
  .wb-ec-skip {
    background: none; border: none;
    color: rgba(255,255,255,0.2); font-size: 10.5px;
    cursor: pointer; margin-top: 6px; text-align: center;
    width: 100%; font-family: inherit; padding: 2px 0;
    transition: color 0.2s;
  }
  .wb-ec-skip:hover { color: rgba(255,255,255,0.4); }

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
  const [messages, setMessages] = useState<Message[]>(() => loadHistory(WELCOME_MESSAGE));
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showLeadForm, setShowLeadForm] = useState(false);
  const [leadSubmitted, setLeadSubmitted] = useState<boolean>(() => loadLeadSubmitted());
  const [currentProjectType, setCurrentProjectType] = useState('General');

  // Email state (collected naturally within conversation, no gate)
  const [userEmail, setUserEmail] = useState<string>(() => loadSavedEmail());
  const [showEmailCapture, setShowEmailCapture] = useState(false);
  const [emailCaptureInput, setEmailCaptureInput] = useState('');
  const emailCaptureRef = useRef<HTMLInputElement>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const sessionEndSentRef = useRef(false);
  const apiBase = widgetUrl || '';

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => { scrollToBottom(); }, [messages, isLoading, showLeadForm, scrollToBottom]);
  useEffect(() => {
    setTimeout(() => inputRef.current?.focus(), 120);
  }, []);

  // Persist chat history to localStorage; trim when too long
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const toSave = messages.length > MAX_MESSAGES
      ? messages.slice(messages.length - TRIM_TO)
      : messages;
    localStorage.setItem(STORAGE_HISTORY_KEY, JSON.stringify(toSave));
  }, [messages]);

  // Persist lead-submitted flag
  useEffect(() => {
    if (typeof window === 'undefined') return;
    localStorage.setItem(STORAGE_LEAD_KEY, String(leadSubmitted));
  }, [leadSubmitted]);

  // Persist email
  useEffect(() => {
    if (typeof window === 'undefined' || !userEmail) return;
    localStorage.setItem(STORAGE_EMAIL_KEY, userEmail);
  }, [userEmail]);

  // Send session end on page unload (beforeunload)
  useEffect(() => {
    function handleUnload() {
      if (sessionEndSentRef.current) return;
      if (messages.length < 2) return; // no real conversation
      sessionEndSentRef.current = true;

      const payload = JSON.stringify({ sessionId, email: userEmail || undefined });
      const url = `${apiBase}/api/chat/end`;

      // Use sendBeacon for reliable fire-and-forget on page close
      if (navigator.sendBeacon) {
        const blob = new Blob([payload], { type: 'application/json' });
        navigator.sendBeacon(url, blob);
      } else {
        fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: payload,
          keepalive: true,
        }).catch(() => {});
      }
    }

    window.addEventListener('beforeunload', handleUnload);
    return () => window.removeEventListener('beforeunload', handleUnload);
  }, [sessionId, userEmail, messages.length, apiBase]);

  // Handle chat close — send session end
  function handleClose() {
    if (!sessionEndSentRef.current && messages.length >= 2) {
      sessionEndSentRef.current = true;
      fetch(`${apiBase}/api/chat/end`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId, email: userEmail || undefined }),
        keepalive: true,
      }).catch(() => {});
    }
    onClose();
  }

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
          hasEmail: !!userEmail,
          messageCount: messages.filter(m => m.role === 'user').length + 1,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setMessages(prev => [...prev, { role: 'assistant', content: data.reply, timestamp: new Date() }]);

      // If server detected an email in the user's message, save it
      if (data.detectedEmail && !userEmail) {
        setUserEmail(data.detectedEmail);
        setShowEmailCapture(false);
      }

      // Show inline email input if AI just asked for email
      if (data.askedForEmail && !userEmail) {
        setTimeout(() => {
          setShowEmailCapture(true);
          setTimeout(() => emailCaptureRef.current?.focus(), 80);
        }, 600);
      }

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

  function handleEmailCapture() {
    const email = emailCaptureInput.trim();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailRegex.test(email)) return;
    setUserEmail(email);
    setShowEmailCapture(false);
    setEmailCaptureInput('');
    // Send email as a chat message — AI will acknowledge warmly
    sendMessage(email);
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
            <div className="wb-hname">Nova — Weiblocks AI</div>
            <div className="wb-hstat">
              <span className="wb-hsdot" />
              Online · Replies instantly
            </div>
          </div>
          <a href="https://weiblocks.io/contact" target="_blank" rel="noopener noreferrer" className="wb-hbook">
            <CalendarDays size={13} style={{ flexShrink: 0 }} />
            Book Call
          </a>
          <button className="wb-hclose" onClick={handleClose} aria-label="Close chat">
            <X size={14} />
          </button>
        </div>

        {/* Messages */}
        <div className="wb-msgs">
          <div className="wb-datesep">{(() => {
            const ts = messages[0]?.timestamp;
            if (!ts) return 'Today';
            const d = new Date(ts);
            return d.toDateString() === new Date().toDateString()
              ? 'Today'
              : d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
          })()}</div>

          {messages.map((msg, idx) => (
            <MessageBubble key={idx} message={msg} />
          ))}

          {isLoading && <TypingIndicator />}

          {showLeadForm && !leadSubmitted && (
            <LeadForm
              sessionId={sessionId}
              projectType={currentProjectType}
              widgetUrl={apiBase}
              prefillEmail={userEmail}
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
          {/* Inline email capture — shown after Nova asks for email */}
          {showEmailCapture && !userEmail && (
            <div className="wb-ec">
              <div className="wb-ec-label">
                <Mail size={12} style={{ flexShrink: 0 }} />
                Your email address
              </div>
              <div className="wb-ec-row">
                <input
                  ref={emailCaptureRef}
                  className="wb-ec-inp"
                  type="email"
                  placeholder="you@example.com"
                  value={emailCaptureInput}
                  onChange={e => setEmailCaptureInput(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleEmailCapture(); }}}
                />
                <button
                  className="wb-ec-btn"
                  onClick={handleEmailCapture}
                  disabled={!emailCaptureInput.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailCaptureInput.trim())}
                >
                  Submit
                </button>
              </div>
              <button className="wb-ec-skip" onClick={() => setShowEmailCapture(false)}>
                Skip
              </button>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Quick Replies — only show before first user message */}
        {messages.length <= 1 && (
          <div className="wb-qzone">
            {QUICK_REPLIES.map(r => (
              <button key={r.label} className="wb-qbtn" onClick={() => sendMessage(r.msg)}>
                {r.icon} {r.label}
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
            <Send size={17} color="white" />
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
