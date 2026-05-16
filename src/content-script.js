(function () {
  'use strict';

  // Guard against double-injection (e.g. executeScript on an already-loaded tab).
  // The existing instance's storage listener handles state updates instead.
  if (window.__enterControlActive !== undefined) return;
  window.__enterControlActive = true;

  let dispatching = false;
  let active = false;
  let sendKey = 'either';

  function getHostname() {
    try { return new URL(location.href).hostname; } catch (_) { return ''; }
  }

  async function syncState() {
    const hostname = getHostname();
    if (!hostname) { active = false; return; }
    const { sites = [], sendKey: sk = 'either' } = await chrome.storage.sync.get(['sites', 'sendKey']);
    active = sites.some((s) => s.domain === hostname && s.enabled);
    sendKey = sk;
  }

  // Seed state immediately, then keep it in sync as storage changes.
  syncState();
  chrome.storage.onChanged.addListener((changes, area) => {
    if (area === 'sync' && (changes.sites || changes.sendKey)) syncState();
  });

  function isEditableTarget(el) {
    if (!el) return false;
    if (el.tagName === 'TEXTAREA') return true;
    if (el.isContentEditable) return true;
    const ancestor = el.closest('[contenteditable]');
    return ancestor !== null && ancestor.contentEditable !== 'false';
  }

  document.addEventListener('keydown', (e) => {
    if (!active) return;
    if (dispatching) return;
    if (e.key !== 'Enter') return;
    if (!isEditableTarget(e.target)) return;
    if (e.shiftKey || e.altKey) return;

    const hasCtrl = e.ctrlKey && !e.metaKey;
    const hasMeta = e.metaKey && !e.ctrlKey;

    let sendMode;
    if (sendKey === 'ctrl') {
      if (hasMeta) return;
      sendMode = hasCtrl;
    } else if (sendKey === 'meta') {
      if (hasCtrl) return;
      sendMode = hasMeta;
    } else {
      sendMode = e.ctrlKey || e.metaKey;
    }

    e.preventDefault();
    e.stopImmediatePropagation();

    const synthetic = new KeyboardEvent('keydown', {
      key: 'Enter',
      code: 'Enter',
      keyCode: 13,
      which: 13,
      bubbles: true,
      cancelable: true,
      shiftKey: !sendMode,
      ctrlKey: false,
      metaKey: false,
      altKey: false,
    });

    dispatching = true;
    e.target.dispatchEvent(synthetic);
    dispatching = false;
  }, true);
})();
