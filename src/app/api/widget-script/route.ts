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

  // FAB size + position (must match ChatWidget.tsx CSS)
  var FAB_SIZE   = 52;
  var FAB_BOTTOM = 24;
  var FAB_RIGHT  = 24;

  // Chat window size (must match ChatWidget.tsx .wb-window CSS)
  var WIN_WIDTH  = 400;
  var WIN_HEIGHT = 610;
  var WIN_BOTTOM = 104;
  var WIN_RIGHT  = 24;

  function fabRect() {
    // iframe covers just the FAB circle
    return {
      width:  FAB_SIZE + 4,
      height: FAB_SIZE + 4,
      bottom: FAB_BOTTOM - 2,
      right:  FAB_RIGHT  - 2,
    };
  }

  function chatRect() {
    // iframe covers FAB + chat window combined so both are reachable
    var ww = Math.min(WIN_WIDTH, window.innerWidth);
    var wh = Math.min(WIN_HEIGHT, window.innerHeight - 120);
    var totalHeight = wh + WIN_BOTTOM + FAB_SIZE + 8;
    var totalWidth  = Math.max(ww, FAB_SIZE + FAB_RIGHT) + WIN_RIGHT;
    return {
      width:  totalWidth,
      height: totalHeight,
      bottom: FAB_BOTTOM - 2,
      right:  WIN_RIGHT  - 2,
    };
  }

  function applyRect(iframe, r) {
    // Overwrite the full cssText each time so no stale top/left/inset values survive
    iframe.style.cssText = [
      'position:fixed',
      'top:auto',
      'left:auto',
      'bottom:' + r.bottom + 'px',
      'right:'  + r.right  + 'px',
      'width:'  + r.width  + 'px',
      'height:' + r.height + 'px',
      'border:none',
      'background:transparent',
      'z-index:2147483646',
      'pointer-events:all',
      'overflow:hidden'
    ].join(';');
  }

  function injectWidget() {
    if (document.getElementById('weiblocks-chat-frame')) return;

    var iframe = document.createElement('iframe');
    iframe.id = 'weiblocks-chat-frame';
    iframe.src = WIDGET_URL + '/widget';

    // Start sized to just the FAB (bottom-right), fully clickable.
    applyRect(iframe, fabRect());

    iframe.setAttribute('title', 'Weiblocks AI Assistant');
    iframe.setAttribute('allow', 'microphone');
    document.body.appendChild(iframe);

    var chatOpen = false;

    function resize() {
      if (chatOpen) {
        applyRect(iframe, chatRect());
      } else {
        applyRect(iframe, fabRect());
      }
    }

    window.addEventListener('message', function(e) {
      if (e.origin !== WIDGET_URL) return;
      if (e.data === 'wb:open') {
        chatOpen = true;
        resize();
      } else if (e.data === 'wb:close') {
        chatOpen = false;
        resize();
      }
    });

    // Re-calculate on resize (handles mobile/responsive changes)
    window.addEventListener('resize', resize);
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
      'Cache-Control': 'no-cache',
      'Access-Control-Allow-Origin': '*',
    },
  });
}
