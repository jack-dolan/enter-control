(function () {
  'use strict';

  let dispatching = false;
  let sendKey = 'either';

  chrome.storage.sync.get({ sendKey: 'either' }, (prefs) => { sendKey = prefs.sendKey; });
  chrome.storage.onChanged.addListener((changes, area) => {
    if (area === 'sync' && changes.sendKey) sendKey = changes.sendKey.newValue;
  });

  function isEditableTarget(el) {
    if (!el) return false;
    if (el.tagName === 'TEXTAREA') return true;
    if (el.isContentEditable) return true;
    const ancestor = el.closest('[contenteditable]');
    return ancestor !== null && ancestor.contentEditable !== 'false';
  }

  document.addEventListener('keydown', (e) => {
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
