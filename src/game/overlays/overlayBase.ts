/**
 * Shared overlay plumbing.
 *
 * Every DOM overlay in this project (Title / Settings / GameOver / ED /
 * Mandala / Select / Result) implements the same four patterns:
 *
 *   1. Inject a <style> block once per load.
 *   2. Remove any prior overlay with the same class so a rapid
 *      scene-loop cannot leave two roots intercepting clicks during
 *      the 240 ms fade-out.
 *   3. Mount the root, fade it in on the next RAF tick, and track the
 *      Phaser canvas bounding box via `ResizeObserver + window resize`
 *      to keep the 1280×720 stage pixel-perfect on any DPR / aspect.
 *   4. Fade out + detach on unmount, with a 240 ms grace period for
 *      the CSS transition to visually complete.
 *
 * Extracting these keeps the overlay files focused on their unique
 * markup + behavior. New overlays should use `ensureStyle` +
 * `fitStageToCanvas` + `wrapUnmount` rather than reimplementing them.
 */

/**
 * Escape HTML entities for safe interpolation into innerHTML strings.
 */
export function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c] ?? c));
}

/**
 * Inject a <style> tag once. Subsequent calls are no-ops.
 */
export function ensureStyle(id: string, css: string): void {
  if (document.getElementById(id)) return;
  const style = document.createElement('style');
  style.id = id;
  style.textContent = css;
  document.head.appendChild(style);
}

/**
 * Remove every element matching the root class. Call at the top of
 * every mount function before appending the new root.
 */
export function clearPriorRoots(rootClass: string): void {
  document.querySelectorAll(`.${rootClass}`).forEach((el) => el.remove());
}

/**
 * Keep `stage` visually centered on the Phaser canvas, scaled so the
 * 1280×720 design space fills as much of the canvas as possible.
 * Returns a disposer that removes the listeners and ResizeObserver.
 *
 * The stage element is expected to have:
 *   position: absolute;
 *   transform-origin: center center;
 * so the transform below can set its center + scale directly.
 */
export function fitStageToCanvas(stage: HTMLElement): () => void {
  const canvas = document.querySelector(
    '#game-container canvas',
  ) as HTMLCanvasElement | null;

  const fit = (): void => {
    const rect = canvas?.getBoundingClientRect();
    const w = rect && rect.width > 0 ? rect.width : window.innerWidth;
    const h = rect && rect.height > 0 ? rect.height : window.innerHeight;
    const cx = rect ? rect.left + w / 2 : window.innerWidth / 2;
    const cy = rect ? rect.top + h / 2 : window.innerHeight / 2;
    const s = Math.min(w / 1280, h / 720);
    stage.style.left = `${cx}px`;
    stage.style.top = `${cy}px`;
    stage.style.transform = `translate(-50%, -50%) scale(${s})`;
  };

  window.addEventListener('resize', fit);
  let ro: ResizeObserver | null = null;
  if (canvas && typeof ResizeObserver !== 'undefined') {
    ro = new ResizeObserver(() => fit());
    ro.observe(canvas);
  }
  fit();

  return (): void => {
    window.removeEventListener('resize', fit);
    if (ro) ro.disconnect();
  };
}

/**
 * Wrap an unmount callback so the root fades out via CSS (remove the
 * `.visible` class) and is detached from the DOM after `delayMs`,
 * which should match the overlay's opacity transition duration.
 */
export function wrapUnmount(
  root: HTMLElement,
  disposeListeners: () => void,
  delayMs = 240,
): () => void {
  return (): void => {
    root.classList.remove('visible');
    disposeListeners();
    window.setTimeout(() => {
      if (root.parentNode) root.parentNode.removeChild(root);
    }, delayMs);
  };
}

