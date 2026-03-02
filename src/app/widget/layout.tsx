export default function WidgetLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&display=swap" rel="stylesheet" />
        <style>{`
          *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
          html, body { background: transparent !important; overflow: hidden; }
        `}</style>
      </head>
      <body style={{ background: 'transparent', fontFamily: 'DM Sans, sans-serif' }}>
        {children}
      </body>
    </html>
  );
}
