/**
 * Ending scroll overlay.
 *
 * Long vertical credits roll shown after the final victory. Mounts on top
 * of the Result scene once the victory celebration has played for a few
 * seconds.
 *
 * Timeline:
 *   Phase 1 — Epilogue. A fixed six-stanza prose panel fades in stanza
 *             by stanza, holds, then fades out. Lands the INDRA arc and
 *             ends on the words "hundred demons, marching through the
 *             night" so the roll's HYAKKI YAKOU tease reads as the
 *             direct visual continuation.
 *   Phase 2 — Credits roll. Scrolls continuously from bottom to top,
 *             passing through credits, the HYAKKI YAKOU tease panel,
 *             and the final SOUL BREAKER to-be-continued reveal. A
 *             "Return to Title" button fades in once the scroll reaches
 *             the end.
 *
 * Rendered as DOM so typography stays razor-sharp at every resolution.
 */

import {
  ensureFrameStyle,
  ensureStyle,
  clearPriorRoots,
  escapeHtml,
  fitStageToCanvas,
  wrapUnmount,
} from './overlayBase';
import { CREDITS } from '../systems/credits';
import { bl } from '../systems/i18n';
import {
  EASY_ENDING_STANZAS,
  HARD_ENDING_STANZAS,
  HYAKKI_SUB_LINES,
} from '../../data/storyText';

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
 * Epilogue stanzas. Each inner array is one paragraph — they fade in one
 * after another with a staggered delay so the reader's eye lands on each
 * beat before the next arrives. Ending on "a hundred demons, marching
 * through the night." is intentional: the subsequent scroll reveals the
 * oversized 百鬼夜行 kanji, so the last stanza's words are given form.
 *
 * Bilingual content lives in `src/data/storyText.ts` (HARD_ENDING_STANZAS).
 * Resolution to the player's current locale happens at mount time so that
 * a Settings language change before victory is honored.
 */
const resolveStanzas = (
  stanzas: readonly (readonly { en: string; ja: string }[])[],
): readonly (readonly string[])[] =>
  stanzas.map((stanza) => stanza.map((line) => bl(line)));

const EPILOGUE_STANZA_COUNT = HARD_ENDING_STANZAS.length;

