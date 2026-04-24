/**
 * Ending scroll overlay.
 *
 * Long vertical credits roll shown after the final victory. Mounts on top
 * of the Result scene once the victory celebration has played for a few
 * seconds. Scrolls continuously from bottom to top, passing through
 * credits (one line each to stretch the runtime), a HYAKKI YAKOU tease
 * panel, and a final SOUL BREAKER to-be-continued reveal. A "Return to
 * Title" button fades in once the scroll reaches the end.
 *
 * Rendered as DOM so typography stays razor-sharp at every resolution.
 */

import {
  ensureFrameStyle,
  ensureStyle,
  clearPriorRoots,
  fitStageToCanvas,
  wrapUnmount,
} from './overlayBase';
import { CREDITS } from '../systems/credits';

export interface EndingScrollOverlayOptions {
  readonly returnLabel: string;
  readonly onReturn: () => void;
  /** Pixels per second. Default ~28 (slow, cinematic). */
  readonly scrollSpeed?: number;
  /**
   * Render a small SKIP button that jumps straight back to Title. Shown
   * only on repeat viewings so first-time players see the full sequence.
   */
  readonly showSkip?: boolean;
}

const ROOT_CLASS = 'soul-strike-ending-scroll-overlay';
const STYLE_ID = 'soul-strike-ending-scroll-style';
const VIEW_H = 720;

/**
 * Flatten the canonical CREDITS sections into a per-line array for the
 * scrolling roll. Each section becomes: blank, heading, line, line...,
 * so the scroll cadence naturally spaces groups apart.
 */
const CREDITS_LINES: readonly string[] = (() => {
  const out: string[] = ['— SOUL STRIKE —', '', ''];
  CREDITS.forEach((section) => {
    out.push(section.heading);
    section.lines.forEach((line) => out.push(line));
    out.push('');
    out.push('');
  });
  out.push('');
  return out;
})();

const CSS = `
.${ROOT_CLASS}{
  position:fixed;inset:0;z-index:115;
  background:#000;opacity:0;transition:opacity 800ms ease;
  pointer-events:none;overflow:hidden;
  color:#e8ecf2;font-family:'Rajdhani',system-ui,sans-serif;
}
.${ROOT_CLASS}.visible{opacity:1;pointer-events:auto}
.${ROOT_CLASS} .stage{
  position:absolute;left:50%;top:50%;
  transform:translate(-50%,-50%);
  width:1280px;height:${VIEW_H}px;
  overflow:hidden;
}
.${ROOT_CLASS} .scroll{
  position:absolute;left:0;right:0;top:${VIEW_H}px;
  display:flex;flex-direction:column;align-items:center;
  gap:0;padding:0 40px;
  will-change:transform;
}
.${ROOT_CLASS} .line{
  min-height:36px;display:flex;align-items:center;justify-content:center;
  font-size:18px;letter-spacing:.18em;color:#cfd8e4;
  text-transform:uppercase;
}
.${ROOT_CLASS} .line.blank{min-height:24px}
.${ROOT_CLASS} .heading{
  margin-top:40px;font-family:'Bebas Neue',sans-serif;
  font-size:28px;letter-spacing:.28em;color:#ffd94a;
}
.${ROOT_CLASS} .spacer-large{height:160px}
.${ROOT_CLASS} .spacer-xl{height:280px}
.${ROOT_CLASS} .yakou{
  display:flex;flex-direction:column;align-items:center;gap:14px;
  margin:80px 0;
}
.${ROOT_CLASS} .yakou .kanji{
  font-family:'Noto Serif JP','Yu Mincho',serif;
  font-size:120px;letter-spacing:.08em;color:#ff4444;
  text-shadow:0 0 24px rgba(255,68,68,.55), 0 2px 0 #000;
}
.${ROOT_CLASS} .yakou .roman{
  font-family:'Bebas Neue',sans-serif;font-size:40px;
  letter-spacing:.32em;color:#ff7a00;
}
.${ROOT_CLASS} .yakou .sub{
  font-size:14px;letter-spacing:.22em;color:#8da0ba;
  font-style:italic;max-width:640px;text-align:center;line-height:1.8;
}
.${ROOT_CLASS} .tbc{
  margin-top:120px;
  font-family:'Rajdhani',sans-serif;font-size:16px;
  letter-spacing:.32em;color:#cfd8e4;text-transform:uppercase;
}
.${ROOT_CLASS} .hero{
  margin-top:28px;
  font-family:'Bebas Neue',sans-serif;font-size:128px;letter-spacing:.04em;
  color:#ff7a00;
  text-shadow:0 0 30px rgba(255,122,0,.55), 0 2px 0 #000;
}
.${ROOT_CLASS} .return-btn{
  margin-top:80px;
  width:260px;height:44px;
  font-family:'Bebas Neue',sans-serif;font-size:20px;letter-spacing:.14em;
  color:#ffd94a;background:rgba(255,217,74,.08);
  border:1px solid #ffd94a;cursor:pointer;
  opacity:0;transition:opacity 600ms ease;pointer-events:none;
}
.${ROOT_CLASS} .return-btn.visible{opacity:1;pointer-events:auto}
.${ROOT_CLASS} .return-btn:hover{background:rgba(255,217,74,.2)}
.${ROOT_CLASS} .skip-btn{
  position:absolute;right:28px;top:28px;
  width:120px;height:34px;
  font-family:'Bebas Neue',sans-serif;font-size:14px;letter-spacing:.18em;
  color:#aeeaff;background:rgba(174,234,255,.08);
  border:1px solid rgba(174,234,255,.45);cursor:pointer;
  transition:background .15s;z-index:3;
}
.${ROOT_CLASS} .skip-btn:hover{background:rgba(174,234,255,.2)}
`;

