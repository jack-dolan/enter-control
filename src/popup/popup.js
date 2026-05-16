'use strict';

// ── Storage ──────────────────────────────────────────────────────────────────

async function getSites() {
  const { sites = [] } = await chrome.storage.sync.get('sites');
  return sites;
}

async function saveSites(sites) {
  await chrome.storage.sync.set({ sites });
}

async function getSendKey() {
  const { sendKey = 'either' } = await chrome.storage.sync.get('sendKey');
  return sendKey;
}

async function saveSendKey(value) {
  await chrome.storage.sync.set({ sendKey: value });
}

// ── Utilities ─────────────────────────────────────────────────────────────────

function generateId() {
  return crypto.randomUUID();
}

function normalizeToHostname(input) {
  const trimmed = input.trim();
  if (!trimmed) return null;
  try {
    const withProto = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
    const { hostname } = new URL(withProto);
    if (!hostname || /[*?]/.test(hostname)) return null;
    return hostname;
  } catch (_) {
    return null;
  }
}

function showInlineError(msg) {
  const el = document.getElementById('msg-error');
  el.textContent = msg;
  el.hidden = false;
  setTimeout(() => { el.hidden = true; }, 4000);
}

// ── Script registration ───────────────────────────────────────────────────────

async function registerScript(site) {
  const id = `ec-${site.id}`;
  const existing = await chrome.scripting.getRegisteredContentScripts({ ids: [id] });
  if (existing.length > 0) return;
  await chrome.scripting.registerContentScripts([{
    id,
    matches: [`*://${site.domain}/*`],
    js: ['src/content-script.js'],
    runAt: 'document_idle',
    allFrames: false,
  }]);
}

async function unregisterScript(site) {
  try {
    await chrome.scripting.unregisterContentScripts({ ids: [`ec-${site.id}`] });
  } catch (_) {}
}

// ── Add sites ─────────────────────────────────────────────────────────────────

async function completePendingSite() {
  const { pendingSite } = await chrome.storage.session.get('pendingSite');
  if (!pendingSite) return;
  const { domain } = pendingSite;
  await chrome.storage.session.remove('pendingSite');

  const hasPermission = await chrome.permissions.contains({ origins: [`*://${domain}/*`] });
  if (!hasPermission) return;

  const sites = await getSites();
  if (sites.some((s) => s.domain === domain)) return;

  const faviconUrl = `https://${domain}/favicon.ico`;
  const site = { id: generateId(), domain, name: domain, faviconUrl, enabled: true };
  await saveSites([...sites, site]);
  await registerScript(site);
}

async function addSite(domain) {
  const sites = await getSites();
  if (sites.some((s) => s.domain === domain)) {
    showInlineError(`${domain} is already in your list.`);
    return false;
  }

  // Stash intent before the permission dialog — the popup may close during it
  await chrome.storage.session.set({ pendingSite: { domain } });

  let granted;
  try {
    granted = await chrome.permissions.request({ origins: [`*://${domain}/*`] });
  } catch (err) {
    console.error('Permission request failed:', err);
    await chrome.storage.session.remove('pendingSite');
    return false;
  }

  // Popup survived the dialog — clear the stash and finish here
  await chrome.storage.session.remove('pendingSite');
  if (!granted) return false;

  const faviconUrl = `https://${domain}/favicon.ico`;
  const site = { id: generateId(), domain, name: domain, faviconUrl, enabled: true };
  await saveSites([...sites, site]);
  await registerScript(site);
  await render();
  return true;
}

async function addCurrentSite() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab?.url) return;
  let url;
  try { url = new URL(tab.url); } catch (_) { return; }
  if (url.protocol !== 'https:' && url.protocol !== 'http:') return;
  await addSite(url.hostname);
}

async function addByDomain() {
  const input = document.getElementById('input-domain');
  const domain = normalizeToHostname(input.value);
  if (!domain) {
    input.classList.add('error');
    return;
  }
  input.classList.remove('error');
  const added = await addSite(domain);
  if (added) input.value = '';
}