const EPILOGUE_STANZA_STAGGER_MS = 4000;
const EPILOGUE_FIRST_STANZA_DELAY_MS = 700;
const EPILOGUE_STANZA_FADE_MS = 1000;
const EPILOGUE_HOLD_MS = 5000;
const EPILOGUE_FADE_OUT_MS = 1500;
const EPILOGUE_DETACH_BUFFER_MS = 50;
const SCROLL_START_GAP_MS = 200;

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
@keyframes ${ROOT_CLASS}-stanza-reveal{
  from{opacity:0;transform:translateY(8px)}
  to{opacity:1;transform:translateY(0)}
}
.${ROOT_CLASS} .epilogue{
  position:absolute;left:0;right:0;top:0;bottom:0;
  display:flex;flex-direction:column;align-items:center;justify-content:center;
  gap:22px;padding:0 80px;
  pointer-events:none;
  transition:opacity ${EPILOGUE_FADE_OUT_MS}ms ease-out;
}
.${ROOT_CLASS} .epilogue.fading-out{opacity:0}
.${ROOT_CLASS} .epilogue .stanza{
  display:flex;flex-direction:column;align-items:center;gap:4px;
  font-family:'Rajdhani',system-ui,sans-serif;
  font-size:20px;letter-spacing:.10em;line-height:1.55;
  color:#d4dbe4;text-align:center;text-transform:none;
  animation:${ROOT_CLASS}-stanza-reveal ${EPILOGUE_STANZA_FADE_MS}ms ease-out both;
}
.${ROOT_CLASS} .epilogue .stanza .stanza-line{display:block}
.${ROOT_CLASS} .epilogue .stanza.closing{color:#ffd94a;letter-spacing:.14em}
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
  margin-top:40px;
  font-family:'Bebas Neue',sans-serif;font-size:28px;
  letter-spacing:.36em;color:#ff7a00;text-transform:uppercase;
  text-shadow:0 0 18px rgba(255,122,0,.55), 0 2px 0 #000;
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

  const epilogueStanzas = resolveStanzas(HARD_ENDING_STANZAS);
  const epilogueHtml = epilogueStanzas
    .map((stanza, idx) => {
      const isClosing = idx === epilogueStanzas.length - 1;
      const delay =
        EPILOGUE_FIRST_STANZA_DELAY_MS + idx * EPILOGUE_STANZA_STAGGER_MS;
      const lines = stanza
        .map((l) => `<span class="stanza-line">${escapeHtml(l)}</span>`)
        .join('');
      return `<div class="stanza${isClosing ? ' closing' : ''}" style="animation-delay:${delay}ms">${lines}</div>`;
    })
    .join('');

  const yakouSubHtml = HYAKKI_SUB_LINES.map((l) => escapeHtml(bl(l))).join('<br>');

  root.innerHTML = `
    <div class="stage">
      <div class="epilogue" data-role="epilogue">${epilogueHtml}</div>
      <div class="scroll">
        ${creditsHtml}
        <div class="spacer-large"></div>
        <div class="yakou">
          <div class="kanji">百鬼夜行</div>
          <div class="roman">HYAKKI YAKOU</div>
          <div class="sub">${yakouSubHtml}</div>
        </div>
        <div class="tbc">TO BE CONTINUED</div>
        <button class="return-btn" data-role="return">← RETURN TO TITLE</button>
      </div>
    </div>
    ${opts.showSkip ? '<button class="skip-btn" data-role="skip">SKIP →</button>' : ''}
  `;

  document.body.appendChild(root);

  const stage = root.querySelector('.stage') as HTMLElement;
  const disposeFit = fitStageToCanvas(stage);

  const scrollEl = root.querySelector('.scroll') as HTMLElement;
  const epilogueEl = root.querySelector('[data-role="epilogue"]') as HTMLElement;
  const returnBtn = root.querySelector('[data-role="return"]') as HTMLElement;

  const lastStanzaInAt =
    EPILOGUE_FIRST_STANZA_DELAY_MS +
    (EPILOGUE_STANZA_COUNT - 1) * EPILOGUE_STANZA_STAGGER_MS +
    EPILOGUE_STANZA_FADE_MS;
  const fadeOutStartAt = lastStanzaInAt + EPILOGUE_HOLD_MS;
  const fadeOutEndAt = fadeOutStartAt + EPILOGUE_FADE_OUT_MS;

  const timers: number[] = [];
  const schedule = (fn: () => void, ms: number): void => {
    timers.push(window.setTimeout(fn, ms));
  };

  schedule(() => epilogueEl.classList.add('fading-out'), fadeOutStartAt);
  schedule(() => {
    epilogueEl.style.display = 'none';
  }, fadeOutEndAt + EPILOGUE_DETACH_BUFFER_MS);

  // bgm_victory was retrimmed 2026-04-25 to 115s (109s body + 6s
  // fade-out) to match the slimmed credits roll (3 sections only:
  // AI-ASSISTED ASSETS / MUSIC / AUDIO). Measured ED total ≈ 107s from
  // Result mount → RETURN visible, with ~12s pre-scroll VICTORY screen +
  // ~95s scroll. Music tail covers the player's 百鬼夜行 reading window.
  // If credits length changes again, re-measure with playwright and
  // re-trim bgm_victory accordingly (single-pass ffmpeg with afade=out).
  const baseSpeed = opts.scrollSpeed ?? 23;
  let scrollOffset = 0;
  let raf = 0;
  let lastTs = performance.now();

  const yakouEl = scrollEl.querySelector('.yakou') as HTMLElement;

  /**
   * Park the 百鬼夜行 block in the upper third of the viewport so the
   * "TO BE CONTINUED" line and RETURN button below it land in the
   * lower half with breathing room. Scroll starts with the content's
   * top at stage y=VIEW_H; for yakou's center to sit at screen y = yT,
   *   scrollOffset = VIEW_H + yakouTop + yakouH/2 - yT
   * with yT = VIEW_H/3 giving scrollOffset = 2*VIEW_H/3 + top + h/2.
   */
  const computeEndOffset = (): number => {
    const offsetTop = yakouEl.offsetTop;
    const h = yakouEl.offsetHeight || 420;
    return (2 * VIEW_H) / 3 + offsetTop + h / 2;
  };

  const tick = (ts: number): void => {
    const dt = Math.min(0.05, (ts - lastTs) / 1000);
    lastTs = ts;
    scrollOffset += baseSpeed * dt;
    scrollEl.style.transform = `translateY(${-scrollOffset}px)`;
    const endThreshold = computeEndOffset();
    if (scrollOffset >= endThreshold) {
      scrollOffset = endThreshold;
      scrollEl.style.transform = `translateY(${-scrollOffset}px)`;
      returnBtn.classList.add('visible');
      return;
    }
    raf = requestAnimationFrame(tick);
  };

  schedule(() => {
    lastTs = performance.now();
    raf = requestAnimationFrame(tick);
  }, fadeOutEndAt + SCROLL_START_GAP_MS);

  returnBtn.addEventListener('click', () => opts.onReturn());

  const skipBtn = root.querySelector('[data-role="skip"]') as HTMLElement | null;
  skipBtn?.addEventListener('click', () => opts.onReturn());

  requestAnimationFrame(() => root.classList.add('visible'));

  return wrapUnmount(
    root,
    () => {
      timers.forEach((id) => window.clearTimeout(id));
      cancelAnimationFrame(raf);
      disposeFit();
    },
    820,
  );
}

