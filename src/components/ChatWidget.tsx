'use client';

import { useState, useEffect } from 'react';
import ChatWindow from './ChatWindow';

interface ChatWidgetProps {
  widgetUrl?: string;
}

function generateSessionId(): string {
  return 'wb_' + Math.random().toString(36).substr(2, 9) + '_' + Date.now();
}

function getOrCreateSessionId(): string {
  if (typeof window === 'undefined') return generateSessionId();
  const stored = localStorage.getItem('weiblocks_session_id');
  if (stored) return stored;
  const newId = generateSessionId();
  localStorage.setItem('weiblocks_session_id', newId);
  return newId;
}

export default function ChatWidget({ widgetUrl }: ChatWidgetProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [sessionId, setSessionId] = useState('');
  const [hasNotification, setHasNotification] = useState(true);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    setSessionId(getOrCreateSessionId());
    // Show notification dot initially, hide after opening
  }, []);

  function toggleChat() {
    setIsOpen(prev => !prev);
    setHasNotification(false);
  }

  if (!mounted) return null;

  return (
    <>
      {/* Global CSS */}
      <style>{`
        * { box-sizing: border-box; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(245,164,80,0.4); border-radius: 2px; }
        @keyframes wb-fadeIn {
          from { opacity: 0; transform: scale(0.95) translateY(10px); }
          to { opacity: 1; transform: scale(1) translateY(0); }
        }
        @keyframes wb-pulse {
          0%, 100% { box-shadow: 0 0 0 0 rgba(245,164,80,0.4); }
          50% { box-shadow: 0 0 0 10px rgba(245,164,80,0); }
        }
      `}</style>

      {/* Chat Window */}
      {isOpen && (
        <div
          style={{
            position: 'fixed',
            bottom: '90px',
            right: '20px',
            width: '380px',
            height: '560px',
            zIndex: 2147483646,
            animation: 'wb-fadeIn 0.25s ease',
            borderRadius: '20px',
            overflow: 'hidden',
          }}
        >
          <ChatWindow
            onClose={() => setIsOpen(false)}
            sessionId={sessionId}
            widgetUrl={widgetUrl}
          />
        </div>
      )}

      {/* Floating Button */}
      <button
        onClick={toggleChat}
        aria-label={isOpen ? 'Close chat' : 'Open Weiblocks chat'}
        style={{
          position: 'fixed',
          bottom: '20px',
          right: '20px',
          width: '60px',
          height: '60px',
          borderRadius: '50%',
          background: isOpen
            ? 'linear-gradient(135deg, #B76D28, #8B4513)'
            : 'linear-gradient(135deg, #F5A450, #B76D28)',
          border: 'none',
          cursor: 'pointer',
          zIndex: 2147483647,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 8px 32px rgba(245,164,80,0.45), 0 4px 16px rgba(0,0,0,0.3)',
          transition: 'all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
          animation: !isOpen ? 'wb-pulse 2.5s infinite' : 'none',
          transform: isOpen ? 'rotate(0deg)' : 'rotate(0deg)',
        }}
      >
        {/* Notification dot */}
        {hasNotification && !isOpen && (
          <div style={{
            position: 'absolute',
            top: '2px',
            right: '2px',
            width: '14px',
            height: '14px',
            borderRadius: '50%',
            background: '#BC403E',
            border: '2px solid #fff',
            fontSize: '8px',
            color: '#fff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 700,
          }}>1</div>
        )}

        {/* Icon */}
        {isOpen ? (
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
            <path d="M18 6L6 18M6 6l12 12" stroke="white" strokeWidth="2.5" strokeLinecap="round"/>
          </svg>
        ) : (
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M8 10h8M8 14h5" stroke="white" strokeWidth="2" strokeLinecap="round"/>
          </svg>
        )}
      </button>
    </>
  );
}
