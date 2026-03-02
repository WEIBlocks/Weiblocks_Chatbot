import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  // Derive the widget origin from the request URL — works on any deployment automatically
  const requestUrl = new URL(request.url);
  const widgetOrigin = `${requestUrl.protocol}//${requestUrl.host}`;

  const script = `
(function() {
  'use strict';

  // Guard against double-loading
  if (window.__WeiblocksChatLoaded) return;
  window.__WeiblocksChatLoaded = true;

  // Auto-detect origin from the script tag src — always correct regardless of deployment
  var WIDGET_URL = '${widgetOrigin}';

  // Inject full-viewport transparent iframe so the widget can position itself freely
  function injectWidget() {
    if (document.getElementById('weiblocks-chat-frame')) return;

    var iframe = document.createElement('iframe');
    iframe.id = 'weiblocks-chat-frame';
    iframe.src = WIDGET_URL + '/widget';
    iframe.style.cssText = [
      'position: fixed',
      'inset: 0',
      'width: 100%',
      'height: 100%',
      'border: none',
      'background: transparent',
      'z-index: 2147483646',
      'pointer-events: none'
    ].join('; ');
    iframe.setAttribute('title', 'Weiblocks AI Assistant');
    iframe.setAttribute('allow', 'microphone');
    document.body.appendChild(iframe);
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
