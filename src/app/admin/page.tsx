'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';

/* ─── Types ─────────────────────────────────────────── */
interface Msg { role: 'user' | 'assistant'; content: string; timestamp: string; }
interface Conv {
  _id: string; sessionId: string; projectType: string; detectedEmail?: string;
  intentDetected: boolean; status: string; summary?: string;
  messageCount: number; lastMessage: string; lastActive: string; createdAt: string;
  messages: Msg[];
}
interface Lead {
  _id: string; name?: string; email: string; phone?: string; projectType: string;
  budget?: string; subject?: string; message?: string; chatSummary?: string;
  source: string; status: string; emailSent: boolean; createdAt: string;
}
type Tab = 'conversations' | 'leads';

/* ─── Helpers ────────────────────────────────────────── */
function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}
function fmtDate(d: string) {
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}
function fmtTime(d: string) {
  return new Date(d).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

/* ─── Markdown renderer (same logic as chatbot MessageBubble) ── */
const MD_LINK_RE = /\[([^\]]+)\]\((https?:\/\/[^)]+)\)/g;
const LINK_STYLE = 'color:#F5A450;text-decoration:underline;text-underline-offset:2px;';

function linkify(text: string): string {
  text = text.replace(
    /([a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,})/g,
    `<a href="mailto:$1" style="${LINK_STYLE}" target="_blank" rel="noopener noreferrer">$1</a>`
  );
  text = text.replace(
    /(?<!href=")(https?:\/\/[^\s<"']+)/g,
    `<a href="$1" style="${LINK_STYLE}" target="_blank" rel="noopener noreferrer">$1</a>`
  );
  text = text.replace(
    /(\+?[\d][\d\s\-().]{7,}[\d])/g,
    `<a href="tel:$1" style="${LINK_STYLE}">$1</a>`
  );
  return text;
}

function extractLinks(line: string): { cleaned: string; links: { text: string; url: string }[] } {
  const links: { text: string; url: string }[] = [];
  const cleaned = line.replace(MD_LINK_RE, (_m, text, url) => { links.push({ text, url }); return ''; })
    .replace(/→\s*$/, '').trimEnd();
  return { cleaned, links };
}

function MdLinkBtn({ text, url }: { text: string; url: string }) {
  return (
    <a href={url} target="_blank" rel="noopener noreferrer" style={{
      display: 'inline-flex', alignItems: 'center', gap: '5px',
      padding: '5px 11px', margin: '2px 2px 2px 0',
      background: 'rgba(245,164,80,0.1)', border: '1px solid rgba(245,164,80,0.35)',
      borderRadius: '100px', color: '#F5A450', fontSize: '11.5px', fontWeight: 600,
      textDecoration: 'none', whiteSpace: 'normal', maxWidth: '100%', lineHeight: 1.4,
    }}>
      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0 }}>
        <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6M15 3h6v6M10 14L21 3"
          stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
      {text}
    </a>
  );
}