/*
 * Shared Title-matching screen frame.
 *
 * Injects a single global stylesheet exposing:
 *   .ss-stage        radial BG + CRT scanlines + glitch tear
 *   .ss-frame-grid   40px cyan grid with radial mask
 *   .ss-frame-vignette radial edge darkening
 *   .ss-frame-bracket.tl|tr|bl|br  corner L-marks
 *   .ss-frame-tag.tl|tr            SS-number tags
 *   .ss-primary / .ss-secondary / .ss-danger  chamfer buttons (Bebas Neue)
 *   .ss-panel        dark chamfer container
 *
 * Overlays call `ensureFrameStyle()` in mount, add `ss-stage` to their
 * 1280×720 stage, then inject `buildFrameHtml({tagLeft, tagRight})` at
 * the top of the stage's inner HTML. Content z-indices must sit above
 * the scanline overlay (z 99) to remain readable.
 */

const FRAME_STYLE_ID = 'soul-strike-frame-style';

const FRAME_CSS = `
.ss-stage{
  background:radial-gradient(60% 45% at 50% 42%,#142040 0%,#0a0a10 55%,#05060a 100%);
}
.ss-stage::after{
  content:'';position:absolute;inset:0;pointer-events:none !important;z-index:99;
  background:repeating-linear-gradient(0deg,
    transparent 0,transparent 2px,
    rgba(174,234,255,.035) 3px,transparent 4px);
  opacity:.7;mix-blend-mode:overlay;
  animation:ss-scanline 2.4s steps(40) infinite;
}
@keyframes ss-scanline{from{background-position:0 0}to{background-position:0 4px}}
.ss-stage::before{
  content:'';position:absolute;inset:-4px;pointer-events:none;z-index:98;
  background:linear-gradient(90deg,transparent 0%,rgba(255,122,0,.18) 48%,rgba(174,234,255,.22) 52%,transparent 100%);
  opacity:0;
  animation:ss-glitch-tear 7.3s ease-in infinite;
}
@keyframes ss-glitch-tear{
  0%,88%,100%{opacity:0;transform:translate(0,0) skewX(0deg)}
  89%{opacity:.85;transform:translate(3px,18px) skewX(-2deg)}
  91%{opacity:.55;transform:translate(-5px,-22px) skewX(3deg)}
  93%{opacity:.75;transform:translate(2px,9px) skewX(-1deg)}
  95%{opacity:0;transform:translate(0,0) skewX(0deg)}
}
.ss-frame-grid{position:absolute;inset:0;pointer-events:none;z-index:1;
  background-image:linear-gradient(rgba(174,234,255,.05) 1px,transparent 1px),linear-gradient(90deg,rgba(174,234,255,.05) 1px,transparent 1px);
  background-size:40px 40px;
  -webkit-mask-image:radial-gradient(70% 60% at 50% 50%,#000 30%,transparent 95%);
          mask-image:radial-gradient(70% 60% at 50% 50%,#000 30%,transparent 95%);
}
.ss-frame-vignette{position:absolute;inset:0;pointer-events:none;z-index:1;
  background:radial-gradient(60% 55% at 50% 50%,transparent 0%,rgba(0,0,0,.55) 100%);
}
.ss-frame-bracket{position:absolute;width:22px;height:22px;border:1.5px solid #aeeaff;opacity:.5;pointer-events:none;z-index:2}
.ss-frame-bracket.tl{top:14px;left:14px;border-right:none;border-bottom:none}
.ss-frame-bracket.tr{top:14px;right:14px;border-left:none;border-bottom:none}
.ss-frame-bracket.bl{bottom:14px;left:14px;border-right:none;border-top:none}
.ss-frame-bracket.br{bottom:14px;right:14px;border-left:none;border-top:none}
.ss-frame-tag{position:absolute;font-size:11px;letter-spacing:.28em;color:#aeeaff;opacity:.75;text-transform:uppercase;font-variant-numeric:tabular-nums;pointer-events:none;z-index:2}
.ss-frame-tag.tl{top:18px;left:22px}
.ss-frame-tag.tr{top:18px;right:22px}
.ss-frame-tag b{color:#ff7a00}
.ss-frame-tag .bar{display:inline-block;width:36px;height:2px;background:#ff7a00;vertical-align:middle;margin:0 6px}
.ss-primary{
  min-width:220px;height:56px;padding:0 28px;
  display:inline-flex;align-items:center;justify-content:center;gap:16px;
  background:linear-gradient(90deg,rgba(255,122,0,.22),rgba(255,122,0,.04));
  border:1px solid #ff7a00;border-left:3px solid #ff7a00;
  filter:drop-shadow(0 0 10px rgba(255,122,0,.45));
  clip-path:polygon(0 0,calc(100% - 14px) 0,100% 14px,100% 100%,14px 100%,0 calc(100% - 14px));
  cursor:pointer;transition:all .15s ease;
  font-family:'Bebas Neue',sans-serif;font-size:28px;letter-spacing:.1em;color:#fff;text-shadow:0 0 10px rgba(255,122,0,.55);
}
.ss-primary:hover{background:linear-gradient(90deg,#ff7a00,rgba(255,122,0,.55));color:#0a0a10;text-shadow:none;filter:drop-shadow(0 0 14px rgba(255,122,0,.7))}
.ss-primary.disabled,.ss-primary:disabled{opacity:.4;cursor:not-allowed;filter:none;pointer-events:none}
.ss-secondary{
  min-width:180px;height:44px;padding:0 22px;
  display:inline-flex;align-items:center;justify-content:center;gap:12px;
  background:linear-gradient(90deg,rgba(174,234,255,.18),rgba(174,234,255,.03));
  border:1px solid rgba(174,234,255,.35);border-left:3px solid rgba(174,234,255,.6);
  filter:drop-shadow(0 0 8px rgba(174,234,255,.2));
  clip-path:polygon(0 0,calc(100% - 10px) 0,100% 10px,100% 100%,10px 100%,0 calc(100% - 10px));
  cursor:pointer;transition:all .15s ease;
  font-family:'Bebas Neue',sans-serif;font-size:20px;letter-spacing:.1em;color:#cfd8e4;
}
.ss-secondary:hover{background:linear-gradient(90deg,#3a7fbf,#1f4d80);border-color:#5aaaff;filter:drop-shadow(0 0 12px rgba(90,170,255,.55));color:#eaf6ff;text-shadow:0 0 8px rgba(174,234,255,.4)}
.ss-secondary.active{background:linear-gradient(90deg,#ff7a00,rgba(255,122,0,.35));border-color:#ff7a00;color:#fff;text-shadow:0 0 6px rgba(255,122,0,.5);filter:drop-shadow(0 0 12px rgba(255,122,0,.45))}
.ss-danger{
  min-width:180px;height:44px;padding:0 22px;
  display:inline-flex;align-items:center;justify-content:center;gap:12px;
  background:linear-gradient(90deg,rgba(255,60,60,.18),rgba(255,60,60,.03));
  border:1px solid rgba(255,60,60,.45);border-left:3px solid rgba(255,60,60,.7);
  filter:drop-shadow(0 0 8px rgba(255,60,60,.2));
  clip-path:polygon(0 0,calc(100% - 10px) 0,100% 10px,100% 100%,10px 100%,0 calc(100% - 10px));
  cursor:pointer;transition:all .15s ease;
  font-family:'Bebas Neue',sans-serif;font-size:20px;letter-spacing:.1em;color:#ff9a9a;
}
.ss-danger:hover{background:linear-gradient(90deg,#ff3a3a,#a02020);color:#fff;text-shadow:0 0 8px rgba(255,80,80,.5);filter:drop-shadow(0 0 12px rgba(255,80,80,.5))}
.ss-panel{
  background:rgba(10,10,16,.72);
  border:1px solid rgba(174,234,255,.18);
  filter:drop-shadow(0 0 16px rgba(10,10,16,.6));
  clip-path:polygon(0 0,calc(100% - 14px) 0,100% 14px,100% 100%,14px 100%,0 calc(100% - 14px));
}
.ss-panel-accent{
  background:linear-gradient(180deg,rgba(20,30,64,.8),rgba(10,10,16,.8));
  border:1px solid rgba(255,122,0,.4);
  filter:drop-shadow(0 0 14px rgba(255,122,0,.18));
  clip-path:polygon(0 0,calc(100% - 14px) 0,100% 14px,100% 100%,14px 100%,0 calc(100% - 14px));
}
.ss-title{font-family:'Bebas Neue',sans-serif;color:#fff;letter-spacing:.04em;text-shadow:0 0 24px rgba(174,234,255,.25)}
.ss-title-accent{color:#ff7a00;text-shadow:0 0 28px rgba(255,122,0,.5)}
`;