// ── Manage sites ──────────────────────────────────────────────────────────────

async function renameSite(id, newName) {
  const sites = await getSites();
  const site = sites.find((s) => s.id === id);
  if (!site) return;
  site.name = newName.trim() || site.domain;
  await saveSites(sites);
}

async function toggleSite(id) {
  const sites = await getSites();
  const site = sites.find((s) => s.id === id);
  if (!site) return;
  site.enabled = !site.enabled;
  await saveSites(sites);
  if (site.enabled) {
    await registerScript(site);
  } else {
    await unregisterScript(site);
  }
  await render();
}

async function removeSite(id) {
  const sites = await getSites();
  const site = sites.find((s) => s.id === id);
  if (!site) return;
  await unregisterScript(site);
  try {
    await chrome.permissions.remove({ origins: [`*://${site.domain}/*`] });
  } catch (_) {}
  await saveSites(sites.filter((s) => s.id !== id));
  await render();
}

// ── Render ────────────────────────────────────────────────────────────────────

function buildSiteEl(site) {
  const el = document.createElement('div');
  el.className = 'site-item';

  const favicon = document.createElement('img');
  favicon.className = 'favicon';
  favicon.width = 16;
  favicon.height = 16;
  favicon.src = site.faviconUrl;
  favicon.onerror = () => { favicon.style.visibility = 'hidden'; };

  const info = document.createElement('div');
  info.className = 'site-info';

  const nameInput = document.createElement('input');
  nameInput.className = 'site-name';
  nameInput.type = 'text';
  nameInput.value = site.name;
  nameInput.setAttribute('aria-label', 'Site name');
  nameInput.addEventListener('focus', () => nameInput.select());
  nameInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') nameInput.blur();
  });
  nameInput.addEventListener('blur', () => {
    const trimmed = nameInput.value.trim();
    const resolved = trimmed || site.domain;
    if (resolved !== site.name) {
      nameInput.value = resolved;
      renameSite(site.id, resolved);
    }
  });

  const domainLabel = document.createElement('span');
  domainLabel.className = 'site-domain';
  domainLabel.textContent = site.domain;

  info.append(nameInput, domainLabel);

  const toggle = document.createElement('button');
  toggle.className = `toggle ${site.enabled ? 'on' : 'off'}`;
  toggle.textContent = site.enabled ? 'On' : 'Off';
  toggle.setAttribute('aria-pressed', String(site.enabled));
  toggle.addEventListener('click', () => toggleSite(site.id));

  const remove = document.createElement('button');
  remove.className = 'remove';
  remove.textContent = '×';
  remove.setAttribute('aria-label', `Remove ${site.name}`);
  remove.addEventListener('click', () => removeSite(site.id));

  el.append(favicon, info, toggle, remove);
  return el;
}

async function render() {
  const sites = await getSites();
  const list = document.getElementById('site-list');
  const empty = document.getElementById('empty-state');
  list.innerHTML = '';
  empty.hidden = sites.length > 0;
  sites.forEach((site) => list.appendChild(buildSiteEl(site)));
}

// ── Init ──────────────────────────────────────────────────────────────────────

async function init() {
  document.getElementById('btn-add-current').addEventListener('click', addCurrentSite);
  document.getElementById('btn-add-domain').addEventListener('click', addByDomain);
  document.getElementById('input-domain').addEventListener('keydown', (e) => {
    if (e.key === 'Enter') addByDomain();
  });
  document.getElementById('input-domain').addEventListener('input', (e) => {
    e.target.classList.remove('error');
  });

  const sendKeySelect = document.getElementById('select-send-key');
  sendKeySelect.value = await getSendKey();
  sendKeySelect.addEventListener('change', () => saveSendKey(sendKeySelect.value));

  await completePendingSite();
  await render();
}

init();
