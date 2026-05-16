'use strict';

chrome.runtime.onInstalled.addListener(({ reason }) => {
  if (reason === 'install') {
    chrome.tabs.create({ url: chrome.runtime.getURL('src/onboarding/onboarding.html') });
  }
});

// When the user grants a host permission, immediately activate on any already-open tabs
// for that domain so they don't need a page refresh.
chrome.permissions.onAdded.addListener(async ({ origins }) => {
  for (const origin of origins) {
    const match = origin.match(/^\*:\/\/([^/]+)\/\*$/);
    if (!match) continue;
    const tabs = await chrome.tabs.query({ url: `*://${match[1]}/*` });
    await Promise.all(
      tabs.map((tab) =>
        chrome.scripting.executeScript({ target: { tabId: tab.id }, files: ['src/content-script.js'] })
          .catch(() => {})
      )
    );
  }
});