// ---------------------------------------------------------------------------
// Easy mode ending — minimal cliffhanger.
// ---------------------------------------------------------------------------

export interface EasyEndingOverlayOptions {
  readonly returnLabel: string;
  readonly onReturn: () => void;
  /**
   * Render a small SKIP button that jumps straight back to Title. Shown
   * only on repeat viewings so first-time players see the full sequence.
   */
  readonly showSkip?: boolean;
}

const EASY_ROOT_CLASS = 'soul-strike-easy-ending-overlay';
const EASY_STYLE_ID = 'soul-strike-easy-ending-style';

/**
 * Easy-mode epilogue. Three short stanzas land the precursor arc on a
 * cliffhanger that explicitly redirects the player toward HARD mode. No
 * credits, no HYAKKI YAKOU reveal, no SOUL BREAKER teaser — those belong
 * to the canonical Episode 0 closure.
 *
 * Bilingual content lives in `src/data/storyText.ts` (EASY_ENDING_STANZAS)
 * and is resolved per-locale at mount time via `bl()`.
 */
const EASY_STANZA_COUNT = EASY_ENDING_STANZAS.length;

const EASY_STANZA_STAGGER_MS = 4000;
const EASY_FIRST_STANZA_DELAY_MS = 700;
const EASY_STANZA_FADE_MS = 1000;
const EASY_HOLD_MS = 4500;
const EASY_TBC_FADE_MS = 1200;

const EASY_CSS = `
.${EASY_ROOT_CLASS}{
  position:fixed;inset:0;z-index:115;
  background:#000;opacity:0;transition:opacity 800ms ease;
  pointer-events:none;overflow:hidden;
  color:#e8ecf2;font-family:'Rajdhani',system-ui,sans-serif;
}
.${EASY_ROOT_CLASS}.visible{opacity:1;pointer-events:auto}
.${EASY_ROOT_CLASS} .stage{
  position:absolute;left:50%;top:50%;
  transform:translate(-50%,-50%);
  width:1280px;height:720px;
  display:flex;flex-direction:column;align-items:center;justify-content:center;
  gap:28px;padding:0 80px;
}
@keyframes ${EASY_ROOT_CLASS}-stanza-reveal{
  from{opacity:0;transform:translateY(8px)}
  to{opacity:1;transform:translateY(0)}
}
.${EASY_ROOT_CLASS} .stanza{
  display:flex;flex-direction:column;align-items:center;gap:4px;
  font-size:22px;letter-spacing:.10em;line-height:1.55;
  color:#d4dbe4;text-align:center;
  animation:${EASY_ROOT_CLASS}-stanza-reveal ${EASY_STANZA_FADE_MS}ms ease-out both;
}
.${EASY_ROOT_CLASS} .stanza.closing{color:#ffd94a;letter-spacing:.14em}
.${EASY_ROOT_CLASS} .tbc-block{
  display:flex;flex-direction:column;align-items:center;gap:10px;
  margin-top:24px;
  opacity:0;transition:opacity ${EASY_TBC_FADE_MS}ms ease;
}
.${EASY_ROOT_CLASS} .tbc-block.visible{opacity:1}
.${EASY_ROOT_CLASS} .tbc-label{
  font-family:'Bebas Neue',sans-serif;font-size:22px;
  letter-spacing:.36em;color:#aeeaff;text-transform:uppercase;
}
.${EASY_ROOT_CLASS} .tbc-mode{
  font-family:'Bebas Neue',sans-serif;font-size:56px;
  letter-spacing:.22em;color:#ff7a00;text-transform:uppercase;
  text-shadow:0 0 18px rgba(255,122,0,.55), 0 2px 0 #000;
}
.${EASY_ROOT_CLASS} .return-btn{
  margin-top:48px;
  width:280px;height:46px;
  font-family:'Bebas Neue',sans-serif;font-size:20px;letter-spacing:.14em;
  color:#ffd94a;background:rgba(255,217,74,.08);
  border:1px solid #ffd94a;cursor:pointer;
  opacity:0;transition:opacity 600ms ease;pointer-events:none;
}
.${EASY_ROOT_CLASS} .return-btn.visible{opacity:1;pointer-events:auto}
.${EASY_ROOT_CLASS} .return-btn:hover{background:rgba(255,217,74,.2)}
.${EASY_ROOT_CLASS} .skip-btn{
  position:absolute;right:28px;top:28px;
  width:120px;height:34px;
  font-family:'Bebas Neue',sans-serif;font-size:14px;letter-spacing:.18em;
  color:#aeeaff;background:rgba(174,234,255,.08);
  border:1px solid rgba(174,234,255,.45);cursor:pointer;
  transition:background .15s;z-index:3;
}
.${EASY_ROOT_CLASS} .skip-btn:hover{background:rgba(174,234,255,.2)}
`;

