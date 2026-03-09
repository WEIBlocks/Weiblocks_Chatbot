import ChatWidget from '@/components/ChatWidget';

export const metadata = {
  title: 'Weiblocks Chat Widget',
};

export default function WidgetPage() {
  return (
    <div style={{ background: 'transparent', pointerEvents: 'none' }}>
      <ChatWidget />
    </div>
  );
}
