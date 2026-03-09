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

    // The iframe is ALWAYS pointer-events:none at the CSS level.
    // The inner widget page uses pointer-events:none on its root div,
    // with only .wb-fab and .wb-window having pointer-events:all.
    // This means only the actual visible widget elements receive clicks —
    // the transparent iframe glass never blocks the host page.
    var iframe = document.createElement('iframe');
    iframe.id = 'weiblocks-chat-frame';
    iframe.src = WIDGET_URL + '/widget';
    iframe.style.cssText = [
      'position:fixed',
      'bottom:0',
      'right:0',
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

    // Host-side FAB hit-area — transparent button exactly over the visual FAB
    // inside the iframe. Needed because pointer-events:none on the iframe means
    // the iframe's own FAB button cannot receive clicks directly.
    var fab = document.createElement('button');
    fab.id = 'weiblocks-fab-host';
    fab.setAttribute('aria-label', 'Open Weiblocks AI Chat');
    fab.style.cssText = [
      'position:fixed',
      'bottom:24px',
      'right:24px',
      'width:56px',
      'height:56px',
      'border-radius:50%',
      'border:none',
      'cursor:pointer',
      'z-index:2147483647',
      'background:transparent',
      'padding:0',
      'pointer-events:all'
    ].join(';');
    fab.addEventListener('click', function() {
      iframe.contentWindow && iframe.contentWindow.postMessage('wb:toggle', WIDGET_URL);
    });
    document.body.appendChild(fab);

    // Listen for open/close state from the widget
    window.addEventListener('message', function(e) {
      if (e.origin !== WIDGET_URL) return;

      if (e.data === 'wb:open') {
        chatOpen = true;
        // Hide host FAB — the iframe's own X button handles closing.
        // The iframe stays pointer-events:none so the host page is never blocked.
        // Only the actual chat window area inside the iframe receives clicks
        // because ChatWidget sets pointer-events:all only on .wb-window and .wb-fab.
        fab.style.display = 'none';
      } else if (e.data === 'wb:close') {
        chatOpen = false;
        fab.style.display = 'block';
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