export function mountEasyEndingOverlay(opts: EasyEndingOverlayOptions): () => void {
  ensureFrameStyle();
  ensureStyle(EASY_STYLE_ID, EASY_CSS);
  clearPriorRoots(EASY_ROOT_CLASS);

  const root = document.createElement('div');
  root.className = EASY_ROOT_CLASS;

  const easyStanzas = resolveStanzas(EASY_ENDING_STANZAS);
  const stanzasHtml = easyStanzas
    .map((stanza, idx) => {
      const isClosing = idx === easyStanzas.length - 1;
      const delay =
        EASY_FIRST_STANZA_DELAY_MS + idx * EASY_STANZA_STAGGER_MS;
      const lines = stanza
        .map((l) => `<span class="stanza-line">${escapeHtml(l)}</span>`)
        .join('');
      return `<div class="stanza${isClosing ? ' closing' : ''}" style="animation-delay:${delay}ms">${lines}</div>`;
    })
    .join('');

  root.innerHTML = `
    <div class="stage">
      ${stanzasHtml}
      <div class="tbc-block" data-role="tbc">
        <div class="tbc-label">TO BE CONTINUED IN</div>
        <div class="tbc-mode">HARD MODE</div>
      </div>
      <button class="return-btn" data-role="return">${escapeHtml(opts.returnLabel)}</button>
    </div>
    ${opts.showSkip ? '<button class="skip-btn" data-role="skip">SKIP →</button>' : ''}
  `;

  document.body.appendChild(root);

  const stage = root.querySelector('.stage') as HTMLElement;
  const disposeFit = fitStageToCanvas(stage);

  const tbcEl = root.querySelector('[data-role="tbc"]') as HTMLElement;
  const returnBtn = root.querySelector('[data-role="return"]') as HTMLElement;
  const skipBtn = root.querySelector('[data-role="skip"]') as HTMLElement | null;
  skipBtn?.addEventListener('click', () => opts.onReturn());

  const lastStanzaInAt =
    EASY_FIRST_STANZA_DELAY_MS +
    (EASY_STANZA_COUNT - 1) * EASY_STANZA_STAGGER_MS +
    EASY_STANZA_FADE_MS;
  const tbcAt = lastStanzaInAt + EASY_HOLD_MS;
  const returnAt = tbcAt + EASY_TBC_FADE_MS + 400;

  const timers: number[] = [];
  const schedule = (fn: () => void, ms: number): void => {
    timers.push(window.setTimeout(fn, ms));
  };

  schedule(() => tbcEl.classList.add('visible'), tbcAt);
  schedule(() => returnBtn.classList.add('visible'), returnAt);

  returnBtn.addEventListener('click', () => opts.onReturn());

  requestAnimationFrame(() => root.classList.add('visible'));

  return wrapUnmount(
    root,
    () => {
      timers.forEach((id) => window.clearTimeout(id));
      disposeFit();
    },
    820,
  );
}
