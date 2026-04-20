/**
 * End-of-campaign ED overlay.
 *
 * Shown on victory after the final boss: "TO BE CONTINUED:" + giant
 * "SOUL BREAKER" reveal. Rendered as DOM so the oversized orange
 * headline stays razor-sharp at all resolutions. Self-dismisses after
 * the hold duration.
 */

import { ensureFrameStyle, buildFrameHtml } from './overlayBase';

export interface EdOverlayOptions {
  continuedLabel?: string;
  heroText?: string;
  holdMs?: number;
  onDismiss?(): void;
}

const ROOT_CLASS = 'soul-strike-ed-overlay';
const STYLE_ID = 'soul-strike-ed-overlay-style';

const CSS = `
.${ROOT_CLASS}{
  position:fixed;inset:0;z-index:110;pointer-events:none;
  background:rgba(0,0,0,0);transition:background 400ms ease;
}
.${ROOT_CLASS}.active{background:rgba(0,0,0,.9)}
.${ROOT_CLASS} .stage{
  position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);
  width:1280px;height:720px;
  display:flex;flex-direction:column;align-items:center;justify-content:center;
  gap:26px;
}
.${ROOT_CLASS} .continued{
  opacity:0;transition:opacity 400ms ease;
  font-family:'Rajdhani',sans-serif;font-weight:500;font-size:16px;
  letter-spacing:.32em;color:#cfd8e4;text-transform:uppercase;
}
.${ROOT_CLASS} .hero{
  opacity:0;transform:scale(1.1);transition:opacity 700ms ease, transform 700ms cubic-bezier(.2,.9,.25,1.15);
  font-family:'Bebas Neue',sans-serif;font-size:128px;letter-spacing:.04em;
  color:#ff7a00;
  text-shadow:0 0 30px rgba(255,122,0,.55), 0 2px 0 #000;
}
.${ROOT_CLASS} .credits{
  opacity:0;transition:opacity 600ms ease;
  margin-top:28px;text-align:center;
  font-family:'Rajdhani',sans-serif;font-size:11px;letter-spacing:.26em;
  color:#6a7687;line-height:1.8;text-transform:uppercase;
}
.${ROOT_CLASS} .credits b{color:#aeeaff;font-weight:500}
.${ROOT_CLASS}.active .continued{opacity:1;transition-delay:300ms}
.${ROOT_CLASS}.active .hero{opacity:1;transform:scale(1);transition-delay:600ms}
.${ROOT_CLASS}.active .credits{opacity:.9;transition-delay:1500ms}
`;

function ensureStyle(): void {
  if (document.getElementById(STYLE_ID)) return;
  const style = document.createElement('style');
  style.id = STYLE_ID;
  style.textContent = CSS;
  document.head.appendChild(style);
}

export function mountEdOverlay(opts: EdOverlayOptions = {}): () => void {
  ensureStyle();

  document.querySelectorAll(`.${ROOT_CLASS}`).forEach((el) => el.remove());

  const root = document.createElement('div');
  root.className = ROOT_CLASS;
  ensureFrameStyle();
  root.innerHTML = `
    <div class="stage">
      ${buildFrameHtml({
        tagLeft: '<b>SS</b>-<b>???</b> / EPILOGUE <span class="bar"></span> TRANSMISSION',
        tagRight: 'SIGNAL <span class="bar"></span> <b>LOST</b>',
        showGrid: false,
        showVignette: false,
      })}
      <div class="continued">${opts.continuedLabel ?? 'TO BE CONTINUED:'}</div>
      <div class="hero">${opts.heroText ?? 'SOUL BREAKER'}</div>
      <div class="credits">
        <b>SOUL STRIKE</b> — GAMEDEV.JS JAM 2026 · THEME MACHINES<br/>
        PHASER 4 · TYPESCRIPT · VITE · BUN
      </div>
    </div>
  `;
  document.body.appendChild(root);

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

  requestAnimationFrame(() => root.classList.add('active'));

  const holdMs = opts.holdMs ?? 3500;
  const dismissTimer = window.setTimeout(() => {
    root.classList.remove('active');
    window.setTimeout(() => {
      if (root.parentNode) root.parentNode.removeChild(root);
      opts.onDismiss?.();
    }, 400);
  }, holdMs);

  return (): void => {
    window.clearTimeout(dismissTimer);
    window.removeEventListener('resize', fit);
    if (ro) ro.disconnect();
    if (root.parentNode) root.parentNode.removeChild(root);
  };
}
