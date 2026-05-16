(function () {
  'use strict';

  let dispatching = false;

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

    e.preventDefault();
    e.stopImmediatePropagation();

    const sendMode = e.ctrlKey || e.metaKey;

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
