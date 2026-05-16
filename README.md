# Enter Control

A Chrome extension that swaps `Enter` and `Ctrl+Enter` on sites you configure. `Enter` inserts a newline; `Ctrl+Enter` sends.

## Development setup

1. Clone this repo
2. Open Chrome and navigate to `chrome://extensions`
3. Enable **Developer mode** (top-right toggle)
4. Click **Load unpacked** and select this repo's root directory
5. Navigate to any messaging site, click the Enter Control toolbar icon, and add it

```sh
npm install   # install dev dependencies
npm run lint  # run ESLint across src/
npm run audit # check for known vulnerabilities in deps
```

## Permissions

| Permission | Why |
|---|---|
| `storage` | Saves your site list via Chrome sync |
| `scripting` | Registers the key-swap content script on permitted sites |
| `activeTab` + `tabs` | Reads the active tab URL and favicon when you click "Add current site" |
| Host permissions | Requested **per site**, only when you explicitly add one |

No broad host access is declared at install time.

## How it works

When you add a site, Enter Control calls `chrome.permissions.request()` for that specific domain, then uses `chrome.scripting.registerContentScripts()` to inject a lightweight content script. The script intercepts `keydown` events in capture phase: bare `Enter` becomes `Shift+Enter` (newline), and `Ctrl+Enter` becomes bare `Enter` (send).

## Chrome Web Store

Publication is the next milestone.
