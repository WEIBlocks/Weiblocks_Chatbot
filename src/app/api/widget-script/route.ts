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
  var chatOpen = false;

  function injectWidget() {
    if (document.getElementById('weiblocks-chat-frame')) return;

    // ── 1. Full-viewport iframe — ALWAYS pointer-events:none ──────────────
    // It never blocks the host page. We control interactivity via the
    // host-side elements below.
    var iframe = document.createElement('iframe');
    iframe.id = 'weiblocks-chat-frame';
    iframe.src = WIDGET_URL + '/widget';
    iframe.style.cssText = [
      'position:fixed',
      'inset:0',
      'width:100%',
      'height:100%',
      'border:none',
      'background:transparent',
      'z-index:2147483644',
      'pointer-events:none'
    ].join(';');
    iframe.setAttribute('title', 'Weiblocks AI Assistant');
    iframe.setAttribute('allow', 'microphone');
    document.body.appendChild(iframe);

    // ── 2. Transparent full-screen overlay (shown only when chat is open) ──
    // Sits above the host page content but below the iframe.
    // When the chat is open this element covers the page so clicks outside
    // the chat window close it. When closed it is display:none.
    var overlay = document.createElement('div');
    overlay.id = 'weiblocks-overlay';
    overlay.style.cssText = [
      'position:fixed',
      'inset:0',
      'z-index:2147483643',
      'background:transparent',
      'display:none',
      'pointer-events:all'
    ].join(';');
    overlay.addEventListener('click', function() {
      // Click outside chat → close
      iframe.contentWindow && iframe.contentWindow.postMessage('wb:forceclose', WIDGET_URL);
    });
    document.body.appendChild(overlay);

    // ── 3. Host-side FAB button ───────────────────────────────────────────
    // This is a real button in the host page — always clickable, always on top.
    // It toggles the chat by messaging the iframe.
    // It is hidden while the chat is open (the iframe's own X button handles closing).
    var fab = document.createElement('button');
    fab.id = 'weiblocks-fab-host';
    fab.setAttribute('aria-label', 'Open Weiblocks AI Chat');
    fab.style.cssText = [
      'position:fixed',
      'bottom:24px',
      'right:24px',
      'width:52px',
      'height:52px',
      'border-radius:50%',
      'border:none',
      'cursor:pointer',
      'z-index:2147483647',
      'background:transparent',
      'padding:0',
      'display:flex',
      'align-items:center',
      'justify-content:center',
      'pointer-events:all'
    ].join(';');
    // Invisible — the visual FAB is rendered inside the iframe.
    // This host-side button is purely a transparent hit-area on top.
    fab.innerHTML = '<span style="display:block;width:52px;height:52px;border-radius:50%;background:transparent;"></span>';
    fab.addEventListener('click', function() {
      iframe.contentWindow && iframe.contentWindow.postMessage('wb:toggle', WIDGET_URL);
    });
    document.body.appendChild(fab);

    // ── 4. Listen for state changes from the widget ───────────────────────
    window.addEventListener('message', function(e) {
      if (e.origin !== WIDGET_URL) return;

      if (e.data === 'wb:open') {
        chatOpen = true;
        // Enable full iframe interaction for the open chat window
        iframe.style.pointerEvents = 'all';
        iframe.style.zIndex = '2147483645';
        // Show overlay so clicks outside the chat window bubble to host button
        overlay.style.display = 'block';
        // Hide host FAB (iframe's own X button handles closing)
        fab.style.display = 'none';
      } else if (e.data === 'wb:close') {
        chatOpen = false;
        // Disable iframe — host page fully interactive again
        iframe.style.pointerEvents = 'none';
        iframe.style.zIndex = '2147483644';
        overlay.style.display = 'none';
        fab.style.display = 'flex';
      }
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
