// inject.js
// Chèn iframe sidebar vào page (right fixed panel) và thêm logo nhỏ để show/hide
// Nếu đã có thì không chèn lại.

(function() {
  if (window.__proSideAIInjected) return;
  window.__proSideAIInjected = true;

  const STORAGE_KEY = 'proside_hidden_v1';

  // Create iframe
  const iframe = document.createElement('iframe');
  iframe.src = chrome.runtime.getURL('sidebar.html');
  iframe.id = 'pro-side-ai-iframe';
  iframe.style.position = 'fixed';
  iframe.style.top = '0';
  iframe.style.right = '0';
  iframe.style.height = '100vh';
  iframe.style.width = '420px';
  iframe.style.zIndex = '2147483647';
  iframe.style.border = '0';
  iframe.style.boxShadow = '0 0 12px rgba(0,0,0,0.3)';
  iframe.style.background = 'white';
  iframe.style.transition = 'transform 0.28s ease, opacity 0.22s ease';
  iframe.style.transform = 'translateX(0)'; // visible by default
  iframe.setAttribute('aria-hidden', 'false');

  // Collapsed logo/tab (small vertical pill at right center)
  const collapsedTab = document.createElement('button');
  collapsedTab.id = 'pro-side-ai-collapsed-tab';
  collapsedTab.type = 'button';
  collapsedTab.title = 'Mở ProSider AI';
  collapsedTab.setAttribute('aria-label', 'Mở ProSider AI');
  // simple SVG logo (keeps size small)
  collapsedTab.innerHTML = `<svg width="28" height="28" viewBox="0 0 24 24" aria-hidden="true" style="display:block;color:white"><path fill="currentColor" d="M3 12a9 9 0 1 0 13.9-7.8L12 7 3 4v8z"/></svg>`;
  Object.assign(collapsedTab.style, {
    position: 'fixed',
    right: '6px',
    top: '50%',
    transform: 'translateY(-50%)',
    zIndex: '2147483648',
    width: '40px',
    height: '40px',
    padding: '6px',
    background: 'linear-gradient(90deg,#4f46e5,#06b6d4)',
    color: 'white',
    border: 'none',
    borderRadius: '10px',
    boxShadow: '0 8px 26px rgba(6,182,212,0.12)',
    cursor: 'pointer',
    display: 'none', // hidden by default (shown when collapsed)
    alignItems: 'center',
    justifyContent: 'center'
  });

  // Append to DOM (body preferred)
  const parentEl = document.body || document.documentElement;
  try {
    parentEl.appendChild(iframe);
    parentEl.appendChild(collapsedTab);
  } catch (err) {
    // fallback: try document.documentElement
    try {
      document.documentElement.appendChild(iframe);
      document.documentElement.appendChild(collapsedTab);
    } catch (e) {
      console.warn('ProSide: cannot inject UI', e);
      window.__proSideAIInjected = false;
      return;
    }
  }

  // Safe localStorage getter/setter
  function storageSet(val) {
    try { localStorage.setItem(STORAGE_KEY, val ? '1' : '0'); } catch (e) { /* ignore */ }
  }
  function storageGet() {
    try { return localStorage.getItem(STORAGE_KEY); } catch (e) { return null; }
  }

  // Show/hide logic: hide -> translateX(100%) so iframe moves outside viewport
  function setHidden(hidden, persist = true) {
    if (hidden) {
      iframe.style.transform = 'translateX(100%)';
      iframe.setAttribute('aria-hidden', 'true');
      iframe.style.opacity = '0';
      iframe.style.pointerEvents = 'none';
      collapsedTab.style.display = 'flex';
      try { collapsedTab.focus(); } catch(e) {}
    } else {
      iframe.style.transform = 'translateX(0)';
      iframe.setAttribute('aria-hidden', 'false');
      iframe.style.opacity = '1';
      iframe.style.pointerEvents = 'auto';
      collapsedTab.style.display = 'none';
      try { iframe.focus(); } catch(e) {}
    }
    if (persist) storageSet(hidden);
  }

  // Init from storage
  const stored = storageGet();
  if (stored === '1') setHidden(true, false);
  else setHidden(false, false);

  // Click handlers
  collapsedTab.addEventListener('click', () => setHidden(false));

  // Message handler from iframe (sidebar)
  function onMessage(ev) {
    // SECURITY: only accept messages that actually come from our iframe
    if (ev.source !== iframe.contentWindow) return;
    const data = ev.data;
    if (!data || typeof data !== 'object') return;
    if (data.type === 'closeProSideAI') {
      // old behavior: remove all. Keep for compatibility (if iframe wants full removal)
      removeAll();
    } else if (data.type === 'hideProSideAI') {
      setHidden(true);
    } else if (data.type === 'toggleProSideAI') {
      const isHidden = iframe.getAttribute('aria-hidden') === 'true';
      setHidden(!isHidden);
    } else if (data.type === 'collapseProSideAI') {
      // new: collapse to small logo (do not remove iframe)
      setHidden(true);
    }
  }
  window.addEventListener('message', onMessage, false);

  // Cleanup function to remove injected elements and listeners (rare)
  function removeAll() {
    try { window.removeEventListener('message', onMessage, false); } catch(e){}
    const el = document.getElementById('pro-side-ai-iframe');
    if (el && el.parentNode) el.parentNode.removeChild(el);
    const btn = document.getElementById('pro-side-ai-collapsed-tab');
    if (btn && btn.parentNode) btn.parentNode.removeChild(btn);
    window.__proSideAIInjected = false;
  }

  // Optional: allow page scripts to dispatch a custom event to close
  window.addEventListener('ProSideAIClose', removeAll, false);

})();
