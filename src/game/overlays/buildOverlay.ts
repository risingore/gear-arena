/**
 * Build scene header overlay (hybrid).
 *
 * Only the top header (ROUND N / M + per-round inner-voice monologue)
 * is DOM. The blueprint, drag-and-drop slots, shop cards, stats panel,
 * and REROLL / READY buttons remain on the Phaser canvas because the
 * drag system is canvas-input-based and splitting it across layers
 * would be more complicated than the crispness payoff.
 *
 * This establishes the overlay hook for Build so future passes can
 * migrate the stats panel and shop cards to DOM incrementally.
 */

import { escapeHtml as esc, ensureStyle, clearPriorRoots, fitStageToCanvas, wrapUnmount } from './overlayBase';

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
  position:fixed;inset:0;z-index:95;
  color:#e8ecf2;font-family:'Rajdhani',system-ui,sans-serif;
  pointer-events:none;opacity:0;transition:opacity 220ms ease;
  background:transparent;overflow:hidden;
}
.${ROOT_CLASS}.visible{opacity:1}
.${ROOT_CLASS} .stage{
  width:1280px;height:720px;position:absolute;left:50%;top:50%;
  transform:translate(-50%,-50%);
  pointer-events:none;
}
.${ROOT_CLASS} .round{
  position:absolute;left:314px;top:14px;
  font-family:'Bebas Neue',sans-serif;font-size:28px;letter-spacing:.06em;color:#fff;
  line-height:1;
}
.${ROOT_CLASS} .round .sep{color:#8da0ba;margin:0 6px}
.${ROOT_CLASS} .round .total{color:#8da0ba;font-size:20px}
.${ROOT_CLASS} .monologue{
  position:absolute;left:314px;top:44px;
  font-size:13px;letter-spacing:.08em;color:rgba(174,234,255,.65);
  font-style:italic;opacity:0;transition:opacity 400ms ease;
}
.${ROOT_CLASS} .monologue.show{opacity:1}
.${ROOT_CLASS} .hint{
  position:absolute;left:50%;bottom:22px;transform:translateX(-50%);
  font-size:12px;letter-spacing:.14em;color:#88ccff;opacity:.8;
  pointer-events:none;
}
`;

export function mountBuildOverlay(opts: BuildOverlayOptions): BuildOverlayHandle {
  ensureStyle(STYLE_ID, CSS);
  clearPriorRoots(ROOT_CLASS);

  const root = document.createElement('div');
  root.className = ROOT_CLASS;
  root.innerHTML = `
    <div class="stage">
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
      if (monologue && monologue !== mono.textContent?.replace(/^— |— $/g, '')) {
        mono.classList.remove('show');
        mono.textContent = `— ${monologue} —`;
        window.setTimeout(() => mono.classList.add('show'), 100);
      }
    },
    unmount: wrapUnmount(root, disposeFit),
  };
}
