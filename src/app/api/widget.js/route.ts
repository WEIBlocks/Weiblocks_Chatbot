import { NextResponse } from 'next/server';

export async function GET() {
  const widgetUrl = process.env.NEXT_PUBLIC_WIDGET_URL || 'http://localhost:3000';

  const script = `
(function() {
  'use strict';

  // Guard against double-loading
  if (window.__WeiblocksChatLoaded) return;
  window.__WeiblocksChatLoaded = true;

  var WIDGET_URL = '${widgetUrl}';

  // Create isolated container
  function createContainer() {
    var existing = document.getElementById('weiblocks-chat-root');
    if (existing) return existing;

    var container = document.createElement('div');
    container.id = 'weiblocks-chat-root';
    container.style.cssText = [
      'position: fixed',
      'bottom: 0',
      'right: 0',
      'z-index: 2147483647',
      'pointer-events: none',
      'font-family: DM Sans, Roboto, sans-serif'
    ].join('; ');
    document.body.appendChild(container);
    return container;
  }

  // Inject widget iframe for maximum isolation
  function injectWidget() {
    var container = createContainer();

    var iframe = document.createElement('iframe');
    iframe.id = 'weiblocks-chat-frame';
    iframe.src = WIDGET_URL + '/widget';
    iframe.style.cssText = [
      'position: fixed',
      'bottom: 0',
      'right: 0',
      'width: 420px',
      'height: 650px',
      'border: none',
      'background: transparent',
      'z-index: 2147483647',
      'pointer-events: all',
      'border-radius: 16px',
      'transition: all 0.3s ease'
    ].join('; ');
    iframe.setAttribute('title', 'Weiblocks AI Assistant');
    iframe.setAttribute('loading', 'lazy');
    iframe.setAttribute('allow', 'microphone');

    container.style.pointerEvents = 'all';
    container.appendChild(iframe);
  }

  // Wait for DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', injectWidget);
  } else {
    injectWidget();
  }
})();
`;

  return new NextResponse(script, {
    headers: {
      'Content-Type': 'application/javascript',
      'Cache-Control': 'public, max-age=3600',
      'Access-Control-Allow-Origin': '*',
    },
  });
}
