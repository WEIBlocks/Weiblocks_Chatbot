import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const widgetOrigin = `${requestUrl.protocol}//${requestUrl.host}`;

  const script = `
(function() {
  'use strict';

  if (window.__WeiblocksChatLoaded) return;
  window.__WeiblocksChatLoaded = true;

  var WIDGET_URL = '${widgetOrigin}';

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

    // Track whether the chat window is open
    var chatOpen = false;

    // When chat opens  → full iframe accepts events (chat window needs interaction)
    // When chat closes → iframe is pointer-events:none so host page is never blocked.
    //   Exception: the FAB zone (bottom-right 100×100px) is re-enabled on mousemove
    //   so the user can always click the FAB to reopen the chat.
    window.addEventListener('message', function(e) {
      if (e.origin !== WIDGET_URL) return;
      if (e.data === 'wb:open') {
        chatOpen = true;
        iframe.style.pointerEvents = 'all';
      } else if (e.data === 'wb:close') {
        chatOpen = false;
        iframe.style.pointerEvents = 'none';
      }
    });

    // Mousemove: enable pointer-events on the iframe only while the cursor
    // is hovering the FAB zone (bottom-right 100×100px) and the chat is closed.
    document.addEventListener('mousemove', function(ev) {
      if (chatOpen) return; // chat open → already 'all', do nothing
      var fromRight  = window.innerWidth  - ev.clientX;
      var fromBottom = window.innerHeight - ev.clientY;
      iframe.style.pointerEvents = (fromRight <= 100 && fromBottom <= 100) ? 'all' : 'none';
    });

    // Touch: same logic for mobile tap on the FAB
    document.addEventListener('touchstart', function(ev) {
      if (chatOpen) return;
      var t = ev.touches[0];
      var fromRight  = window.innerWidth  - t.clientX;
      var fromBottom = window.innerHeight - t.clientY;
      iframe.style.pointerEvents = (fromRight <= 100 && fromBottom <= 100) ? 'all' : 'none';
    }, { passive: true });
  }

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