/** Inject the shared Title-style frame CSS once per document. */
export function ensureFrameStyle(): void {
  if (document.getElementById(FRAME_STYLE_ID)) return;
  const style = document.createElement('style');
  style.id = FRAME_STYLE_ID;
  style.textContent = FRAME_CSS;
  document.head.appendChild(style);
}

export interface FrameOptions {
  /** HTML content for the top-left tag (use `<b>` for orange, `<span class="bar"></span>` for the divider). */
  tagLeft?: string;
  /** HTML content for the top-right tag. */
  tagRight?: string;
  showGrid?: boolean;
  showVignette?: boolean;
  showBrackets?: boolean;
}

const FRAME_ONLY_ROOT = 'soul-strike-frame-only';

/**
 * Mount a thin DOM overlay that provides only the Title-style frame
 * decorations (brackets / SS-tags / grid / vignette / scanlines / glitch).
 * Intended for Phaser scenes not yet migrated to DOM (Collection, Credits)
 * so they can still share the project's visual identity.
 */
export function mountFrameOverlay(opts: FrameOptions = {}): () => void {
  ensureFrameStyle();

  const STYLE_ID = 'soul-strike-frame-only-style';
  if (!document.getElementById(STYLE_ID)) {
    const style = document.createElement('style');
    style.id = STYLE_ID;
    style.textContent = `
.${FRAME_ONLY_ROOT}{
  position:fixed;inset:0;z-index:60;pointer-events:none;
  opacity:0;transition:opacity 220ms ease;
}
.${FRAME_ONLY_ROOT}.visible{opacity:1}
.${FRAME_ONLY_ROOT} .stage{
  width:1280px;height:720px;position:absolute;left:50%;top:50%;
  transform:translate(-50%,-50%);
  pointer-events:none;background:transparent;overflow:hidden;
}
`;
    document.head.appendChild(style);
  }

  document.querySelectorAll(`.${FRAME_ONLY_ROOT}`).forEach((el) => el.remove());

  const root = document.createElement('div');
  root.className = FRAME_ONLY_ROOT;
  root.innerHTML = `<div class="stage ss-stage" style="background:transparent">${buildFrameHtml(opts)}</div>`;
  document.body.appendChild(root);

  const stage = root.querySelector('.stage') as HTMLElement;
  const disposeFit = fitStageToCanvas(stage);
  requestAnimationFrame(() => root.classList.add('visible'));

  return wrapUnmount(root, disposeFit);
}

/** Build the shared frame decor HTML. Insert at the top of a `.ss-stage`. */
export function buildFrameHtml(opts: FrameOptions = {}): string {
  const parts: string[] = [];
  if (opts.showGrid !== false) parts.push('<div class="ss-frame-grid"></div>');
  if (opts.showVignette !== false) parts.push('<div class="ss-frame-vignette"></div>');
  if (opts.showBrackets !== false) {
    parts.push('<div class="ss-frame-bracket tl"></div>');
    parts.push('<div class="ss-frame-bracket tr"></div>');
    parts.push('<div class="ss-frame-bracket bl"></div>');
    parts.push('<div class="ss-frame-bracket br"></div>');
  }
  if (opts.tagLeft) parts.push(`<div class="ss-frame-tag tl">${opts.tagLeft}</div>`);
  if (opts.tagRight) parts.push(`<div class="ss-frame-tag tr">${opts.tagRight}</div>`);
  return parts.join('');
}
