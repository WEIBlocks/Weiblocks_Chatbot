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
  content: "👋 Hi there! I'm Weiblocks' AI assistant. I'm here to help you learn about our blockchain and AI development services.\n\nWhether you're looking to build a **DeFi platform**, **AI agent**, **smart contracts**, or need **staff augmentation** — I can help you explore the right solution.\n\nWhat can I help you with today?",
  timestamp: new Date(),
};

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

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading, showLeadForm, scrollToBottom]);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  async function sendMessage(text?: string) {
    const messageText = text || input.trim();
    if (!messageText || isLoading) return;

    const userMessage: Message = {
      role: 'user',
      content: messageText,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const res = await fetch(`${apiBase}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: messageText,
          sessionId,
          history: messages.slice(-8).map(m => ({ role: m.role, content: m.content })),
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to get response');

      const assistantMessage: Message = {
        role: 'assistant',
        content: data.reply,
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, assistantMessage]);

      // Show lead form if intent detected and not already shown
      if (data.intent?.isLead && !showLeadForm && !leadSubmitted) {
        setCurrentProjectType(data.intent.projectType || 'General');
        // Small delay to let user read the response first
        setTimeout(() => setShowLeadForm(true), 800);
      }
    } catch (err) {
      const errorMessage: Message = {
        role: 'assistant',
        content: "I'm having a bit of trouble right now. Please try again, or reach us directly at [email protected] or +1 302-366-3496.",
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
      console.error('Chat error:', err);
    } finally {
      setIsLoading(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  }

  const quickReplies = [
    '🤖 AI Services',
    '⛓️ Blockchain Dev',
    '💰 DeFi Platforms',
    '💼 Hire a Team',
  ];

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      background: 'linear-gradient(180deg, #0d0d1a 0%, #12121f 100%)',
      borderRadius: '20px',
      overflow: 'hidden',
      boxShadow: '0 24px 80px rgba(0,0,0,0.6), 0 0 0 1px rgba(245,164,80,0.2)',
      fontFamily: 'DM Sans, Roboto, -apple-system, sans-serif',
    }}>

      {/* Header */}
      <div style={{
        background: 'linear-gradient(135deg, #0d0d1a 0%, #1a1a2e 100%)',
        borderBottom: '1px solid rgba(245,164,80,0.2)',
        padding: '14px 16px',
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        flexShrink: 0,
      }}>
        {/* Logo/Avatar */}
        <div style={{
          width: '42px',
          height: '42px',
          borderRadius: '12px',
          background: 'linear-gradient(135deg, #F5A450, #BC403E)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontWeight: 900,
          fontSize: '18px',
          color: '#fff',
          flexShrink: 0,
          boxShadow: '0 4px 12px rgba(245,164,80,0.35)',
        }}>W</div>

        <div style={{ flex: 1 }}>
          <div style={{ color: '#fff', fontWeight: 700, fontSize: '15px', lineHeight: 1.2 }}>
            Weiblocks AI
          </div>
          <div style={{ color: '#4ade80', fontSize: '11px', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}>
            <span style={{
              width: '7px', height: '7px', borderRadius: '50%',
              background: '#4ade80',
              display: 'inline-block',
              boxShadow: '0 0 6px #4ade80',
            }}></span>
            Online · Typically replies instantly
          </div>
        </div>

        {/* Book a Call button */}
        <a
          href="https://weiblocks.io/contact"
          target="_blank"
          rel="noopener noreferrer"
          style={{
            padding: '7px 12px',
            background: 'linear-gradient(135deg, #F5A450, #B76D28)',
            borderRadius: '8px',
            color: '#fff',
            fontSize: '12px',
            fontWeight: 700,
            textDecoration: 'none',
            whiteSpace: 'nowrap',
            flexShrink: 0,
          }}
        >
          Book a Call
        </a>

        {/* Close */}
        <button
          onClick={onClose}
          style={{
            background: 'rgba(255,255,255,0.08)',
            border: 'none',
            borderRadius: '8px',
            color: 'rgba(255,255,255,0.6)',
            cursor: 'pointer',
            fontSize: '16px',
            width: '30px',
            height: '30px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
          aria-label="Close chat"
        >✕</button>
      </div>

      {/* Messages */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        padding: '16px 12px 8px',
        scrollbarWidth: 'thin',
        scrollbarColor: 'rgba(245,164,80,0.3) transparent',
      }}>
        {messages.map((msg, idx) => (
          <MessageBubble key={idx} message={msg} />
        ))}

        {isLoading && (
          <div style={{ padding: '0 4px' }}>
            <TypingIndicator />
          </div>
        )}

        {/* Lead Form */}
        {showLeadForm && !leadSubmitted && (
          <LeadForm
            sessionId={sessionId}
            projectType={currentProjectType}
            widgetUrl={apiBase}
            onClose={() => setShowLeadForm(false)}
            onSuccess={() => {
              setLeadSubmitted(true);
              setShowLeadForm(false);
              const thankYouMsg: Message = {
                role: 'assistant',
                content: "✅ **Thank you!** We've received your details and our team will reach out to you shortly.\n\nIn the meantime, feel free to browse our portfolio at **weiblocks.io** or call us directly at **+1 302-366-3496**.",
                timestamp: new Date(),
              };
              setMessages(prev => [...prev, thankYouMsg]);
            }}
          />
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Quick replies (shown only initially) */}
      {messages.length <= 1 && (
        <div style={{
          padding: '8px 12px',
          display: 'flex',
          gap: '6px',
          flexWrap: 'wrap',
          borderTop: '1px solid rgba(255,255,255,0.05)',
          flexShrink: 0,
        }}>
          {quickReplies.map((reply) => (
            <button
              key={reply}
              onClick={() => sendMessage(reply.replace(/^[^\s]+\s/, ''))}
              style={{
                padding: '6px 12px',
                background: 'rgba(245,164,80,0.1)',
                border: '1px solid rgba(245,164,80,0.3)',
                borderRadius: '20px',
                color: '#F5A450',
                fontSize: '12px',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.2s',
                fontFamily: 'inherit',
                whiteSpace: 'nowrap',
              }}
            >
              {reply}
            </button>
          ))}
        </div>
      )}

      {/* Input */}
      <div style={{
        padding: '12px',
        borderTop: '1px solid rgba(245,164,80,0.15)',
        display: 'flex',
        gap: '8px',
        alignItems: 'center',
        flexShrink: 0,
        background: 'rgba(0,0,0,0.2)',
      }}>
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask about our services..."
          disabled={isLoading}
          style={{
            flex: 1,
            padding: '11px 16px',
            background: 'rgba(255,255,255,0.06)',
            border: '1px solid rgba(245,164,80,0.25)',
            borderRadius: '24px',
            color: '#fff',
            fontSize: '14px',
            outline: 'none',
            fontFamily: 'inherit',
            transition: 'border-color 0.2s',
          }}
        />
        <button
          onClick={() => sendMessage()}
          disabled={isLoading || !input.trim()}
          aria-label="Send message"
          style={{
            width: '42px',
            height: '42px',
            borderRadius: '50%',
            background: input.trim() && !isLoading
              ? 'linear-gradient(135deg, #F5A450, #B76D28)'
              : 'rgba(245,164,80,0.2)',
            border: 'none',
            cursor: input.trim() && !isLoading ? 'pointer' : 'not-allowed',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            transition: 'all 0.2s',
            boxShadow: input.trim() && !isLoading ? '0 4px 12px rgba(245,164,80,0.35)' : 'none',
          }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
            <path d="M22 2L11 13" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M22 2L15 22L11 13L2 9L22 2Z" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
      </div>

      {/* Footer */}
      <div style={{
        textAlign: 'center',
        padding: '6px',
        fontSize: '10px',
        color: 'rgba(255,255,255,0.25)',
        flexShrink: 0,
      }}>
        Powered by <a href="https://weiblocks.io" target="_blank" rel="noopener noreferrer" style={{ color: '#F5A450', textDecoration: 'none' }}>Weiblocks</a>
      </div>
    </div>
  );
}
