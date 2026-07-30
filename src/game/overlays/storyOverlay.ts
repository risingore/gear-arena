/**
 * Story library overlay.
 *
 * Read-at-your-own-pace view of the joined Easy + Hard epilogue, shown
 * after the player has cleared Hard at least once. Mirrors the visual
 * language of Settings / Collection — ss-frame, Bebas Neue title,
 * navy panel with cyan hairline, BACK button bottom-left — so it slots
 * into the Title's secondary-row without feeling like a foreign scene.
 *
 * Content:
 *   1. EASY closing stanzas (3 verses) — the precursor cliffhanger.
 *   2. HARD epilogue (6 verses) — the canonical Episode 0 closure.
 *   3. 百鬼夜行 reveal — same kanji + romaji + sub used by the Hard
 *      credits roll, but standalone (no credits, no SOUL BREAKER tease,
 *      no auto-scroll).
 *
 * Excluded by design: credits roll, "TO BE CONTINUED", any out-of-fiction
 * production credits. This screen is the in-fiction archive only.
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
import { bl } from '../systems/i18n';
import {
  EASY_ENDING_STANZAS,
  HARD_ENDING_STANZAS,
  HYAKKI_SUB_LINES,
} from '../../data/storyText';

export interface StoryOverlayOptions {
  readonly title: string;
  readonly easyHeading: string;
  readonly hardHeading: string;
  readonly backLabel: string;
  readonly onBack: () => void;
}

const ROOT_CLASS = 'soul-strike-story-overlay';
const STYLE_ID = 'soul-strike-story-overlay-style';

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
  width:820px;max-height:540px;padding:28px 56px 36px;
  overflow-y:auto;
  background:rgba(10,10,16,.55);
  border:1px solid rgba(174,234,255,.18);
  scrollbar-width:thin;scrollbar-color:rgba(174,234,255,.35) rgba(10,10,16,.4);
}
.${ROOT_CLASS} .panel::-webkit-scrollbar{width:8px}
.${ROOT_CLASS} .panel::-webkit-scrollbar-track{background:rgba(10,10,16,.4)}
.${ROOT_CLASS} .panel::-webkit-scrollbar-thumb{background:rgba(174,234,255,.35);border-radius:3px}
.${ROOT_CLASS} .panel::-webkit-scrollbar-thumb:hover{background:rgba(174,234,255,.55)}
.${ROOT_CLASS} .chapter-heading{
  font-family:'Bebas Neue',sans-serif;font-size:22px;letter-spacing:.22em;
  color:#ffd94a;text-transform:uppercase;
  margin:0 0 18px;padding-bottom:6px;
  border-bottom:1px solid rgba(255,217,74,.25);
}
.${ROOT_CLASS} .chapter-heading.second{margin-top:38px}
.${ROOT_CLASS} .stanza{
  font-size:17px;letter-spacing:.06em;line-height:1.7;
  color:#d4dbe4;margin:0 0 18px;
  text-align:center;
}
.${ROOT_CLASS} .stanza .stanza-line{display:block}
.${ROOT_CLASS} .stanza.closing{color:#ffd94a;letter-spacing:.10em}
.${ROOT_CLASS} .yakou{
  display:flex;flex-direction:column;align-items:center;gap:12px;
  margin:42px 0 8px;
  padding-top:28px;
  border-top:1px solid rgba(255,68,68,.25);
}
.${ROOT_CLASS} .yakou .kanji{
  font-family:'Noto Serif JP','Yu Mincho',serif;
  font-size:80px;letter-spacing:.08em;color:#ff4444;
  text-shadow:0 0 18px rgba(255,68,68,.45), 0 2px 0 #000;
  line-height:1;
}
.${ROOT_CLASS} .yakou .roman{
  font-family:'Bebas Neue',sans-serif;font-size:28px;
  letter-spacing:.32em;color:#ff7a00;
}
.${ROOT_CLASS} .yakou .sub{
  font-size:13px;letter-spacing:.18em;color:#8da0ba;
  font-style:italic;max-width:560px;text-align:center;line-height:1.8;
  margin-top:4px;
}
.${ROOT_CLASS} .back{
  position:absolute;left:40px;bottom:30px;
  width:120px;height:36px;
  font-family:'Bebas Neue',sans-serif;font-size:16px;letter-spacing:.12em;color:#fff;
  background:rgba(58,58,85,.3);border:1px solid rgba(174,234,255,.3);
  cursor:pointer;transition:background .15s;
}
.${ROOT_CLASS} .back:hover{background:rgba(85,85,119,.6)}
`;

function stanzasHtml(
  stanzas: readonly (readonly { en: string; ja: string }[])[],
): string {
  return stanzas
    .map((stanza, idx) => {
      const isClosing = idx === stanzas.length - 1;
      const lines = stanza
        .map((l) => `<span class="stanza-line">${esc(bl(l))}</span>`)
        .join('');
      return `<p class="stanza${isClosing ? ' closing' : ''}">${lines}</p>`;
    })
    .join('');
}

export function mountStoryOverlay(opts: StoryOverlayOptions): () => void {
  ensureFrameStyle();
  ensureStyle(STYLE_ID, CSS);
  clearPriorRoots(ROOT_CLASS);

  const root = document.createElement('div');
  root.className = ROOT_CLASS;

  const subHtml = HYAKKI_SUB_LINES.map((l) => esc(bl(l))).join('<br>');

  root.innerHTML = `
    <div class="stage ss-stage">
      ${buildFrameHtml({
        tagLeft: '<b>SS</b>-<b>EP0</b> / EPILOGUE <span class="bar"></span> ARCHIVE',
        tagRight: 'JOINED RECORD <span class="bar"></span> <b>UNSEALED</b>',
      })}
      <div class="title">${esc(opts.title)}</div>
      <div class="panel">
        <div class="chapter-heading">${esc(opts.easyHeading)}</div>
        ${stanzasHtml(EASY_ENDING_STANZAS)}
        <div class="chapter-heading second">${esc(opts.hardHeading)}</div>
        ${stanzasHtml(HARD_ENDING_STANZAS)}
        <div class="yakou">
          <div class="kanji">百鬼夜行</div>
          <div class="roman">HYAKKI YAKOU</div>
          <div class="sub">${subHtml}</div>
        </div>
      </div>
      <button class="back" data-role="back">${esc(opts.backLabel)}</button>
    </div>
  `;

  document.body.appendChild(root);

  const stage = root.querySelector('.stage') as HTMLElement;
  const disposeFit = fitStageToCanvas(stage);

  const backBtn = root.querySelector('[data-role="back"]') as HTMLElement | null;
  backBtn?.addEventListener('click', () => opts.onBack());

  requestAnimationFrame(() => root.classList.add('visible'));

  return wrapUnmount(root, () => {
    disposeFit();
  });
}
