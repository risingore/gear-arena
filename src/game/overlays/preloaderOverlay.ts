/**
 * Preloader (boot) overlay.
 *
 * The very first thing the player sees: a loading screen that speaks the
 * same visual language as Title / Settings / Credits — the shared SS-NNN
 * frame (cyan grid, corner brackets, scanline-free dark radial bg), a
 * Bebas Neue wordmark, and a chamfered orange progress bar driven by
 * Phaser's loader `progress` event (see `scenes/Preloader.ts`).
 *
 * `mountPreloaderOverlay` returns a handle: call `setProgress(0..1)` as
 * assets stream in, then `unmount()` to cross-fade out as the Title
 * overlay fades in.
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

export interface PreloaderOverlayHandle {
  /** Set the bar fill + percentage readout. Input is clamped to 0..1. */
  setProgress(value: number): void;
  /** Fade out and detach (240 ms grace period for the CSS transition). */
  unmount(): void;
}

export interface PreloaderOverlayOptions {
  /** Caption under the bar, e.g. "LOADING". */
  readonly label: string;
}

const ROOT_CLASS = 'soul-strike-preloader-overlay';
const STYLE_ID = 'soul-strike-preloader-overlay-style';
const FADE_MS = 240;

const CSS = `
.${ROOT_CLASS}{
  position:fixed;inset:0;z-index:100;
  color:#e8ecf2;font-family:'Rajdhani',system-ui,sans-serif;
  pointer-events:none;opacity:0;transition:opacity 220ms ease;
  background:#0a0a10;overflow:hidden;
}
.${ROOT_CLASS}.visible{opacity:1}
.${ROOT_CLASS} .stage{
  width:1280px;height:720px;
  position:absolute;left:50%;top:50%;
  transform:translate(-50%,-50%);
}
.${ROOT_CLASS} .wordmark{
  position:absolute;left:50%;top:288px;transform:translateX(-50%);
  font-family:'Bebas Neue',sans-serif;font-size:96px;letter-spacing:.08em;
  line-height:1;margin:0;white-space:nowrap;
  color:#fff;text-shadow:0 0 28px rgba(174,234,255,.25);
}
.${ROOT_CLASS} .wordmark b{font-weight:inherit;color:#ff7a00;text-shadow:0 0 30px rgba(255,122,0,.5)}
.${ROOT_CLASS} .bar-wrap{
  position:absolute;left:50%;top:432px;transform:translateX(-50%);
  width:520px;
}
.${ROOT_CLASS} .bar-track{
  position:relative;width:100%;height:14px;overflow:hidden;
  background:rgba(10,10,16,.8);
  border:1px solid rgba(174,234,255,.35);border-left:3px solid rgba(174,234,255,.6);
  clip-path:polygon(0 0,calc(100% - 8px) 0,100% 8px,100% 100%,8px 100%,0 calc(100% - 8px));
}
.${ROOT_CLASS} .bar-fill{
  position:absolute;left:0;top:0;height:100%;width:0%;
  background:linear-gradient(90deg,rgba(255,122,0,.5),#ff7a00);
  box-shadow:0 0 14px rgba(255,122,0,.6);
  transition:width 180ms ease;
}
.${ROOT_CLASS} .bar-meta{
  display:flex;justify-content:space-between;align-items:baseline;margin-top:11px;
  font-size:13px;letter-spacing:.28em;text-transform:uppercase;color:#aeeaff;opacity:.8;
}
.${ROOT_CLASS} .bar-meta .pct{color:#ff7a00;letter-spacing:.1em;font-variant-numeric:tabular-nums}
`;

export function mountPreloaderOverlay(opts: PreloaderOverlayOptions): PreloaderOverlayHandle {
  ensureFrameStyle();
  ensureStyle(STYLE_ID, CSS);
  clearPriorRoots(ROOT_CLASS);

  const root = document.createElement('div');
  root.className = ROOT_CLASS;
  root.innerHTML = `
    <div class="stage ss-stage">
      ${buildFrameHtml({
        tagLeft: '<b>SS</b>-<b>000</b> / BOOT <span class="bar"></span> SEQUENCE',
        tagRight: 'INITIALIZING <span class="bar"></span> <b>SOUL STRIKE</b>',
      })}
      <div class="wordmark">SOUL <b>STRIKE</b></div>
      <div class="bar-wrap">
        <div class="bar-track"><div class="bar-fill" data-role="fill"></div></div>
        <div class="bar-meta">
          <span>${esc(opts.label)}</span>
          <span class="pct" data-role="pct">0%</span>
        </div>
      </div>
    </div>
  `;
  document.body.appendChild(root);

  const stage = root.querySelector('.stage') as HTMLElement;
  const disposeFit = fitStageToCanvas(stage);
  const fillEl = root.querySelector('[data-role="fill"]') as HTMLElement | null;
  const pctEl = root.querySelector('[data-role="pct"]') as HTMLElement | null;

  requestAnimationFrame(() => root.classList.add('visible'));

  // The loader fires `progress` once per file; consecutive ticks often
  // round to the same percent, so skip the DOM write (and the restart of
  // the bar's width transition) when nothing visible changed.
  let lastPct = -1;

  return {
    setProgress(value: number): void {
      const pct = Math.round(Math.min(1, Math.max(0, value)) * 100);
      if (pct === lastPct) return;
      lastPct = pct;
      if (fillEl) fillEl.style.width = `${pct}%`;
      if (pctEl) pctEl.textContent = `${pct}%`;
    },
    unmount: wrapUnmount(root, disposeFit, FADE_MS),
  };
}
