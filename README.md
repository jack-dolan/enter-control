# Enter Control

Per-site Enter key control for messaging apps. `Enter` inserts a new line; `Ctrl+Enter` or `⌘+Enter` sends. No more accidental sends.

![CI](https://github.com/jack-dolan/enter-control/actions/workflows/ci.yml/badge.svg)
![CodeQL](https://github.com/jack-dolan/enter-control/actions/workflows/codeql.yml/badge.svg)

## What it does

On sites you configure, Enter Control swaps the Enter key behavior:

| Key | Default | With Enter Control |
|---|---|---|
| `Enter` | Sends / submits | Inserts a new line |
| `Ctrl+Enter` / `⌘+Enter` | Inserts a new line | Sends / submits |

Works on any site you choose — Google Chat, Slack, Teams, Discord, and more. The popup's **Send with** dropdown lets you lock sending to `Ctrl+Enter`, `⌘+Enter`, or accept either.

## Install

> Chrome Web Store listing coming soon.

In the meantime, install from a release zip:

1. Download the latest `.zip` from [Releases](https://github.com/jack-dolan/enter-control/releases) and unzip it
2. Open Chrome and navigate to `chrome://extensions`
3. Enable **Developer mode** (top-right toggle)
4. Click **Load unpacked** and select the unzipped folder
5. Navigate to any messaging site, click the Enter Control toolbar icon, and add it

## Permissions

| Permission | Why |
|---|---|
| `storage` | Saves your site list via Chrome sync |
| `scripting` | Registers the key-swap content script on permitted sites |
| `activeTab` | Reads the active tab URL when you click "Add current site" |
| `tabs` | Queries open tabs to keep the toolbar icon state in sync |
| Host permissions | Requested **per site**, only when you explicitly add one — no broad access at install |

## How it works

When you add a site, Enter Control calls `chrome.permissions.request()` for that specific domain, then registers a lightweight content script via `chrome.scripting.registerContentScripts()`. The script intercepts `keydown` events on editable elements: bare `Enter` becomes `Shift+Enter` (newline), and `Ctrl+Enter` / `⌘+Enter` becomes bare `Enter` (send). Modifier preference is configurable via the popup dropdown.

## Privacy

Enter Control intercepts only the Enter key — it never reads your messages or any page content, and no data is transmitted anywhere. See [PRIVACY.md](PRIVACY.md) for full details.

## Development

```sh
npm install   # install dev dependencies
npm run lint  # run ESLint across src/
npm run audit # check for known vulnerabilities in deps
npm run zip   # build dist/enter-control.zip for local testing
```

To load the extension from source:

1. Clone this repo
2. Open `chrome://extensions`, enable **Developer mode**
3. Click **Load unpacked** and select this repo's root directory

## Releasing

1. Update `"version"` in `manifest.json` (Chrome requires `major.minor.patch` format)
2. Commit and push
3. Tag the commit and push the tag:
   ```sh
   git tag v0.2.0
   git push origin v0.2.0
   ```

The release workflow automatically lints, audits dependencies, verifies the tag matches the manifest version, zips the extension, and publishes a GitHub Release with the zip attached. Download that zip to upload manually to the Chrome Web Store Developer Dashboard.

The tag must match the manifest version exactly — `v0.2.0` requires `"version": "0.2.0"` in `manifest.json`. The workflow fails with a clear error if they don't match.
