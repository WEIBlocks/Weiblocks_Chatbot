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

  // FAB dimensions (matches .wb-fab in ChatWidget.tsx)
  var FAB_SIZE   = 56;
  var FAB_BOTTOM = 24;
  var FAB_RIGHT  = 24;

  // Chat window dimensions (matches .wb-window in ChatWidget.tsx)
  var WIN_W      = 400;
  var WIN_H      = 610;
  var WIN_BOTTOM = 24;
  var WIN_RIGHT  = 24;

  function getWinW()  { return Math.min(WIN_W,  window.innerWidth); }
  function getWinH()  { return Math.min(WIN_H,  window.innerHeight - WIN_BOTTOM - FAB_SIZE - 16); }

  function injectWidget() {
    if (document.getElementById('wb-iframe')) return;

    /*
     * Strategy: the iframe is ALWAYS sized to exactly the visible widget area.
     * - Closed: iframe = FAB size only (56x56px, bottom-right)
     * - Open:   iframe = chat window + FAB area (400x~660px, bottom-right)
     * The iframe never covers the rest of the host page, so the host UI is
     * always fully interactive. No pointer-events tricks needed.
     */

    var iframe = document.createElement('iframe');
    iframe.id = 'wb-iframe';
    iframe.src = WIDGET_URL + '/widget';
    iframe.setAttribute('title', 'Weiblocks AI Assistant');
    iframe.setAttribute('frameborder', '0');
    iframe.setAttribute('scrolling', 'no');
    iframe.setAttribute('allow', 'microphone');

    // Start as FAB size
    iframe.style.cssText = [
      'position:fixed',
      'bottom:' + FAB_BOTTOM + 'px',
      'right:' + FAB_RIGHT + 'px',
      'width:' + FAB_SIZE + 'px',
      'height:' + FAB_SIZE + 'px',
      'border:none',
      'background:transparent',
      'z-index:2147483644',
      'display:block',
      'overflow:hidden',
      'border-radius:50%',
      'transition:none'
    ].join(';');

    document.body.appendChild(iframe);

    // Listen for open/close messages from the widget inside the iframe
    window.addEventListener('message', function(e) {
      if (e.origin !== WIDGET_URL) return;

      if (e.data === 'wb:open') {
        // Expand iframe to cover the full chat window area
        var w = getWinW();
        var h = getWinH() + FAB_SIZE + WIN_BOTTOM + 16;
        iframe.style.width         = Math.min(w + FAB_RIGHT, window.innerWidth) + 'px';
        iframe.style.height        = Math.min(h + FAB_BOTTOM, window.innerHeight) + 'px';
        iframe.style.bottom        = '0';
        iframe.style.right         = '0';
        iframe.style.borderRadius  = '0';
      } else if (e.data === 'wb:close') {
        // Shrink back to FAB only
        iframe.style.width         = FAB_SIZE + 'px';
        iframe.style.height        = FAB_SIZE + 'px';
        iframe.style.bottom        = FAB_BOTTOM + 'px';
        iframe.style.right         = FAB_RIGHT + 'px';
        iframe.style.borderRadius  = '50%';
      }
    });

    // Recalculate on resize when open
    window.addEventListener('resize', function() {
      // Only resize when chat is open (iframe is larger than FAB)
      if (parseInt(iframe.style.width) <= FAB_SIZE + 4) return;
      var w = getWinW();
      var h = getWinH() + FAB_SIZE + WIN_BOTTOM + 16;
      iframe.style.width  = Math.min(w + FAB_RIGHT, window.innerWidth) + 'px';
      iframe.style.height = Math.min(h + FAB_BOTTOM, window.innerHeight) + 'px';
    });
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
