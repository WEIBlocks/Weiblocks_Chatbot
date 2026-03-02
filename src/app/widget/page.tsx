import ChatWidget from '@/components/ChatWidget';

export const metadata = {
  title: 'Weiblocks Chat Widget',
};

export default function WidgetPage() {
  return (
    <div style={{ background: 'transparent', width: '100vw', height: '100vh', overflow: 'hidden' }}>
      <ChatWidget />
    </div>
  );
}
