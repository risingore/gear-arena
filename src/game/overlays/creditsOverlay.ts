/**
 * Credits overlay.
 *
 * Matches the Title / Settings / Collection visual language: shared
 * SS-NNN frame, Bebas Neue title, same-width scrollable panel, and
 * bottom-left Back button. Data comes from the canonical
 * `systems/credits.ts` so this screen and the Victory ending scroll
 * always stay in sync.
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
import { CREDITS } from '../systems/credits';

export interface CreditsOverlayOptions {
  readonly title: string;
  readonly licenseLine: string;
  readonly backLabel: string;
  readonly onBack: () => void;
}

const ROOT_CLASS = 'soul-strike-credits-overlay';
const STYLE_ID = 'soul-strike-credits-overlay-style';

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
  width:742px;max-height:540px;padding:24px 40px 28px;
  overflow-y:auto;
  background:rgba(10,10,16,.55);
  border:1px solid rgba(174,234,255,.18);
  scrollbar-width:thin;scrollbar-color:rgba(174,234,255,.35) rgba(10,10,16,.4);
}
.${ROOT_CLASS} .panel::-webkit-scrollbar{width:8px}
.${ROOT_CLASS} .panel::-webkit-scrollbar-track{background:rgba(10,10,16,.4)}
.${ROOT_CLASS} .panel::-webkit-scrollbar-thumb{background:rgba(174,234,255,.35);border-radius:3px}
.${ROOT_CLASS} .panel::-webkit-scrollbar-thumb:hover{background:rgba(174,234,255,.55)}
.${ROOT_CLASS} .section{
  margin-bottom:22px;
}
.${ROOT_CLASS} .section:last-of-type{margin-bottom:0}
.${ROOT_CLASS} .heading{
  font-family:'Bebas Neue',sans-serif;font-size:18px;letter-spacing:.18em;
  color:#ffd94a;margin:0 0 6px;text-transform:uppercase;
}
.${ROOT_CLASS} .line{
  font-size:15px;letter-spacing:.06em;color:#cfd8e4;line-height:1.5;
  padding:2px 0;
}
.${ROOT_CLASS} .divider{
  height:1px;background:rgba(174,234,255,.18);margin:18px 0;
}
.${ROOT_CLASS} .jam-note{
  text-align:center;font-size:11px;letter-spacing:.22em;color:#6a7687;
  text-transform:uppercase;margin-top:4px;
}
.${ROOT_CLASS} .jam-note b{color:#aeeaff;font-weight:500;letter-spacing:.16em}
.${ROOT_CLASS} .back{
  position:absolute;left:40px;bottom:30px;
  width:120px;height:36px;
  font-family:'Bebas Neue',sans-serif;font-size:16px;letter-spacing:.12em;color:#fff;
  background:rgba(58,58,85,.3);border:1px solid rgba(174,234,255,.3);
  cursor:pointer;transition:background .15s;
}
.${ROOT_CLASS} .back:hover{background:rgba(85,85,119,.6)}
`;

export function mountCreditsOverlay(opts: CreditsOverlayOptions): () => void {
  ensureFrameStyle();
  ensureStyle(STYLE_ID, CSS);
  clearPriorRoots(ROOT_CLASS);

  const root = document.createElement('div');
  root.className = ROOT_CLASS;

  const sectionsHtml = CREDITS.map((section) => `
    <div class="section">
      <div class="heading">${esc(section.heading)}</div>
      ${section.lines.map((line) => `<div class="line">${esc(line)}</div>`).join('')}
    </div>
  `).join('');

  root.innerHTML = `
    <div class="stage ss-stage">
      ${buildFrameHtml({
        tagLeft: '<b>SS</b>-<b>100</b> / CREDITS <span class="bar"></span> ROSTER',
        tagRight: 'PRODUCTION <span class="bar"></span> <b>SOUL STRIKE</b>',
      })}
      <div class="title">${esc(opts.title)}</div>
      <div class="panel">
        ${sectionsHtml}
        <div class="divider"></div>
        <div class="jam-note"><b>SOUL STRIKE</b> · GAMEDEV.JS JAM 2026 · THEME MACHINES</div>
        <div class="jam-note">${esc(opts.licenseLine)}</div>
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

  return wrapUnmount(root, disposeFit);
}