function renderMd(content: string): React.ReactNode[] {
  const lines = content.split('\n');
  const collectedLinks: { text: string; url: string }[] = [];
  const elements: React.ReactNode[] = [];

  const toHtml = (text: string) => linkify(
    text
      .replace(/\*\*(.*?)\*\*/g, '<strong style="color:#F5A450;font-weight:700">$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
  );

  lines.forEach((line, i) => {
    const { cleaned, links } = extractLinks(line);
    const trimmed = cleaned.trim();
    const isBulletOnly = /^(\*|-|•)\s*$/.test(trimmed);
    const isNumOnly = /^\d+\.\s*$/.test(trimmed);

    if (links.length > 0 && (isBulletOnly || isNumOnly || !trimmed)) {
      elements.push(
        <div key={i} style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginTop: i > 0 ? '4px' : 0 }}>
          {links.map((l, j) => <MdLinkBtn key={j} text={l.text} url={l.url} />)}
        </div>
      );
      return;
    }
    if (links.length > 0) collectedLinks.push(...links);

    if (/^#{1,3}\s/.test(trimmed)) {
      elements.push(<p key={i} style={{ margin: '8px 0 3px', fontWeight: 700, color: '#F5A450', fontSize: '13px' }}
        dangerouslySetInnerHTML={{ __html: toHtml(trimmed.replace(/^#{1,3}\s+/, '')) }} />);
    } else if (/^(\*|-|•)\s/.test(trimmed)) {
      elements.push(
        <div key={i} style={{ display: 'flex', gap: '7px', marginTop: i > 0 ? '4px' : 0, alignItems: 'flex-start' }}>
          <span style={{ width: '4px', height: '4px', borderRadius: '50%', background: '#F5A450', flexShrink: 0, marginTop: '7px', boxShadow: '0 0 4px rgba(245,164,80,0.5)' }} />
          <span dangerouslySetInnerHTML={{ __html: toHtml(trimmed.replace(/^[*\-•]\s+/, '')) }} />
        </div>
      );
    } else if (/^\d+\.\s/.test(trimmed)) {
      const num = trimmed.match(/^(\d+)\./)?.[1] ?? '';
      elements.push(
        <div key={i} style={{ display: 'flex', gap: '7px', marginTop: i > 0 ? '4px' : 0, alignItems: 'flex-start' }}>
          <span style={{ minWidth: '17px', height: '17px', borderRadius: '50%', background: 'rgba(245,164,80,0.18)', color: '#F5A450', fontSize: '9px', fontWeight: 700, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: '2px' }}>{num}</span>
          <span dangerouslySetInnerHTML={{ __html: toHtml(trimmed.replace(/^\d+\.\s+/, '')) }} />
        </div>
      );
    } else if (trimmed === '') {
      elements.push(<div key={i} style={{ height: '5px' }} />);
    } else {
      elements.push(<p key={i} style={{ margin: '1px 0', lineHeight: 1.55 }} dangerouslySetInnerHTML={{ __html: toHtml(cleaned) }} />);
    }
  });

  if (collectedLinks.length > 0) {
    elements.push(
      <div key="links" style={{ display: 'flex', flexWrap: 'wrap', marginTop: '8px', gap: '4px' }}>
        {collectedLinks.map((l, j) => <MdLinkBtn key={j} text={l.text} url={l.url} />)}
      </div>
    );
  }
  return elements;
}

/* ─── ChatBubble with full markdown rendering ─── */
function ChatBubble({ msg }: { msg: Msg }) {
  const isUser = msg.role === 'user';
  return (
    <div style={{
      display: 'flex', flexDirection: isUser ? 'row-reverse' : 'row',
      gap: '8px', marginBottom: '14px', alignItems: 'flex-end',
    }}>
      {/* Avatar */}
      {isUser ? (
        <div style={{
          width: '28px', height: '28px', borderRadius: '9px', flexShrink: 0,
          background: 'linear-gradient(135deg,rgba(255,255,255,0.12),rgba(255,255,255,0.06))',
          border: '1px solid rgba(255,255,255,0.1)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="8" r="4" stroke="rgba(255,255,255,0.6)" strokeWidth="1.8"/>
            <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" stroke="rgba(255,255,255,0.6)" strokeWidth="1.8" strokeLinecap="round"/>
          </svg>
        </div>
      ) : (
        <img src="/weiblocks.png" alt="Wei" style={{ width: '28px', height: '28px', borderRadius: '9px', objectFit: 'cover', flexShrink: 0, boxShadow: '0 2px 8px rgba(245,164,80,0.25)' }} />
      )}

      <div style={{ maxWidth: '78%', minWidth: 0, display: 'flex', flexDirection: 'column', alignItems: isUser ? 'flex-end' : 'flex-start' }}>
        <div style={{
          padding: '10px 14px',
          borderRadius: isUser ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
          background: isUser
            ? 'linear-gradient(135deg,#F5A450 0%,#d4751c 100%)'
            : 'rgba(255,255,255,0.05)',
          border: isUser ? 'none' : '1px solid rgba(255,255,255,0.08)',
          color: '#fff', fontSize: '13px', lineHeight: 1.55, wordBreak: 'break-word',
          boxShadow: isUser
            ? '0 3px 14px rgba(245,164,80,0.28), inset 0 1px 0 rgba(255,255,255,0.15)'
            : '0 2px 10px rgba(0,0,0,0.25)',
        }}>
          {isUser
            ? <span style={{ whiteSpace: 'pre-wrap' }}>{msg.content}</span>
            : renderMd(msg.content)
          }
        </div>
        <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.2)', marginTop: '3px', paddingInline: '4px' }}>
          {fmtTime(msg.timestamp)}
        </span>
      </div>
    </div>
  );
}

/* ─── Badge ─── */
function Badge({ label, color }: { label: string; color: string }) {
  const bg: Record<string, string> = { green: 'rgba(34,197,94,0.15)', orange: 'rgba(245,164,80,0.15)', gray: 'rgba(255,255,255,0.08)', red: 'rgba(188,64,62,0.15)', blue: 'rgba(96,165,250,0.15)' };
  const fg: Record<string, string> = { green: '#22c55e', orange: '#F5A450', gray: 'rgba(255,255,255,0.4)', red: '#f87171', blue: '#60a5fa' };
  return <span style={{ display: 'inline-block', padding: '2px 8px', borderRadius: '100px', background: bg[color] || bg.gray, color: fg[color] || fg.gray, fontSize: '10.5px', fontWeight: 600, whiteSpace: 'nowrap' }}>{label}</span>;
}

/* ════════════════════════════════════════════════════════
   MAIN DASHBOARD
════════════════════════════════════════════════════════ */
export default function AdminDashboard() {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>('conversations');
  const [conversations, setConversations] = useState<Conv[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [selectedConv, setSelectedConv] = useState<Conv | null>(null);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [cr, lr] = await Promise.all([fetch('/api/admin/conversations'), fetch('/api/admin/leads')]);
      if (cr.status === 401 || lr.status === 401) { router.push('/admin/login'); return; }
      const cd = await cr.json();
      const ld = await lr.json();
      setConversations(cd.conversations || []);
      setLeads(ld.leads || []);
    } finally { setLoading(false); }
  }, [router]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  async function logout() {
    await fetch('/api/admin/login', { method: 'DELETE' });
    router.push('/admin/login');
  }

  async function updateLeadStatus(id: string, status: string) {
    await fetch('/api/admin/leads', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, status }) });
    setLeads(prev => prev.map(l => l._id === id ? { ...l, status } : l));
    if (selectedLead?._id === id) setSelectedLead(prev => prev ? { ...prev, status } : prev);
  }

  function selectConv(c: Conv) { setSelectedConv(c); setSelectedLead(null); setDetailOpen(true); setSidebarOpen(false); }
  function selectLead(l: Lead) { setSelectedLead(l); setSelectedConv(null); setDetailOpen(true); setSidebarOpen(false); }
  function closeDetail() { setDetailOpen(false); setSelectedConv(null); setSelectedLead(null); }

  const filteredConvs = conversations.filter(c => !search || c.detectedEmail?.includes(search) || c.projectType?.toLowerCase().includes(search.toLowerCase()) || c.sessionId.includes(search));
  const filteredLeads = leads.filter(l => !search || l.email?.includes(search) || l.name?.toLowerCase().includes(search.toLowerCase()) || l.projectType?.toLowerCase().includes(search.toLowerCase()));

  const stats = [
    { label: 'Total Chats', value: conversations.length, color: '#F5A450' },
    { label: 'Total Leads', value: leads.length, color: '#22c55e' },
    { label: 'New Leads', value: leads.filter(l => l.status === 'new').length, color: '#f87171' },
    { label: 'With Intent', value: conversations.filter(c => c.intentDetected).length, color: '#60a5fa' },
  ];

  /* ── Sidebar content (shared between desktop + mobile drawer) ── */
  const SidebarContent = () => (
    <>
      <div style={{ padding: '20px 16px 14px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ width: '36px', height: '36px', borderRadius: '10px', flexShrink: 0, background: 'linear-gradient(135deg,#F5A450,#BC403E)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <rect x="3" y="3" width="7" height="7" rx="1.5" fill="white" opacity="0.9"/>
              <rect x="14" y="3" width="7" height="7" rx="1.5" fill="white" opacity="0.6"/>
              <rect x="3" y="14" width="7" height="7" rx="1.5" fill="white" opacity="0.6"/>
              <rect x="14" y="14" width="7" height="7" rx="1.5" fill="white" opacity="0.9"/>
            </svg>
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: '14px' }}>Weiblocks</div>
            <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.3)' }}>Admin Dashboard</div>
          </div>
          <button onClick={() => setSidebarOpen(false)} style={{ marginLeft: 'auto', background: 'none', border: 'none', color: 'rgba(255,255,255,0.3)', cursor: 'pointer', fontSize: '20px', lineHeight: 1, display: 'none' }} className="wb-close-sidebar">×</button>
        </div>
      </div>

      {/* Stats */}
      <div style={{ padding: '12px 12px 0' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
          {stats.map(st => (
            <div key={st.label} style={{ padding: '10px 10px', background: 'rgba(255,255,255,0.03)', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.05)' }}>
              <div style={{ fontSize: '18px', fontWeight: 700, color: st.color }}>{st.value}</div>
              <div style={{ fontSize: '10.5px', color: 'rgba(255,255,255,0.35)', marginTop: '2px' }}>{st.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Nav */}
      <div style={{ padding: '12px 12px 0' }}>
        {(['conversations', 'leads'] as Tab[]).map(t => (
          <button key={t} onClick={() => { setTab(t); setSearch(''); setSidebarOpen(false); }} style={{
            width: '100%', padding: '10px 12px', marginBottom: '4px',
            background: tab === t ? 'rgba(245,164,80,0.12)' : 'transparent',
            border: tab === t ? '1px solid rgba(245,164,80,0.25)' : '1px solid transparent',
            borderRadius: '10px', color: tab === t ? '#F5A450' : 'rgba(255,255,255,0.45)',
            fontSize: '13px', fontWeight: tab === t ? 700 : 500,
            cursor: 'pointer', textAlign: 'left', fontFamily: 'inherit',
            display: 'flex', alignItems: 'center', gap: '8px', transition: 'all 0.15s',
          }}>
            <span>{t === 'conversations' ? '💬' : '🎯'}</span>
            {t === 'conversations' ? 'Conversations' : 'Leads'}
            <span style={{ marginLeft: 'auto', fontSize: '11px', fontWeight: 700, background: tab === t ? 'rgba(245,164,80,0.2)' : 'rgba(255,255,255,0.07)', color: tab === t ? '#F5A450' : 'rgba(255,255,255,0.3)', padding: '1px 7px', borderRadius: '100px' }}>
              {t === 'conversations' ? conversations.length : leads.length}
            </span>
          </button>
        ))}
      </div>

      <div style={{ flex: 1 }} />

      <div style={{ padding: '12px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
        <button onClick={logout} style={{
          width: '100%', padding: '10px', background: 'rgba(255,255,255,0.04)',
          border: '1px solid rgba(255,255,255,0.08)', borderRadius: '10px',
          color: 'rgba(255,255,255,0.4)', fontSize: '13px', cursor: 'pointer',
          fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'center',
        }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
          Sign Out
        </button>
      </div>
    </>
  );

  /* ── Detail Panel content ── */
  const DetailContent = () => {
    if (!selectedConv && !selectedLead) return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', flexDirection: 'column', gap: '12px' }}>
        <div style={{ fontSize: '36px', opacity: 0.4 }}>👈</div>
        <div style={{ color: 'rgba(255,255,255,0.2)', fontSize: '13px' }}>Select an item to view details</div>
      </div>
    );

    if (selectedConv) return (
      <>
        <div style={{ padding: '14px 16px', borderBottom: '1px solid rgba(255,255,255,0.06)', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            <h3 style={{ margin: 0, fontSize: '14px', fontWeight: 700, flex: 1 }}>Chat History</h3>
            <button onClick={closeDetail} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.3)', cursor: 'pointer', fontSize: '20px', lineHeight: 1 }}>×</button>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px', alignItems: 'center' }}>
            {selectedConv.detectedEmail && (
              <a href={`mailto:${selectedConv.detectedEmail}`} style={{ fontSize: '12px', color: '#F5A450', textDecoration: 'none', fontWeight: 600 }}>✉ {selectedConv.detectedEmail}</a>
            )}
            <Badge label={selectedConv.projectType} color="gray" />
            <Badge label={`${selectedConv.messageCount} msgs`} color="gray" />
            <Badge label={selectedConv.status} color={selectedConv.status === 'completed' ? 'green' : 'blue'} />
            {selectedConv.intentDetected && <Badge label="🎯 Lead" color="orange" />}
          </div>
          <div style={{ fontSize: '10.5px', color: 'rgba(255,255,255,0.2)', marginTop: '5px' }}>{fmtDate(selectedConv.createdAt)}</div>
        </div>

        {selectedConv.summary && (
          <div style={{ margin: '10px 12px 0', padding: '11px 13px', background: 'rgba(245,164,80,0.07)', border: '1px solid rgba(245,164,80,0.18)', borderRadius: '12px', flexShrink: 0 }}>
            <div style={{ fontSize: '10px', color: '#F5A450', fontWeight: 700, marginBottom: '5px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>AI Summary</div>
            <div style={{ fontSize: '12.5px', color: 'rgba(255,255,255,0.65)', lineHeight: 1.6 }}>{selectedConv.summary}</div>
          </div>
        )}

        <div style={{ flex: 1, overflowY: 'auto', padding: '12px' }}>
          {selectedConv.messages.length === 0
            ? <div style={{ color: 'rgba(255,255,255,0.2)', textAlign: 'center', fontSize: '13px', paddingTop: '40px' }}>No messages</div>
            : selectedConv.messages.map((m, i) => <ChatBubble key={i} msg={m} />)
          }
        </div>
      </>
    );

    if (selectedLead) return (
      <>
        <div style={{ padding: '14px 16px', borderBottom: '1px solid rgba(255,255,255,0.06)', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
            <h3 style={{ margin: 0, fontSize: '14px', fontWeight: 700, flex: 1 }}>Lead Details</h3>
            <button onClick={closeDetail} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.3)', cursor: 'pointer', fontSize: '20px', lineHeight: 1 }}>×</button>
          </div>
          <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap' }}>
            {(['new', 'contacted', 'closed'] as const).map(s => (
              <button key={s} onClick={() => updateLeadStatus(selectedLead._id, s)} style={{
                padding: '5px 12px', borderRadius: '100px', fontSize: '11.5px', fontWeight: 600,
                cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.15s',
                background: selectedLead.status === s ? (s === 'new' ? 'rgba(245,164,80,0.25)' : s === 'contacted' ? 'rgba(96,165,250,0.25)' : 'rgba(34,197,94,0.25)') : 'rgba(255,255,255,0.05)',
                border: selectedLead.status === s ? (s === 'new' ? '1px solid rgba(245,164,80,0.4)' : s === 'contacted' ? '1px solid rgba(96,165,250,0.4)' : '1px solid rgba(34,197,94,0.4)') : '1px solid rgba(255,255,255,0.08)',
                color: selectedLead.status === s ? (s === 'new' ? '#F5A450' : s === 'contacted' ? '#60a5fa' : '#22c55e') : 'rgba(255,255,255,0.3)',
              }}>{s.charAt(0).toUpperCase() + s.slice(1)}</button>
            ))}
          </div>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '12px' }}>
          <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '12px', padding: '12px', marginBottom: '10px' }}>
            <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.3)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '9px' }}>Contact Info</div>
            {[
              { label: 'Name', value: selectedLead.name },
              { label: 'Email', value: selectedLead.email, href: `mailto:${selectedLead.email}` },
              { label: 'Phone', value: selectedLead.phone, href: `tel:${selectedLead.phone}` },
              { label: 'Project', value: selectedLead.projectType },
              { label: 'Budget', value: selectedLead.budget },
              { label: 'Source', value: selectedLead.source },
              { label: 'Date', value: fmtDate(selectedLead.createdAt) },
            ].filter(r => r.value).map(row => (
              <div key={row.label} style={{ display: 'flex', gap: '10px', marginBottom: '7px', fontSize: '13px', flexWrap: 'wrap' }}>
                <span style={{ color: 'rgba(255,255,255,0.35)', width: '58px', flexShrink: 0 }}>{row.label}</span>
                {row.href
                  ? <a href={row.href} style={{ color: '#F5A450', textDecoration: 'none', fontWeight: 600 }}>{row.value}</a>
                  : <span style={{ color: '#e5e5e5', fontWeight: 500 }}>{row.value}</span>}
              </div>
            ))}
          </div>

          {selectedLead.subject && (
            <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '12px', padding: '12px', marginBottom: '10px' }}>
              <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.3)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '7px' }}>Subject</div>
              <div style={{ fontSize: '13px', color: '#e5e5e5', fontWeight: 600 }}>{selectedLead.subject}</div>
            </div>
          )}
          {selectedLead.message && (
            <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '12px', padding: '12px', marginBottom: '10px' }}>
              <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.3)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '7px' }}>Message</div>
              <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.7)', lineHeight: 1.6 }}>{selectedLead.message}</div>
            </div>
          )}
          {selectedLead.chatSummary && (
            <div style={{ background: 'rgba(245,164,80,0.07)', border: '1px solid rgba(245,164,80,0.18)', borderRadius: '12px', padding: '12px', marginBottom: '10px' }}>
              <div style={{ fontSize: '10px', color: '#F5A450', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '7px' }}>AI Chat Summary</div>
              <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.65)', lineHeight: 1.6 }}>{selectedLead.chatSummary}</div>
            </div>
          )}
        </div>
      </>
    );

    return null;
  };

  return (
    <>
      <style>{`
        * { box-sizing: border-box; }
        html, body { margin: 0; padding: 0; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(245,164,80,0.2); border-radius: 4px; }

        .wb-admin-page {
          display: flex; height: 100vh; background: #09090f;
          font-family: 'DM Sans', -apple-system, sans-serif; color: #fff; overflow: hidden;
        }

        /* Sidebar */
        .wb-sidebar {
          width: 240px; flex-shrink: 0; background: #0e0e1a;
          border-right: 1px solid rgba(255,255,255,0.06);
          display: flex; flex-direction: column; overflow: hidden;
          transition: transform 0.25s ease;
        }

        /* Main list */
        .wb-main { flex: 1; display: flex; flex-direction: column; overflow: hidden; min-width: 0; }

        /* Detail panel */
        .wb-detail {
          width: 400px; flex-shrink: 0; background: #0b0b17;
          border-left: 1px solid rgba(255,255,255,0.06);
          display: flex; flex-direction: column; overflow: hidden;
        }

        /* Mobile overlay backdrop */
        .wb-backdrop {
          display: none; position: fixed; inset: 0; background: rgba(0,0,0,0.6);
          z-index: 40; backdrop-filter: blur(2px);
        }

        /* ── Tablet (≤1024px): hide detail panel, show as overlay ── */
        @media (max-width: 1024px) {
          .wb-detail {
            position: fixed; top: 0; right: 0; bottom: 0; width: min(420px, 100vw);
            z-index: 50; transform: translateX(100%); transition: transform 0.25s ease;
            border-left: 1px solid rgba(255,255,255,0.1);
          }
          .wb-detail.open { transform: translateX(0); }
          .wb-backdrop.detail-open { display: block; }
        }

        /* ── Mobile (≤768px): sidebar also becomes overlay ── */
        @media (max-width: 768px) {
          .wb-sidebar {
            position: fixed; top: 0; left: 0; bottom: 0; width: 260px;
            z-index: 50; transform: translateX(-100%); transition: transform 0.25s ease;
          }
          .wb-sidebar.open { transform: translateX(0); }
          .wb-backdrop.sidebar-open { display: block; }
          .wb-mobile-topbar { display: flex !important; }
          .wb-topbar-desktop-title { display: none !important; }
        }

        /* Mobile topbar */
        .wb-mobile-topbar {
          display: none; align-items: center; gap: '10px';
          padding: 12px 14px; border-bottom: 1px solid rgba(255,255,255,0.06);
          background: #0e0e1a; flex-shrink: 0;
        }

        /* List item hover */
        .wb-list-item:hover {
          background: rgba(245,164,80,0.07) !important;
          border-color: rgba(245,164,80,0.15) !important;
        }

        /* Topbar search full-width on small screens */
        @media (max-width: 520px) {
          .wb-topbar { flex-wrap: wrap; }
          .wb-search { width: 100% !important; order: 3; }
        }
      `}</style>

      <div className="wb-admin-page">

        {/* ── Backdrop ── */}
        <div
          className={`wb-backdrop ${sidebarOpen ? 'sidebar-open' : ''} ${detailOpen && !sidebarOpen ? 'detail-open' : ''}`}
          onClick={() => { setSidebarOpen(false); if (detailOpen) closeDetail(); }}
        />

        {/* ── Sidebar ── */}
        <div className={`wb-sidebar ${sidebarOpen ? 'open' : ''}`}>
          <SidebarContent />
        </div>

        {/* ── Main ── */}
        <div className="wb-main">
          {/* Mobile topbar */}
          <div className="wb-mobile-topbar">
            <button onClick={() => setSidebarOpen(true)} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.6)', cursor: 'pointer', padding: '4px', display: 'flex', alignItems: 'center' }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
            </button>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1 }}>
              <div style={{ width: '26px', height: '26px', borderRadius: '7px', background: 'linear-gradient(135deg,#F5A450,#BC403E)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none"><rect x="3" y="3" width="7" height="7" rx="1.5" fill="white" opacity="0.9"/><rect x="14" y="3" width="7" height="7" rx="1.5" fill="white" opacity="0.6"/><rect x="3" y="14" width="7" height="7" rx="1.5" fill="white" opacity="0.6"/><rect x="14" y="14" width="7" height="7" rx="1.5" fill="white" opacity="0.9"/></svg>
              </div>
              <span style={{ fontWeight: 700, fontSize: '14px' }}>Weiblocks Admin</span>
            </div>
          </div>

          {/* Desktop topbar */}
          <div className="wb-topbar" style={{ padding: '14px 18px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0 }}>
            <h2 className="wb-topbar-desktop-title" style={{ margin: 0, fontSize: '15px', fontWeight: 700 }}>
              {tab === 'conversations' ? 'All Conversations' : 'All Leads'}
            </h2>
            <div style={{ flex: 1 }} />
            <input
              className="wb-search"
              placeholder={tab === 'conversations' ? 'Search email, project...' : 'Search name, email...'}
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{ padding: '8px 13px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.09)', borderRadius: '10px', color: '#fff', fontSize: '13px', outline: 'none', fontFamily: 'inherit', width: '200px' }}
            />
            <button onClick={fetchAll} style={{ padding: '8px 13px', background: 'rgba(245,164,80,0.1)', border: '1px solid rgba(245,164,80,0.2)', borderRadius: '10px', color: '#F5A450', fontSize: '12px', cursor: 'pointer', fontFamily: 'inherit', fontWeight: 600, whiteSpace: 'nowrap' }}>↻ Refresh</button>
          </div>

          {/* List */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '10px 14px' }}>
            {loading ? (
              <div style={{ textAlign: 'center', color: 'rgba(255,255,255,0.3)', paddingTop: '60px', fontSize: '14px' }}>Loading...</div>
            ) : tab === 'conversations' ? (
              filteredConvs.length === 0
                ? <div style={{ textAlign: 'center', color: 'rgba(255,255,255,0.25)', paddingTop: '60px' }}>No conversations found</div>
                : filteredConvs.map(c => (
                  <div key={c._id} className="wb-list-item" onClick={() => selectConv(c)} style={{
                    padding: '12px 14px', marginBottom: '7px', borderRadius: '13px', cursor: 'pointer',
                    background: selectedConv?._id === c._id ? 'rgba(245,164,80,0.1)' : 'rgba(255,255,255,0.03)',
                    border: `1px solid ${selectedConv?._id === c._id ? 'rgba(245,164,80,0.3)' : 'rgba(255,255,255,0.06)'}`,
                    transition: 'all 0.15s',
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '5px' }}>
                      <div style={{ width: '30px', height: '30px', borderRadius: '9px', flexShrink: 0, background: 'linear-gradient(135deg,rgba(245,164,80,0.25),rgba(188,64,62,0.25))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px' }}>💬</div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: 600, fontSize: '13px', color: '#fff', display: 'flex', alignItems: 'center', gap: '5px', flexWrap: 'wrap' }}>
                          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '160px' }}>
                            {c.detectedEmail || c.sessionId.slice(0, 14) + '…'}
                          </span>
                          {c.intentDetected && <Badge label="Lead" color="orange" />}
                          <Badge label={c.status} color={c.status === 'completed' ? 'green' : 'blue'} />
                        </div>
                        <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.3)', marginTop: '2px' }}>
                          {c.projectType} · {c.messageCount} msgs · {timeAgo(c.lastActive)}
                        </div>
                      </div>
                    </div>
                    {c.lastMessage && (
                      <div style={{ fontSize: '11.5px', color: 'rgba(255,255,255,0.28)', lineHeight: 1.4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', paddingLeft: '38px' }}>
                        {c.lastMessage}
                      </div>
                    )}
                  </div>
                ))
            ) : (
              filteredLeads.length === 0
                ? <div style={{ textAlign: 'center', color: 'rgba(255,255,255,0.25)', paddingTop: '60px' }}>No leads found</div>
                : filteredLeads.map(l => (
                  <div key={l._id} className="wb-list-item" onClick={() => selectLead(l)} style={{
                    padding: '12px 14px', marginBottom: '7px', borderRadius: '13px', cursor: 'pointer',
                    background: selectedLead?._id === l._id ? 'rgba(245,164,80,0.1)' : 'rgba(255,255,255,0.03)',
                    border: `1px solid ${selectedLead?._id === l._id ? 'rgba(245,164,80,0.3)' : 'rgba(255,255,255,0.06)'}`,
                    transition: 'all 0.15s',
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div style={{ width: '34px', height: '34px', borderRadius: '10px', flexShrink: 0, background: 'linear-gradient(135deg,rgba(34,197,94,0.18),rgba(245,164,80,0.18))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '15px' }}>🎯</div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: 600, fontSize: '13px', display: 'flex', alignItems: 'center', gap: '5px', flexWrap: 'wrap' }}>
                          <span>{l.name || 'Anonymous'}</span>
                          <Badge label={l.status} color={l.status === 'new' ? 'orange' : l.status === 'contacted' ? 'blue' : 'green'} />
                          {l.emailSent && <Badge label="✉ Sent" color="green" />}
                        </div>
                        <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.3)', marginTop: '2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {l.email} · {l.projectType} · {timeAgo(l.createdAt)}
                        </div>
                      </div>
                    </div>
                  </div>
                ))
            )}
          </div>
        </div>

        {/* ── Detail Panel ── */}
        <div className={`wb-detail ${detailOpen ? 'open' : ''}`}>
          <DetailContent />
        </div>

      </div>
    </>
  );
}
