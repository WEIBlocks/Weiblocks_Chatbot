'use client';

import { useState, useEffect } from 'react';
import { MessageCircle, X } from 'lucide-react';
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
  const [showTooltip, setShowTooltip] = useState(false);

  useEffect(() => {
    setMounted(true);
    setSessionId(getOrCreateSessionId());
    const t1 = setTimeout(() => setShowTooltip(true), 3000);
    const t2 = setTimeout(() => setShowTooltip(false), 8000);
    // Tell host: closed on load
    try { window.parent.postMessage('wb:close', '*'); } catch {}
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);


  function postState(open: boolean) {
    try { window.parent.postMessage(open ? 'wb:open' : 'wb:close', '*'); } catch {}
  }

  function toggleChat() {
    const next = !isOpen;
    setIsOpen(next);
    setHasNotification(false);
    setShowTooltip(false);
    postState(next);
  }

  if (!mounted) return null;

  return (
    <>
      <style>{`
        .wb-root * { box-sizing: border-box; }
        .wb-root { pointer-events: none; }
        .wb-root .wb-fab, .wb-root .wb-window, .wb-root .wb-tip { pointer-events: all; }

        @keyframes wb-slideUp {
          from { opacity: 0; transform: translateY(24px) scale(0.95); }
          to   { opacity: 1; transform: translateY(0)   scale(1); }
        }
        @keyframes wb-pulse-ring {
          0%   { transform: scale(1);   opacity: 0.7; }
          100% { transform: scale(1.8); opacity: 0; }
        }
        @keyframes wb-bounce-in {
          0%   { transform: scale(0.3); opacity: 0; }
          60%  { transform: scale(1.15); opacity: 1; }
          100% { transform: scale(1); }
        }
        @keyframes wb-float {
          0%,100% { transform: translateY(0px); }
          50%      { transform: translateY(-4px); }
        }
        @keyframes wb-shimmer {
          0%   { background-position: -200% center; }
          100% { background-position: 200% center; }
        }

        .wb-fab {
          position: fixed;
          bottom: 24px;
          right: 24px;
          width: 52px;
          height: 52px;
          border-radius: 50%;
          border: none;
          cursor: pointer;
          z-index: 2147483647;
          display: flex;
          align-items: center;
          justify-content: center;
          background: linear-gradient(135deg, #F5A450 0%, #e0883a 40%, #C84B35 100%);
          box-shadow: 0 6px 28px rgba(245,164,80,0.55), 0 2px 8px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.2);
          transition: transform 0.3s cubic-bezier(0.34,1.56,0.64,1), box-shadow 0.3s;
          animation: wb-float 4s ease-in-out infinite;
          overflow: visible;
        }
        .wb-fab:hover {
          transform: scale(1.12) translateY(-3px);
          box-shadow: 0 14px 40px rgba(245,164,80,0.7), 0 4px 16px rgba(0,0,0,0.4);
          animation: none;
        }
        .wb-fab:active { transform: scale(0.94); }

        .wb-ring {
          position: absolute;
          inset: 0;
          border-radius: 50%;
          border: 2px solid rgba(245,164,80,0.55);
          animation: wb-pulse-ring 2.2s ease-out infinite;
          pointer-events: none;
        }
        .wb-ring-2 { animation-delay: 0.7s; }

        .wb-badge {
          position: absolute;
          top: -3px; right: -3px;
          width: 20px; height: 20px;
          border-radius: 50%;
          background: linear-gradient(135deg, #ff5252, #c62828);
          border: 2.5px solid #fff;
          font-size: 10px; font-weight: 800;
          color: #fff;
          display: flex; align-items: center; justify-content: center;
          animation: wb-bounce-in 0.5s cubic-bezier(0.34,1.56,0.64,1) both;
          box-shadow: 0 2px 10px rgba(255,82,82,0.6);
        }

        .wb-tip {
          position: fixed;
          bottom: 104px; right: 24px;
          background: rgba(8,8,18,0.96);
          backdrop-filter: blur(24px);
          border: 1px solid rgba(245,164,80,0.25);
          border-radius: 18px;
          padding: 12px 18px;
          color: #fff;
          font-size: 13.5px;
          font-weight: 500;
          white-space: nowrap;
          z-index: 2147483646;
          box-shadow: 0 8px 32px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.04);
          animation: wb-slideUp 0.35s ease;
          pointer-events: none;
          font-family: 'DM Sans', sans-serif;
        }
        .wb-tip::after {
          content: '';
          position: absolute;
          bottom: -6px; right: 28px;
          width: 11px; height: 11px;
          background: rgba(8,8,18,0.96);
          border-right: 1px solid rgba(245,164,80,0.25);
          border-bottom: 1px solid rgba(245,164,80,0.25);
          transform: rotate(45deg);
        }

        .wb-window {
          position: fixed;
          bottom: 104px; right: 24px;
          width: 400px;
          height: min(610px, calc(100dvh - 120px));
          max-height: calc(100dvh - 120px);
          z-index: 2147483646;
          animation: wb-slideUp 0.32s cubic-bezier(0.16,1,0.3,1);
          border-radius: 28px;
          overflow: hidden;
          box-shadow:
            0 40px 100px rgba(0,0,0,0.75),
            0 0 0 1px rgba(255,255,255,0.07),
            inset 0 1px 0 rgba(255,255,255,0.08);
        }

        /* Short screens — shift window closer to fab */
        @media (max-height: 700px) {
          .wb-window { bottom: 88px; height: calc(100dvh - 104px); }
          .wb-tip    { bottom: 88px; }
        }
        @media (max-height: 500px) {
          .wb-window { bottom: 80px; height: calc(100dvh - 96px); border-radius: 20px; }
          .wb-tip    { display: none; }
        }

        /* Narrow screens — full screen, hide FAB when open */
        @media (max-width: 460px) {
          .wb-window { bottom:0;right:0;left:0;width:100%;height:100dvh;max-height:100dvh;border-radius:0; }
          .wb-fab    { bottom:16px;right:16px; }
          .wb-tip    { bottom:96px;right:16px; }
          .wb-fab.wb-open { display: none; }
        }

        /* Narrow + short (e.g. small phones landscape) */
        @media (max-width: 460px) and (max-height: 500px) {
          .wb-window { height: 100dvh; border-radius: 0; }
          .wb-fab    { bottom: 12px; right: 12px; width: 44px; height: 44px; }
        }
      `}</style>

      <div className="wb-root">
        {showTooltip && !isOpen && (
          <div className="wb-tip">
            <span style={{ color: '#F5A450', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
              <MessageCircle size={14} style={{ verticalAlign: 'middle' }} />
              Hi there!{' '}
            </span>
            Got questions? I&apos;m here to help!
          </div>
        )}

        {isOpen && (
          <div className="wb-window">
            <ChatWindow onClose={() => { setIsOpen(false); postState(false); }} sessionId={sessionId} widgetUrl={widgetUrl} />
          </div>
        )}

        <button className={`wb-fab${isOpen ? ' wb-open' : ''}`} onClick={toggleChat} aria-label={isOpen ? 'Close' : 'Open Weiblocks AI'}>
          {!isOpen && <><span className="wb-ring" /><span className="wb-ring wb-ring-2" /></>}
          {hasNotification && !isOpen && <span className="wb-badge">1</span>}
          {isOpen
            ? <X size={17} color="white" strokeWidth={2.5} />
            : <img src="/weiblocks.png" alt="Weiblocks" style={{ width: '34px', height: '34px', objectFit: 'cover', borderRadius: '50%' }} />
          }
        </button>
      </div>
    </>
  );
}
