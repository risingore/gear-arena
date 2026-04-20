/**
 * Build scene header overlay (hybrid).
 *
 * DOM layer provides the Title-matching frame (brackets / SS-tags / grid /
 * vignette / scanlines / CRT glitch) and the ROUND header. The blueprint,
 * drag-and-drop slots, shop cards, stats panel, and REROLL / READY buttons
 * remain on the Phaser canvas — the drag system is canvas-input-based.
 */

import {
  escapeHtml as esc,
  ensureStyle,
  ensureFrameStyle,
  buildFrameHtml,
  clearPriorRoots,
  fitStageToCanvas,
  wrapUnmount,
} from './overlayBase';

export interface BuildOverlayOptions {
  round: number;
  totalRounds: number;
  roundLabel: string;
  monologue?: string;
  tutorialHint?: string;
}

export interface BuildOverlayHandle {
  update(round: number, totalRounds: number, monologue?: string): void;
  unmount(): void;
}

const ROOT_CLASS = 'soul-strike-build-overlay';
const STYLE_ID = 'soul-strike-build-overlay-style';

const CSS = `
.${ROOT_CLASS}{
  position:fixed;inset:0;z-index:90;
  color:#e8ecf2;font-family:'Rajdhani',system-ui,sans-serif;
  pointer-events:none;opacity:0;transition:opacity 220ms ease;
  background:transparent;overflow:hidden;
}
.${ROOT_CLASS}.visible{opacity:1}
.${ROOT_CLASS} .stage{
  width:1280px;height:720px;position:absolute;left:50%;top:50%;
  transform:translate(-50%,-50%);
  pointer-events:none;background:transparent;
  overflow:hidden;
}
.${ROOT_CLASS} .stage.ss-stage{background:transparent}
.${ROOT_CLASS} .round{
  position:absolute;left:50%;top:22px;transform:translateX(-50%);z-index:3;
  font-family:'Bebas Neue',sans-serif;font-size:44px;letter-spacing:.05em;color:#fff;
  line-height:1;text-shadow:0 0 18px rgba(255,217,74,.2);
}
.${ROOT_CLASS} .round .label{color:#cfd8e4;margin-right:10px;font-size:34px}
.${ROOT_CLASS} .round .sep{color:#8da0ba;margin:0 10px}
.${ROOT_CLASS} .round .total{color:#8da0ba;font-size:34px}
.${ROOT_CLASS} .monologue{
  position:absolute;left:50%;top:74px;transform:translateX(-50%);z-index:3;
  font-size:12px;letter-spacing:.1em;color:rgba(174,234,255,.6);
  font-style:italic;opacity:0;transition:opacity 400ms ease;
  max-width:560px;text-align:center;
}
.${ROOT_CLASS} .monologue.show{opacity:1}
.${ROOT_CLASS} .hint{
  position:absolute;left:50%;bottom:22px;transform:translateX(-50%);z-index:3;
  font-size:11px;letter-spacing:.22em;color:#8da0ba;opacity:.85;text-transform:uppercase;
  pointer-events:none;
}
`;

export function mountBuildOverlay(opts: BuildOverlayOptions): BuildOverlayHandle {
  ensureFrameStyle();
  ensureStyle(STYLE_ID, CSS);
  clearPriorRoots(ROOT_CLASS);

  const root = document.createElement('div');
  root.className = ROOT_CLASS;
  root.innerHTML = `
    <div class="stage ss-stage">
      ${buildFrameHtml({
        tagLeft: '<b>SS</b>-<b>003</b> / BLUEPRINT <span class="bar"></span> BUILD',
        tagRight: 'BUILD PHASE <span class="bar"></span> ROUND <b data-role="tagRound"></b>',
      })}
      <div class="round">
        <span class="label">${esc(opts.roundLabel)}</span>
        <span class="current">${opts.round}</span>
        <span class="sep">/</span>
        <span class="total">${opts.totalRounds}</span>
      </div>
      <div class="monologue"></div>
      ${opts.tutorialHint ? `<div class="hint">${esc(opts.tutorialHint)}</div>` : ''}
    </div>
  `;
  document.body.appendChild(root);

  const stage = root.querySelector('.stage') as HTMLElement;
  const current = root.querySelector('.current') as HTMLElement;
  const total = root.querySelector('.total') as HTMLElement;
  const mono = root.querySelector('.monologue') as HTMLElement;
  const tagRound = root.querySelector('[data-role="tagRound"]') as HTMLElement;
  tagRound.textContent = String(opts.round).padStart(2, '0');

  if (opts.monologue) {
    mono.textContent = `— ${opts.monologue} —`;
    window.setTimeout(() => mono.classList.add('show'), 150);
  }

  const disposeFit = fitStageToCanvas(stage);
  requestAnimationFrame(() => root.classList.add('visible'));

  return {
    update(round, totalRounds, monologue): void {
      current.textContent = String(round);
      total.textContent = String(totalRounds);
      tagRound.textContent = String(round).padStart(2, '0');
      if (monologue && monologue !== mono.textContent?.replace(/^— |— $/g, '')) {
        mono.classList.remove('show');
        mono.textContent = `— ${monologue} —`;
        window.setTimeout(() => mono.classList.add('show'), 100);
      }
    },
    unmount: wrapUnmount(root, disposeFit),
  };
}
