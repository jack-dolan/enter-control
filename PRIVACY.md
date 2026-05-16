# Privacy Policy — Enter Control

**Effective Date:** May 16, 2026

## 1. Information Collection

Enter Control does not collect, store, use, or share any personal information. No user data is transmitted to our servers or to any third parties.

## 2. Local Permissions

Enter Control requires the following browser permissions to function. All data is processed locally on your device and is never sent to us.

| Permission | Purpose |
|---|---|
| `storage` | Saves your list of configured sites using Chrome's built-in sync storage. This data is synced across your own signed-in Chrome devices by Google's infrastructure — it is not accessible to us. |
| `scripting` | Registers a lightweight script on sites you explicitly add, enabling the Enter key swap. |
| `activeTab` | Reads the URL of your active tab when you click "Add current site." |
| `tabs` | Reads open tab URLs to update the toolbar icon state (active vs. inactive). |
| Host permissions | Requested per-site, only when you explicitly add a domain. No host access is requested at install time. |

## 3. What the Extension Does and Does Not Do

Enter Control intercepts only the **Enter key** inside text input fields on sites you have explicitly added. It does not:

- Read, collect, or transmit your typed messages or any other page content
- Log or record keystrokes of any kind
- Access any information beyond the Enter key event itself and whether it occurred inside an editable element
- Communicate with any remote server operated by us

Favicon images are fetched directly from each configured domain (`https://domain/favicon.ico`) solely for display in the extension popup. These requests originate from your browser and are equivalent to any normal image load; we do not initiate or receive them.

## 4. Data Stored

The only data stored by Enter Control is:

- Your list of configured site domains and display names
- Whether each site is enabled or disabled
- Your preferred send-key setting (Ctrl+Enter, ⌘+Enter, or either)

This data is stored via `chrome.storage.sync`, which syncs it across your own Google-signed-in Chrome devices. It is never transmitted to or accessible by us.

## 5. Chrome Web Store — Limited Use

Enter Control does not access user data through Google APIs. This section is included for completeness: if that changes in a future version, this policy will be updated to state compliance with the [Chrome Web Store Developer Program Policies](https://developer.chrome.com/docs/webstore/program-policies/).

## 6. Changes to This Privacy Policy

We may update this Privacy Policy from time to time. Changes will be reflected by updating the Effective Date above and posting the revised policy in this repository.

## 7. Contact

If you have any questions about this Privacy Policy, please contact: jack@dolanjack.com
