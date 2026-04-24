/**
 * Build scene header overlay (hybrid).
 *
 * DOM layer provides the Title-matching frame (brackets / SS-tags / grid /
 * vignette) plus stylised panel-head strips above the blueprint / shop /
 * stats columns. The blueprint image, drag-and-drop slots, shop cards,
 * stats text, and REROLL / READY buttons remain on the Phaser canvas —
 * the drag system is canvas-input-based.
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
  pilotName?: string;
  shopLabel?: string;
  statsLabel?: string;
  monologue?: string;
  tutorialHint?: string;
}

export interface BuildOverlayHandle {
  update(round: number, totalRounds: number, monologue?: string): void;
  unmount(): void;
}

const ROOT_CLASS = 'soul-strike-build-overlay';
const STYLE_ID = 'soul-strike-build-overlay-style';

// Panel-head strip positions in 1280×720 design space. Each head sits at
// the top of its matching Phaser-drawn chamfered column frame (see
// scenes/Build.ts drawColumnFrames). Coords + widths must mirror those
// frames — if the Phaser-side geometry shifts, the DOM heads will
// drift off their panels.
const HEAD_TOP = 34;
const STORAGE_HEAD_LEFT = 53;
const STORAGE_HEAD_W = 116;
const BLUEPRINT_HEAD_LEFT = 177;
const BLUEPRINT_HEAD_W = 458;
const SHOP_HEAD_LEFT = 643;
const SHOP_HEAD_W = 304;
const STATS_HEAD_LEFT = 951;
const STATS_HEAD_W = 276;

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
/* The blueprint PNG already has its own grid pattern; hide the shared one. */
.${ROOT_CLASS} .stage .ss-frame-grid{display:none}
/* Workshop reads too dark with the default 55% vignette — weaken to 18%. */
.${ROOT_CLASS} .stage .ss-frame-vignette{
  background:radial-gradient(70% 60% at 50% 50%, transparent 0%, rgba(0,0,0,.18) 100%);
}
.${ROOT_CLASS} .monologue{
  position:absolute;left:50%;top:22px;transform:translateX(-50%);z-index:3;
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
.${ROOT_CLASS} .panel-head{
  position:absolute;z-index:3;height:22px;padding:0 12px;
  display:flex;align-items:center;justify-content:space-between;
  border-bottom:1px solid rgba(174,234,255,.35);
  background:linear-gradient(90deg,rgba(174,234,255,.08),rgba(174,234,255,.01));
  font-family:'Bebas Neue',sans-serif;font-size:13px;letter-spacing:.22em;color:#aeeaff;
}
.${ROOT_CLASS} .panel-head .ident b{color:#ff7a00;margin-right:8px}
.${ROOT_CLASS} .panel-head .ident.compact{text-align:center;width:100%}
.${ROOT_CLASS} .panel-head.storage{justify-content:center;padding:0 6px;font-size:12px;letter-spacing:.3em}
.${ROOT_CLASS} .panel-head .status{
  display:flex;align-items:center;gap:8px;
  font-size:10px;letter-spacing:.22em;color:#8da0ba;
}
.${ROOT_CLASS} .panel-head .dot{
  width:7px;height:7px;border-radius:50%;background:#3aff7a;
  box-shadow:0 0 10px #3aff7a;
  animation:ss-dot-pulse 2.4s ease-in-out infinite;
}
.${ROOT_CLASS} .panel-head .dot.amber{background:#ff7a00;box-shadow:0 0 10px #ff7a00}
@keyframes ss-dot-pulse{
  0%,100%{opacity:.6}
  50%{opacity:1}
}
`;

export function mountBuildOverlay(opts: BuildOverlayOptions): BuildOverlayHandle {
  ensureFrameStyle();
  ensureStyle(STYLE_ID, CSS);
  clearPriorRoots(ROOT_CLASS);

  const root = document.createElement('div');
  root.className = ROOT_CLASS;
  const pilot = opts.pilotName ? `<b>PILOT · ${esc(opts.pilotName)}</b> · BLUEPRINT` : '<b>BLUEPRINT</b>';
  const shopTitle = `<b>SHOP</b> · SLOTS`;
  const statsTitle = opts.statsLabel ? `<b>OUTPUT</b> · ${esc(opts.statsLabel)}` : '<b>OUTPUT</b> · SIM';
  const roundTag = `ROUND <b style="color:#ffd94a">${opts.round.toString().padStart(2, '0')}</b> / ${opts.totalRounds.toString().padStart(2, '0')}`;
  root.innerHTML = `
    <div class="stage ss-stage">
      ${buildFrameHtml({
        tagLeft: '<b>SS</b>-<b>003</b> / BLUEPRINT <span class="bar"></span> BUILD',
        tagRight: `BUILD PHASE <span class="bar"></span> ${roundTag}`,
      })}
      <div class="panel-head storage" style="left:${STORAGE_HEAD_LEFT}px;top:${HEAD_TOP}px;width:${STORAGE_HEAD_W}px">
        <span class="ident compact"><b>BUFFS</b></span>
      </div>
      <div class="panel-head" style="left:${BLUEPRINT_HEAD_LEFT}px;top:${HEAD_TOP}px;width:${BLUEPRINT_HEAD_W}px">
        <span class="ident">${pilot}</span>
        <span class="status">LINK <span class="dot"></span></span>
      </div>
      <div class="panel-head" style="left:${SHOP_HEAD_LEFT}px;top:${HEAD_TOP}px;width:${SHOP_HEAD_W}px">
        <span class="ident">${shopTitle}</span>
        <span class="status">LIVE <span class="dot amber"></span></span>
      </div>
      <div class="panel-head" style="left:${STATS_HEAD_LEFT}px;top:${HEAD_TOP}px;width:${STATS_HEAD_W}px">
        <span class="ident">${statsTitle}</span>
        <span class="status">SIM <span class="dot"></span></span>
      </div>
      <div class="monologue"></div>
      ${opts.tutorialHint ? `<div class="hint">${esc(opts.tutorialHint)}</div>` : ''}
    </div>
  `;
  document.body.appendChild(root);

  const stage = root.querySelector('.stage') as HTMLElement;
  const mono = root.querySelector('.monologue') as HTMLElement;

  if (opts.monologue) {
    mono.textContent = `— ${opts.monologue} —`;
    window.setTimeout(() => mono.classList.add('show'), 150);
  }

  const disposeFit = fitStageToCanvas(stage);
  requestAnimationFrame(() => root.classList.add('visible'));

  return {
    update(_round, _totalRounds, monologue): void {
      if (monologue && monologue !== mono.textContent?.replace(/^— |— $/g, '')) {
        mono.classList.remove('show');
        mono.textContent = `— ${monologue} —`;
        window.setTimeout(() => mono.classList.add('show'), 100);
      }
    },
    unmount: wrapUnmount(root, disposeFit),
  };
}
