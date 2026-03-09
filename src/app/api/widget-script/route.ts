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

  // FAB: 52px button, 24px from bottom-right (matches .wb-fab in ChatWidget.tsx)
  // We add extra padding so the pulse rings are not clipped by the iframe edge
  var FAB_SIZE    = 52;
  var FAB_PADDING = 20;  // extra space around FAB so rings/shadow are visible
  var FAB_BOTTOM  = 24;
  var FAB_RIGHT   = 24;

  // Chat window: 400px wide, 610px tall, sitting 104px above bottom (matches .wb-window)
  var WIN_W       = 400;
  var WIN_H       = 610;
  var WIN_GAP     = 20;  // gap between chat window and viewport edges

  function openSize() {
    // iframe covers: right gap + window width, and bottom gap + window height
    var iW = Math.min(WIN_W + WIN_GAP, window.innerWidth);
    var iH = Math.min(WIN_H + 104 + WIN_GAP, window.innerHeight); // 104 = wb-window bottom offset
    return { w: iW, h: iH };
  }

  function injectWidget() {
    if (document.getElementById('wb-iframe')) return;

    var iframe = document.createElement('iframe');
    iframe.id = 'wb-iframe';
    iframe.src = WIDGET_URL + '/widget';
    iframe.setAttribute('title', 'Weiblocks AI Assistant');
    iframe.setAttribute('frameborder', '0');
    iframe.setAttribute('scrolling', 'no');
    iframe.setAttribute('allow', 'microphone');

    // Closed state: iframe sized to FAB + padding so rings aren't clipped
    var closedW = FAB_SIZE + FAB_PADDING * 2;
    var closedH = FAB_SIZE + FAB_PADDING * 2;
    var closedB = FAB_BOTTOM - FAB_PADDING;
    var closedR = FAB_RIGHT  - FAB_PADDING;

    iframe.style.cssText = [
      'position:fixed',
      'bottom:' + closedB + 'px',
      'right:'  + closedR + 'px',
      'width:'  + closedW + 'px',
      'height:' + closedH + 'px',
      'border:none',
      'background:transparent',
      'z-index:2147483644',
      'display:block',
      'overflow:visible',
      'border-radius:0',
      'transition:none'
    ].join(';');

    document.body.appendChild(iframe);

    function applyOpen() {
      var sz = openSize();
      iframe.style.width        = sz.w + 'px';
      iframe.style.height       = sz.h + 'px';
      iframe.style.bottom       = WIN_GAP + 'px';
      iframe.style.right        = WIN_GAP + 'px';
      iframe.style.borderRadius = '28px';
    }

    function applyClose() {
      iframe.style.width        = closedW + 'px';
      iframe.style.height       = closedH + 'px';
      iframe.style.bottom       = closedB + 'px';
      iframe.style.right        = closedR + 'px';
      iframe.style.borderRadius = '0';
    }

    window.addEventListener('message', function(e) {
      if (e.origin !== WIDGET_URL) return;
      if (e.data === 'wb:open')  applyOpen();
      if (e.data === 'wb:close') applyClose();
    });

    window.addEventListener('resize', function() {
      if (parseInt(iframe.style.right) === WIN_GAP) applyOpen();
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
