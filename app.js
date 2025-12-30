// Modern hide/show app script with state saved in localStorage
(function () {
  const APP_KEY = 'prosider_app_hidden_v1';
  const app = document.getElementById('app');
  const hideBtn = document.getElementById('hide-app');
  const hideLabel = document.getElementById('hide-label');
  const collapsedBar = document.getElementById('collapsed-bar');
  const showBtn = document.getElementById('show-app');
  const appContent = document.getElementById('app-content');

  // If required DOM nodes are missing, bail out gracefully.
  if (!app || !hideBtn || !hideLabel || !collapsedBar || !showBtn) {
    // Do not throw — just avoid errors. Useful when this script is loaded in other contexts.
    console.warn('ProSider: some UI elements are missing; hide/show disabled.');
    return;
  }

  function setHidden(hidden, persist = true) {
    if (hidden) {
      app.classList.add('collapsed');
      app.setAttribute('aria-hidden', 'true');
      if (appContent) appContent.setAttribute('hidden', '');
      hideBtn.setAttribute('aria-expanded', 'false');
      hideLabel.textContent = 'Hiện';
      collapsedBar.hidden = false;
    } else {
      app.classList.remove('collapsed');
      app.setAttribute('aria-hidden', 'false');
      if (appContent) appContent.removeAttribute('hidden');
      hideBtn.setAttribute('aria-expanded', 'true');
      hideLabel.textContent = 'Ẩn';
      collapsedBar.hidden = true;
    }
    if (persist) {
      try {
        localStorage.setItem(APP_KEY, hidden ? '1' : '0');
      } catch (err) {
        console.warn('ProSider: cannot access localStorage', err);
      }
    }
  }

  // Toggle helper (toggle current state)
  function toggleHidden() {
    const isHidden = app.classList.contains('collapsed');
    setHidden(!isHidden);
  }

  // init from storage (safe)
  let stored = null;
  try { stored = localStorage.getItem(APP_KEY); } catch(e) { /* ignore */ }
  if (stored === '1') {
    setHidden(true, false);
  } else {
    setHidden(false, false);
  }

  // Attach listeners
  hideBtn.addEventListener('click', toggleHidden);
  showBtn.addEventListener('click', () => setHidden(false));

  // keyboard shortcut 'H' to toggle (ignore when typing into input/textarea)
  window.addEventListener('keydown', (e) => {
    if (e.key && e.key.toLowerCase() === 'h' && !/input|textarea/i.test(document.activeElement.tagName)) {
      e.preventDefault();
      toggleHidden();
    }
  });

  // When we hide, move focus to the show button (nice touch)
  // Keep this separate but guarded
  hideBtn.addEventListener('click', () => {
    setTimeout(() => {
      try { showBtn.focus(); } catch (err) { /* ignore */ }
    }, 220);
  });
})();