export function mountEndingScrollOverlay(opts: EndingScrollOverlayOptions): () => void {
  ensureFrameStyle();
  ensureStyle(STYLE_ID, CSS);
  clearPriorRoots(ROOT_CLASS);

  const root = document.createElement('div');
  root.className = ROOT_CLASS;

  const creditsHtml = CREDITS_LINES
    .map((line) => {
      if (line === '') return '<div class="line blank"></div>';
      if (line.startsWith('— ') || line.endsWith(' —'))
        return `<div class="heading">${line}</div>`;
      // Heading detection: all-uppercase short label
      if (line === line.toUpperCase() && line.length < 26 && !line.includes('(')) {
        return `<div class="heading">${line}</div>`;
      }
      return `<div class="line">${line}</div>`;
    })
    .join('');

  root.innerHTML = `
    <div class="stage">
      <div class="scroll">
        ${creditsHtml}
        <div class="spacer-large"></div>
        <div class="yakou">
          <div class="kanji">百鬼夜行</div>
          <div class="roman">HYAKKI YAKOU</div>
          <div class="sub">
            A hundred demons march through the night.<br>
            When the eight fragments scattered, so did the host.<br>
            They are waiting. They are watching.
          </div>
        </div>
        <div class="spacer-large"></div>
        <div class="tbc">To be continued in</div>
        <div class="hero">SOUL BREAKER</div>
        <button class="return-btn" data-role="return">← RETURN TO TITLE</button>
      </div>
    </div>
    ${opts.showSkip ? '<button class="skip-btn" data-role="skip">SKIP →</button>' : ''}
  `;

  document.body.appendChild(root);

  const stage = root.querySelector('.stage') as HTMLElement;
  const disposeFit = fitStageToCanvas(stage);

  const scrollEl = root.querySelector('.scroll') as HTMLElement;
  const returnBtn = root.querySelector('[data-role="return"]') as HTMLElement;
  // Default tuned so the scroll finishes a few seconds before bgm_victory
  // (~158 s) ends, leaving a musical tail on the SOUL BREAKER hero screen.
  // bgm_victory is non-looping — one play covers the whole roll.
  const baseSpeed = opts.scrollSpeed ?? 22;
  let scrollOffset = 0;
  let raf = 0;
  let lastTs = performance.now();
  const scrollStartTime = performance.now() + 800;

  const heroEl = scrollEl.querySelector('.hero') as HTMLElement;

  /**
   * End offset is chosen so the SOUL BREAKER hero element sits at the
   * vertical center of the 720px viewport. Scroll starts with the
   * content's top at stage y=720 and translates up by `scrollOffset`,
   * so for the hero top at offsetTop within the flow to sit at a screen
   * y of `viewportCenter - heroHeight/2`, we need
   *   scrollOffset = 720 + heroOffsetTop + heroHeight/2 - viewportCenter
   *                = 360 + heroOffsetTop + heroHeight/2.
   */
  const computeEndOffset = (): number => {
    const offsetTop = heroEl.offsetTop;
    const h = heroEl.offsetHeight || 128;
    return VIEW_H / 2 + offsetTop + h / 2;
  };

  const tick = (ts: number): void => {
    const dt = Math.min(0.05, (ts - lastTs) / 1000);
    lastTs = ts;
    if (ts >= scrollStartTime) {
      scrollOffset += baseSpeed * dt;
      scrollEl.style.transform = `translateY(${-scrollOffset}px)`;
      const endThreshold = computeEndOffset();
      if (scrollOffset >= endThreshold) {
        scrollOffset = endThreshold;
        scrollEl.style.transform = `translateY(${-scrollOffset}px)`;
        returnBtn.classList.add('visible');
        return;
      }
    }
    raf = requestAnimationFrame(tick);
  };

  raf = requestAnimationFrame((ts) => {
    lastTs = ts;
    tick(ts);
  });

  returnBtn.addEventListener('click', () => opts.onReturn());

  const skipBtn = root.querySelector('[data-role="skip"]') as HTMLElement | null;
  skipBtn?.addEventListener('click', () => opts.onReturn());

  requestAnimationFrame(() => root.classList.add('visible'));

  return wrapUnmount(
    root,
    () => {
      cancelAnimationFrame(raf);
      disposeFit();
    },
    820,
  );
}
