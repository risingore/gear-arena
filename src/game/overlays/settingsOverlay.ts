/**
 * Settings HTML overlay.
 *
 * Row-per-setting layout rendered as DOM so labels and values stay crisp
 * at all resolutions. Phaser scene still owns audio toggling, i18n
 * switching, and the reset-all-data flow — the overlay only displays
 * current values and routes clicks back to the scene.
 */

import { ensureFrameStyle, buildFrameHtml } from './overlayBase';

export interface SettingsRow {
  readonly label: string;
  readonly value: string;
  readonly onCycle: () => string;
}

export interface SettingsOverlayOptions {
  readonly title: string;
  readonly rows: readonly SettingsRow[];
  readonly debugRow: SettingsRow;
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
}
.${ROOT_CLASS} .panel{
  position:absolute;left:50%;top:100px;transform:translateX(-50%);
  width:600px;padding:20px 40px 28px;
  background:rgba(10,10,16,.55);
  border:1px solid rgba(174,234,255,.18);
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

function ensureStyle(): void {
  if (document.getElementById(STYLE_ID)) return;
  const style = document.createElement('style');
  style.id = STYLE_ID;
  style.textContent = CSS;
  document.head.appendChild(style);
}

function esc(s: string): string {
  return s.replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c] ?? c));
}

export function mountSettingsOverlay(opts: SettingsOverlayOptions): () => void {
  ensureFrameStyle();
  ensureStyle();

  document.querySelectorAll(`.${ROOT_CLASS}`).forEach((el) => el.remove());

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
        ${rowHtml}
        <div class="row"><div class="label">Recommended</div><div class="val readonly">${esc(opts.recommendedResolution)}</div></div>
        <div class="divider"></div>
        <div class="row">
          <div class="label">${esc(opts.debugRow.label)}</div>
          <div class="val" data-role="debug">${esc(opts.debugRow.value)}</div>
        </div>
        <div class="divider"></div>
        <button class="reset" data-role="reset">${esc(opts.resetLabel)}</button>
      </div>
      <button class="back" data-role="back">${esc(opts.backLabel)}</button>
    </div>
  `;

  document.body.appendChild(root);

  // Fit stage to canvas
  const fit = (): void => {
    const stage = root.querySelector('.stage') as HTMLElement | null;
    const canvas = document.querySelector('#game-container canvas') as HTMLCanvasElement | null;
    if (!stage || !canvas) return;
    const rect = canvas.getBoundingClientRect();
    const s = Math.min(rect.width / 1280, rect.height / 720);
    stage.style.left = `${rect.left + rect.width / 2}px`;
    stage.style.top = `${rect.top + rect.height / 2}px`;
    stage.style.transform = `translate(-50%, -50%) scale(${s})`;
  };
  window.addEventListener('resize', fit);
  let ro: ResizeObserver | null = null;
  const canvasEl = document.querySelector('#game-container canvas');
  if (canvasEl && typeof ResizeObserver !== 'undefined') {
    ro = new ResizeObserver(() => fit());
    ro.observe(canvasEl);
  }
  fit();

  // Wire rows
  root.querySelectorAll<HTMLElement>('[data-role="cycle"]').forEach((el) => {
    el.addEventListener('click', () => {
      const idx = Number(el.getAttribute('data-idx'));
      const next = opts.rows[idx]!.onCycle();
      el.textContent = next;
    });
  });

  // Debug row
  const debugBtn = root.querySelector('[data-role="debug"]') as HTMLElement | null;
  debugBtn?.addEventListener('click', () => {
    const next = opts.debugRow.onCycle();
    debugBtn.textContent = next;
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

  return (): void => {
    root.classList.remove('visible');
    window.removeEventListener('resize', fit);
    if (ro) ro.disconnect();
    if (confirmTimer) clearTimeout(confirmTimer);
    window.setTimeout(() => {
      if (root.parentNode) root.parentNode.removeChild(root);
    }, 240);
  };
}
