/**
 * Settings HTML overlay.
 *
 * Row-per-setting layout rendered as DOM so labels and values stay crisp
 * at all resolutions. Phaser scene still owns audio toggling, i18n
 * switching, and the reset-all-data flow — the overlay only displays
 * current values and routes clicks back to the scene.
 */

import {
  ensureFrameStyle,
  buildFrameHtml,
  ensureStyle,
  escapeHtml as esc,
  clearPriorRoots,
  fitStageToCanvas,
  wrapUnmount,
} from './overlayBase';

export interface SettingsRow {
  readonly label: string;
  readonly value: string;
  readonly onCycle: () => string;
}

export interface SettingsOverlayOptions {
  readonly title: string;
  readonly rows: readonly SettingsRow[];
  readonly debugRows: readonly SettingsRow[];
  readonly recommendedResolution: string;
  readonly resetLabel: string;
  readonly resetConfirmLabel: string;
  readonly onReset: () => void;
  readonly backLabel: string;
  readonly onBack: () => void;
}

const ROOT_CLASS = 'soul-strike-settings-overlay';
const STYLE_ID = 'soul-strike-settings-overlay-style';

const CSS = `
.${ROOT_CLASS}{
  position:fixed;inset:0;z-index:100;
  color:#e8ecf2;font-family:'Rajdhani',system-ui,sans-serif;
  pointer-events:none;opacity:0;transition:opacity 220ms ease;
  background:transparent;overflow:hidden;
}
.${ROOT_CLASS}.visible{opacity:1;pointer-events:auto}
.${ROOT_CLASS} .stage{
  width:1280px;height:720px;
  position:absolute;left:50%;top:50%;
  transform:translate(-50%,-50%);
}
.${ROOT_CLASS} .title{
  position:absolute;left:50%;top:28px;transform:translateX(-50%);
  font-family:'Bebas Neue',sans-serif;font-size:44px;letter-spacing:.06em;color:#fff;
  line-height:1;margin:0;padding:0;
}
.${ROOT_CLASS} .panel{
  position:absolute;left:50%;top:100px;transform:translateX(-50%);
  width:742px;max-height:540px;padding:20px 40px 28px;
  overflow-y:auto;
  background:rgba(10,10,16,.55);
  border:1px solid rgba(174,234,255,.18);
  scrollbar-width:thin;scrollbar-color:rgba(174,234,255,.35) rgba(10,10,16,.4);
}
.${ROOT_CLASS} .panel::-webkit-scrollbar{width:8px}
.${ROOT_CLASS} .panel::-webkit-scrollbar-track{background:rgba(10,10,16,.4)}
.${ROOT_CLASS} .panel::-webkit-scrollbar-thumb{background:rgba(174,234,255,.35);border-radius:3px}
.${ROOT_CLASS} .panel::-webkit-scrollbar-thumb:hover{background:rgba(174,234,255,.55)}
.${ROOT_CLASS} .section-title{
  font-family:'Bebas Neue',sans-serif;font-size:18px;letter-spacing:.16em;
  color:#ffd94a;margin:6px 4px 8px;text-transform:uppercase;
}
.${ROOT_CLASS} .shortcut-row{
  display:flex;align-items:baseline;gap:16px;
  padding:6px 10px;
  font-size:16px;letter-spacing:.06em;color:#cfd8e4;
}
.${ROOT_CLASS} .shortcut-row .key{
  flex:0 0 auto;min-width:170px;
  font-family:'Rajdhani',sans-serif;font-weight:500;color:#aeeaff;
}
.${ROOT_CLASS} .shortcut-row .desc{color:#cfd8e4}
.${ROOT_CLASS} .shortcut-group-label{
  margin:12px 4px 4px;
  font-size:13px;letter-spacing:.2em;color:#8da0ba;text-transform:uppercase;
}
.${ROOT_CLASS} .row{
  display:flex;align-items:center;justify-content:space-between;
  padding:8px 10px;
}
.${ROOT_CLASS} .row .label{
  font-size:16px;letter-spacing:.08em;color:#cfd8e4;
}
.${ROOT_CLASS} .row .val{
  min-width:150px;height:36px;padding:0 16px;
  display:flex;align-items:center;justify-content:center;
  background:rgba(58,58,85,.4);
  border:1px solid rgba(174,234,255,.35);
  font-family:'Rajdhani',sans-serif;font-size:16px;letter-spacing:.08em;color:#fff;
  cursor:pointer;transition:all .15s;
}
.${ROOT_CLASS} .row .val:hover{background:rgba(85,85,119,.6);border-color:#5aaaff}
.${ROOT_CLASS} .row .val.readonly{cursor:default;opacity:.7;background:transparent;border:none}
.${ROOT_CLASS} .divider{
  height:1px;background:rgba(174,234,255,.18);margin:14px 0;
}
.${ROOT_CLASS} .reset{
  display:block;margin:0 auto;width:280px;height:40px;
  font-family:'Bebas Neue',sans-serif;font-size:20px;letter-spacing:.12em;color:#ff4444;
  background:rgba(255,68,68,.08);border:1px solid #ff4444;
  cursor:pointer;transition:background .15s;
}
.${ROOT_CLASS} .reset:hover{background:rgba(255,68,68,.25)}
.${ROOT_CLASS} .back{
  position:absolute;left:40px;bottom:30px;
  width:120px;height:36px;
  font-family:'Bebas Neue',sans-serif;font-size:16px;letter-spacing:.12em;color:#fff;
  background:rgba(58,58,85,.3);border:1px solid rgba(174,234,255,.3);
  cursor:pointer;transition:background .15s;
}
.${ROOT_CLASS} .back:hover{background:rgba(85,85,119,.6)}
`;

