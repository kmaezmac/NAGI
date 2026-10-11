// Minimal direct-realm experiment. No React, media, network, or persistence.
const text = {
  en: { help: 'Development probe. 1: acquire main. 2: open PiP. 3: acquire in PiP. Then switch tabs/apps and observe visibility/release events. API results do not verify OS behavior. Locks expire after 15 minutes when JavaScript can run. Logs stay in memory. Repeat from the main app for fallback testing.', main: '1. Request main lock', pip: '2. Open PiP', child: '3. Request PiP lock', stop: 'Release all locks', close: 'Close PiP', childHelp: 'PiP realm · inspect event log in the main tab. No OS guarantee. Main-page closing ends this experiment.' },
  ja: { help: '開発用の最小検証。1: メインで取得 → 2: PiPを開く → 3: PiPで取得。その後、タブ・アプリを切り替え、visibilityとreleaseを確認します。APIの結果はOS動作の検証ではありません。ロックは15分後、JavaScriptが動作できる時点で解除します。ログはメモリ内のみ。フォールバックはメインアプリで検証してください。', main: '1. メインでWake Lock取得', pip: '2. PiPを開く', child: '3. PiPでWake Lock取得', stop: 'すべて解除', close: 'PiPを閉じる', childHelp: 'PiP側のDocument · メイン側のログを確認してください。OS動作は保証しません。メインページを閉じると実験は終了します。' }
};
let lang = navigator.language.startsWith('ja') ? 'ja' : 'en';
let pip; let generation = 0; let opening = false; const slots = new Map(); const lines = [];
function log(name, event, detail = '') { lines.push(`${new Date().toISOString()} [${name}] ${event} ${detail}`); if (lines.length > 300) lines.shift(); document.getElementById('log').textContent = lines.join('\n'); }
function observe(win, name) {
  const slot = { win, sentinel: null, pending: false, deadline: null, token: 0 };
  slots.set(name, slot);
  const visibility = () => log(name, 'visibility', win.document.visibilityState);
  win.document.addEventListener('visibilitychange', visibility);
  const timer = win.setInterval(() => { if (slot.deadline !== null && Date.now() >= slot.deadline) release(slot); }, 500);
  slot.dispose = () => { slot.token++; win.clearInterval(timer); win.document.removeEventListener('visibilitychange', visibility); release(slot); if (slots.get(name) === slot) slots.delete(name); };
  win.addEventListener('pagehide', slot.dispose, { once: true });
  log(name, 'API', JSON.stringify({ secure: win.isSecureContext, wakeLock: !!win.navigator.wakeLock, visibility: win.document.visibilityState }));
  return slot;
}
async function release(slot) { slot.token++; slot.deadline = null; const sentinel = slot.sentinel; slot.sentinel = null; try { await sentinel?.release(); } catch (e) { log('release', 'error', e.name); } }
async function request(name) {
  const slot = slots.get(name); if (!slot || slot.pending || slot.sentinel && !slot.sentinel.released) return;
  if (!slot.win.isSecureContext || !slot.win.navigator.wakeLock) { log(name, 'unsupported'); return; }
  if (slot.win.document.visibilityState !== 'visible') { log(name, 'hidden: no request'); return; }
  slot.pending = true; const token = ++slot.token; const current = generation;
  slot.deadline = Date.now() + 15 * 60000;
  try {
    const sentinel = await slot.win.navigator.wakeLock.request('screen');
    if (current !== generation || token !== slot.token || slot.win.closed || slots.get(name) !== slot || Date.now() >= slot.deadline) { await sentinel.release(); return; }
    slot.sentinel = sentinel; log(name, 'resolved', `released=${sentinel.released}`);
    sentinel.addEventListener('release', () => { if (slot.sentinel === sentinel) slot.sentinel = null; log(name, 'release event'); }, { once: true });
  } catch (e) { log(name, 'request failed', e.name); } finally { slot.pending = false; }
}
function button(doc, key, action) { const b = doc.createElement('button'); b.textContent = text[lang][key]; b.addEventListener('click', action); return b; }
function renderChild() { if (!pip || pip.closed) return; pip.document.documentElement.lang = lang; const p = pip.document.createElement('p'); p.textContent = text[lang].childHelp; pip.document.body.replaceChildren(p, button(pip.document, 'child', () => request('pip')), button(pip.document, 'stop', stop)); }
async function openPiP() {
  if (opening || pip && !pip.closed) return; if (!window.documentPictureInPicture) { log('pip', 'unsupported'); return; }
  opening = true; const current = generation;
  try {
    const child = await window.documentPictureInPicture.requestWindow({ width: 400, height: 260 });
    if (current !== generation) { child.close(); return; }
    pip = child; const css = child.document.createElement('link'); css.rel = 'stylesheet'; css.href = new URL('./probe.css', location.href).href; child.document.head.append(css); child.document.title = 'HIRAKU · API probe';
    observe(child, 'pip'); child.addEventListener('pagehide', () => { if (pip === child) pip = undefined; log('pip', 'closed'); }, { once: true }); renderChild();
  } catch(e) { log('pip', 'open failed', e.name); } finally { opening = false; }
}
function stop() { generation++; for (const slot of slots.values()) void release(slot); }
function render() { document.documentElement.lang = lang; document.getElementById('help').textContent = text[lang].help; document.getElementById('buttons').replaceChildren(button(document, 'main', () => request('main')), button(document, 'pip', openPiP), button(document, 'child', () => request('pip')), button(document, 'stop', stop), button(document, 'close', () => pip?.close())); renderChild(); }
const selector = document.getElementById('lang'); selector.value = lang; selector.addEventListener('change', () => { lang = selector.value; render(); });
observe(window, 'main'); window.addEventListener('pagehide', () => { stop(); pip?.close(); }); render();
