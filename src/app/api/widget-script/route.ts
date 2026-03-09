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

  // Chat window: 400px wide, 500px tall (matches .wb-window in ChatWidget.tsx)
  // .wb-window sits at bottom:84px; FAB sits at bottom:24px height:52px
  // Iframe bottom = FAB_BOTTOM so the close button floats 24px above the screen edge (nice gap)
  // Iframe height = WIN_H + WIN_BOTTOM + FAB_SIZE + padding — enough to contain chat window + FAB
  var WIN_W        = 400;
  var WIN_H        = 500;   // max chat window height (matches .wb-window in ChatWidget.tsx)
  var WIN_BOTTOM   = 84;    // .wb-window bottom offset inside iframe (above FAB)
  var BOTTOM_GAP   = FAB_BOTTOM; // iframe bottom = same as FAB_BOTTOM → close button sits 24px from screen edge
  var RIGHT_GAP    = 20;    // gap from viewport right when open
  var SMALL_SCREEN = 460;   // breakpoint for full-screen mode (matches ChatWidget.tsx)

  function isSmallScreen() {
    return window.innerWidth <= SMALL_SCREEN;
  }

  function openSize() {
    if (isSmallScreen()) {
      return { w: window.innerWidth, h: window.innerHeight, bottom: 0, right: 0, radius: '0' };
    }
    // iframe height = WIN_H + WIN_BOTTOM + FAB_SIZE + padding
    // iframe bottom = FAB_BOTTOM (24px) → FAB inside at bottom:24px sits at 24+24=48px from viewport
    // The close button is fully visible with a 24px gap from the screen edge
    var iW = Math.min(WIN_W + RIGHT_GAP, window.innerWidth);
    var iH = Math.min(WIN_H + WIN_BOTTOM + FAB_SIZE + 12, window.innerHeight);
    return { w: iW, h: iH, bottom: BOTTOM_GAP, right: RIGHT_GAP, radius: '28px' };
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

    var isOpen = false;

    function applyOpen() {
      isOpen = true;
      var sz = openSize();
      iframe.style.width        = sz.w + 'px';
      iframe.style.height       = sz.h + 'px';
      iframe.style.bottom       = sz.bottom + 'px';
      iframe.style.right        = sz.right + 'px';
      iframe.style.borderRadius = sz.radius;
    }

    function applyClose() {
      isOpen = false;
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
      if (isOpen) applyOpen();
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