export function mountSettingsOverlay(opts: SettingsOverlayOptions): () => void {
  ensureFrameStyle();
  ensureStyle(STYLE_ID, CSS);
  clearPriorRoots(ROOT_CLASS);

  const root = document.createElement('div');
  root.className = ROOT_CLASS;

  const rowHtml = opts.rows
    .map(
      (r, i) => `
      <div class="row" data-idx="${i}">
        <div class="label">${esc(r.label)}</div>
        <div class="val" data-role="cycle" data-idx="${i}">${esc(r.value)}</div>
      </div>`,
    )
    .join('');

  root.innerHTML = `
    <div class="stage ss-stage">
      ${buildFrameHtml({
        tagLeft: '<b>SS</b>-<b>099</b> / SYSTEM <span class="bar"></span> CONFIG',
        tagRight: 'USER PREFERENCES <span class="bar"></span> <b>ACTIVE</b>',
      })}
      <div class="title">${esc(opts.title)}</div>
      <div class="panel">
        <div class="row"><div class="label">Recommended</div><div class="val readonly">${esc(opts.recommendedResolution)}</div></div>
        ${rowHtml}
        <div class="divider"></div>
        <div class="section-title">Shortcuts</div>
        <div class="shortcut-group-label">Global</div>
        <div class="shortcut-row"><div class="key">R</div><div class="desc">Return to Title (any scene)</div></div>
        <div class="shortcut-row"><div class="key">ESC</div><div class="desc">Return to Title (menus)</div></div>
        <div class="shortcut-group-label">Title</div>
        <div class="shortcut-row"><div class="key">SPACE</div><div class="desc">Start game</div></div>
        <div class="shortcut-group-label">Character Select</div>
        <div class="shortcut-row"><div class="key">← →</div><div class="desc">Browse characters</div></div>
        <div class="shortcut-row"><div class="key">ENTER / SPACE</div><div class="desc">Confirm selection</div></div>
        <div class="shortcut-group-label">Build</div>
        <div class="shortcut-row"><div class="key">1 – 5</div><div class="desc">Buy shop item</div></div>
        <div class="shortcut-row"><div class="key">SPACE</div><div class="desc">Enter battle</div></div>
        <div class="shortcut-group-label">Battle</div>
        <div class="shortcut-row"><div class="key">SPACE / Click</div><div class="desc">Fire SOUL STRIKE</div></div>
        <div class="shortcut-row"><div class="key">S</div><div class="desc">Cycle battle speed</div></div>
        <div class="shortcut-group-label">Result / Game Over</div>
        <div class="shortcut-row"><div class="key">SPACE</div><div class="desc">Continue / Restart</div></div>
        ${opts.debugRows.length > 0 ? `
        <div class="divider"></div>
        ${opts.debugRows
          .map(
            (r, i) => `
        <div class="row" data-debug-idx="${i}">
          <div class="label">${esc(r.label)}</div>
          <div class="val" data-role="debug" data-debug-idx="${i}">${esc(r.value)}</div>
        </div>`,
          )
          .join('')}` : ''}
        <div class="divider"></div>
        <button class="reset" data-role="reset">${esc(opts.resetLabel)}</button>
      </div>
      <button class="back" data-role="back">${esc(opts.backLabel)}</button>
    </div>
  `;

  document.body.appendChild(root);

  const stage = root.querySelector('.stage') as HTMLElement;
  const disposeFit = fitStageToCanvas(stage);

  // Wire rows
  root.querySelectorAll<HTMLElement>('[data-role="cycle"]').forEach((el) => {
    el.addEventListener('click', () => {
      const idx = Number(el.getAttribute('data-idx'));
      const next = opts.rows[idx]!.onCycle();
      el.textContent = next;
    });
  });

  // Debug rows
  root.querySelectorAll<HTMLElement>('[data-role="debug"]').forEach((el) => {
    el.addEventListener('click', () => {
      const idx = Number(el.getAttribute('data-debug-idx'));
      const next = opts.debugRows[idx]!.onCycle();
      el.textContent = next;
    });
  });

  // Reset button (two-step confirm)
  const resetBtn = root.querySelector('[data-role="reset"]') as HTMLElement | null;
  let confirmPending = false;
  let confirmTimer: number | null = null;
  resetBtn?.addEventListener('click', () => {
    if (!confirmPending) {
      confirmPending = true;
      resetBtn.textContent = opts.resetConfirmLabel;
      resetBtn.style.color = '#ff8800';
      confirmTimer = window.setTimeout(() => {
        confirmPending = false;
        resetBtn.textContent = opts.resetLabel;
        resetBtn.style.color = '#ff4444';
      }, 3000);
    } else {
      if (confirmTimer) clearTimeout(confirmTimer);
      opts.onReset();
    }
  });

  // Back button
  const backBtn = root.querySelector('[data-role="back"]') as HTMLElement | null;
  backBtn?.addEventListener('click', () => opts.onBack());

  requestAnimationFrame(() => root.classList.add('visible'));

  return wrapUnmount(root, () => {
    disposeFit();
    if (confirmTimer) clearTimeout(confirmTimer);
  });
}
