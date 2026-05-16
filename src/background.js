'use strict';

// ── Icon / title constants ────────────────────────────────────────────────────

// Use chrome.runtime.getURL so paths are absolute chrome-extension:// URLs —
// relative strings resolve from the service worker file location, not the root.
const ICON_ACTIVE = {
  16: chrome.runtime.getURL('icons/action_active16.png'),
  24: chrome.runtime.getURL('icons/action_active24.png'),
  32: chrome.runtime.getURL('icons/action_active32.png'),
};
const ICON_INACTIVE = {
  16: chrome.runtime.getURL('icons/action16.png'),
  24: chrome.runtime.getURL('icons/action24.png'),
  32: chrome.runtime.getURL('icons/action32.png'),
};
const TITLE_ACTIVE   = 'Enter Control: active on this site';
const TITLE_INACTIVE = 'Enter Control: inactive on this site';

// ── Helpers ───────────────────────────────────────────────────────────────────

async function isActiveOnTab(tab) {
  if (!tab?.url) return false;
  let hostname;
  try { hostname = new URL(tab.url).hostname; } catch (_) { return false; }
  if (!hostname) return false;
  const { sites = [] } = await chrome.storage.sync.get('sites');
  return sites.some((s) => s.domain === hostname && s.enabled);
}

async function updateTabIcon(tabId) {
  let tab;
  try { tab = await chrome.tabs.get(tabId); } catch (_) { return; }
  const active = await isActiveOnTab(tab);
  try {
    await chrome.action.setIcon({ tabId, path: active ? ICON_ACTIVE : ICON_INACTIVE });
    await chrome.action.setTitle({ tabId, title: active ? TITLE_ACTIVE : TITLE_INACTIVE });
  } catch (_) { /* tab was closed between the get and the set */ }
}

async function updateAllTabs() {
  const tabs = await chrome.tabs.query({});
  await Promise.all(tabs.map((tab) => updateTabIcon(tab.id)));
}

// ── Lifecycle ─────────────────────────────────────────────────────────────────

chrome.runtime.onInstalled.addListener(async ({ reason }) => {
  if (reason === 'install') {
    chrome.tabs.create({ url: chrome.runtime.getURL('src/onboarding/onboarding.html') });
  }
  updateAllTabs();
});

// ── Icon state updates ────────────────────────────────────────────────────────

// Active tab switched
chrome.tabs.onActivated.addListener(({ tabId }) => updateTabIcon(tabId));

// Tab navigated or finished loading
chrome.tabs.onUpdated.addListener((tabId, changeInfo) => {
  if (changeInfo.status === 'complete' || changeInfo.url) updateTabIcon(tabId);
});

// Site list or settings changed in the popup
chrome.storage.onChanged.addListener(async (changes, area) => {
  if (area !== 'sync') return;
  if (changes.sites) {
    updateAllTabs();

    // For any site that just became active, retry injecting into open tabs.
    // onAdded can fire before Chrome finishes propagating the permission, so the
    // first executeScript attempt may have failed silently. By this point the
    // permission is confirmed (registerContentScripts just succeeded in the popup).
    const newSites = changes.sites.newValue || [];
    const oldDomains = new Set((changes.sites.oldValue || []).map((s) => s.domain));
    const added = newSites.filter((s) => s.enabled && !oldDomains.has(s.domain));
    for (const site of added) {
      const tabs = await chrome.tabs.query({ url: `*://${site.domain}/*` });
      await Promise.all(
        tabs.map((tab) =>
          chrome.scripting.executeScript({ target: { tabId: tab.id, allFrames: false }, files: ['src/content-script.js'] })
            .catch(() => {})
        )
      );
    }
  }
});

// ── Content script injection ──────────────────────────────────────────────────

// When the user grants a host permission, immediately activate on any already-open tabs
// for that domain so they don't need a page refresh.
chrome.permissions.onAdded.addListener(async ({ origins }) => {
  for (const origin of origins) {
    const match = origin.match(/^\*:\/\/([^/]+)\/\*$/);
    if (!match) continue;
    const tabs = await chrome.tabs.query({ url: `*://${match[1]}/*` });
    await Promise.all(
      tabs.map((tab) =>
        chrome.scripting.executeScript({ target: { tabId: tab.id, allFrames: false }, files: ['src/content-script.js'] })
          .catch(() => {})
      )
    );
  }
});
