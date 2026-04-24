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
  shopTier?: string;     // e.g. "TIER II" (auto-derived from round if omitted)
  outputCode?: string;   // e.g. "SS-41" (auto-derived from round if omitted)
  rerollCost?: number;
  monologue?: string;
  tutorialHint?: string;
}

export interface BuildOverlayHandle {
  update(round: number, totalRounds: number, monologue?: string): void;
  setRerollCost(cost: number): void;
  unmount(): void;
}

const ROOT_CLASS = 'soul-strike-build-overlay';
const STYLE_ID = 'soul-strike-build-overlay-style';

// Panel-head strip positions in 1280×720 design space. Values mirror
// scenes/Build.ts drawColumnFrames inputs exactly — frames now hug the
// content columns (no outer inset), so head left/width equal the
// content-column left/width.
//   storage   x= 58 w=100   blueprint x=178 w=450
//   shop      x=648 w=294   stats     x=962 w=260
const HEAD_TOP = 44;
const STORAGE_HEAD_LEFT = 58;
const STORAGE_HEAD_W = 100;
const BLUEPRINT_HEAD_LEFT = 178;
const BLUEPRINT_HEAD_W = 450;
const SHOP_HEAD_LEFT = 648;
const SHOP_HEAD_W = 294;
const STATS_HEAD_LEFT = 962;
const STATS_HEAD_W = 260;

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
/* Workshop reads too dark with the default 55% vignette — weaken to 18%. */
.${ROOT_CLASS} .stage .ss-frame-vignette{
  background:radial-gradient(70% 60% at 50% 50%, transparent 0%, rgba(0,0,0,.18) 100%);
}
/* Restore the cyan 40-px grid (SANCTUM / Collection baseline texture).
   Kept invisible inside the blueprint panel so it doesn't moiré with the
   blueprint PNG's own baked grid — mask cuts the grid out of the centre
   column. Numbers match the Build.ts layout geometry. */
.${ROOT_CLASS} .stage .ss-frame-grid{
  -webkit-mask-image:
    linear-gradient(#000,#000),
    linear-gradient(#000,#000);
  -webkit-mask-composite:xor;
          mask-image:
    linear-gradient(#000,#000),
    linear-gradient(#000,#000);
          mask-composite:exclude;
  -webkit-mask-repeat:no-repeat,no-repeat;
          mask-repeat:no-repeat,no-repeat;
  -webkit-mask-size:100% 100%, 450px 598px;
          mask-size:100% 100%, 450px 598px;
  -webkit-mask-position:0 0, 178px 80px;
          mask-position:0 0, 178px 80px;
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
/* Panel-head now covers the exact content-column footprint (frames
   have zero outer inset). padding: 0 means the header's ident text and
   status text sit flush with the content-column left / right edges —
   identical x as the blueprint image / shop cards / stats numerals
   that sit beneath them. */
.${ROOT_CLASS} .panel-head{
  position:absolute;z-index:3;height:30px;padding:0;
  display:flex;align-items:center;justify-content:space-between;
  border-bottom:1px solid rgba(174,234,255,.22);
  background:linear-gradient(180deg,rgba(16,32,74,.75),rgba(16,32,74,.45));
  font-family:'Bebas Neue',sans-serif;font-size:15px;letter-spacing:.22em;color:#e8ecf2;
  /* Top-right chamfer matches the Phaser column frame (cornerCut 14px)
     so the head tucks cleanly into the panel silhouette. Top-left
     stays square, same as frame. Status text (right span) gets an
     8 px right margin so letters don't kiss the chamfer edge. */
  clip-path:polygon(0 0,calc(100% - 14px) 0,100% 14px,100% 100%,0 100%);
}
.${ROOT_CLASS} .panel-head .status{margin-right:8px}
.${ROOT_CLASS} .panel-head .ident{display:flex;align-items:center;gap:0}
.${ROOT_CLASS} .panel-head .ident .tag{color:#ff7a00;font-weight:700}
.${ROOT_CLASS} .panel-head .ident .sep{color:#ff7a00;margin:0 10px;opacity:.9}
.${ROOT_CLASS} .panel-head .ident .val{color:#ffffff;font-weight:600}
.${ROOT_CLASS} .panel-head .ident.compact{text-align:center;width:100%;justify-content:center}
.${ROOT_CLASS} .panel-head.storage{justify-content:center;font-size:14px;letter-spacing:.3em}
.${ROOT_CLASS} .panel-head .status{
  display:flex;align-items:center;gap:8px;
  font-size:11px;letter-spacing:.22em;color:#8da0ba;
}
.${ROOT_CLASS} .panel-head .status .num{color:#ff7a00;font-weight:700;margin:0 2px 0 6px}
.${ROOT_CLASS} .panel-head .status .unit{color:#ff7a00;font-weight:700}
.${ROOT_CLASS} .panel-head .dot{
  width:9px;height:9px;border-radius:50%;background:#3aff7a;
  box-shadow:0 0 10px #3aff7a;
  animation:ss-dot-pulse 2.4s ease-in-out infinite;
}
.${ROOT_CLASS} .panel-head .dot.amber{background:#ff7a00;box-shadow:0 0 10px #ff7a00}
@keyframes ss-dot-pulse{
  0%,100%{opacity:.6}
  50%{opacity:1}
}
`;

/**
 * SHOP card tier by round. 10-round campaign split into 4 bands:
 *   R1-3 → TIER I   (starter pool)
 *   R4-6 → TIER II  (mid pool)
 *   R7-9 → TIER III (late pool)
 *   R10+ → TIER IV  (final pool)
 * Purely cosmetic label — actual pool composition lives in shop generation.
 */
function deriveShopTier(round: number): string {
  if (round >= 10) return 'TIER IV';
  if (round >= 7) return 'TIER III';
  if (round >= 4) return 'TIER II';
  return 'TIER I';
}

/** OUTPUT column identifier — round-indexed 2-digit code (SS-01 .. SS-10). */
function deriveOutputCode(round: number): string {
  return `SS-${round.toString().padStart(2, '0')}`;
}

/** Render right-side status block matching the reference mock-up. */
function rerollStatusHtml(cost: number): string {
  return `NEXT REROLL <span class="num">${cost}</span><span class="unit">G</span>`;
}

export function mountBuildOverlay(opts: BuildOverlayOptions): BuildOverlayHandle {
  ensureFrameStyle();
  ensureStyle(STYLE_ID, CSS);
  clearPriorRoots(ROOT_CLASS);

  const root = document.createElement('div');
  root.className = ROOT_CLASS;

  const shopTier = opts.shopTier ?? deriveShopTier(opts.round);
  const outputCode = opts.outputCode ?? deriveOutputCode(opts.round);
  const pilotLabel = opts.pilotName ? esc(opts.pilotName) : 'UNKNOWN';
  const pilotHtml =
    `<span class="tag">PILOT</span><span class="sep">·</span>` +
    `<span class="val">${pilotLabel}</span><span class="sep">·</span>` +
    `<span class="val">BLUEPRINT</span>`;
  const shopHtml =
    `<span class="tag">SHOP</span><span class="sep">·</span>` +
    `<span class="val">${esc(shopTier)}</span>`;
  const outputHtml =
    `<span class="tag">OUTPUT</span><span class="sep">·</span>` +
    `<span class="val">${esc(outputCode)}</span>`;
  const initialReroll = opts.rerollCost ?? 1;

  const roundTag = `ROUND <b style="color:#ffd94a">${opts.round.toString().padStart(2, '0')}</b> / ${opts.totalRounds.toString().padStart(2, '0')}`;
  root.innerHTML = `
    <div class="stage ss-stage">
      ${buildFrameHtml({
        tagLeft: '<b>SS</b>-<b>003</b> / BLUEPRINT <span class="bar"></span> BUILD',
        tagRight: `BUILD PHASE <span class="bar"></span> ${roundTag}`,
      })}
      <div class="panel-head storage" style="left:${STORAGE_HEAD_LEFT}px;top:${HEAD_TOP}px;width:${STORAGE_HEAD_W}px">
        <span class="ident compact"><span class="tag">BUFFS</span></span>
      </div>
      <div class="panel-head" style="left:${BLUEPRINT_HEAD_LEFT}px;top:${HEAD_TOP}px;width:${BLUEPRINT_HEAD_W}px">
        <span class="ident">${pilotHtml}</span>
        <span class="status">LINK <span class="dot"></span></span>
      </div>
      <div class="panel-head" style="left:${SHOP_HEAD_LEFT}px;top:${HEAD_TOP}px;width:${SHOP_HEAD_W}px">
        <span class="ident">${shopHtml}</span>
        <span class="status" data-role="reroll">${rerollStatusHtml(initialReroll)}</span>
      </div>
      <div class="panel-head" style="left:${STATS_HEAD_LEFT}px;top:${HEAD_TOP}px;width:${STATS_HEAD_W}px">
        <span class="ident">${outputHtml}</span>
        <span class="status">SIM <span class="dot"></span></span>
      </div>
      <div class="monologue"></div>
      ${opts.tutorialHint ? `<div class="hint">${esc(opts.tutorialHint)}</div>` : ''}
    </div>
  `;
  document.body.appendChild(root);

  const stage = root.querySelector('.stage') as HTMLElement;
  const mono = root.querySelector('.monologue') as HTMLElement;
  const rerollStatus = root.querySelector('[data-role="reroll"]') as HTMLElement;

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
    setRerollCost(cost: number): void {
      rerollStatus.innerHTML = rerollStatusHtml(cost);
    },
    unmount: wrapUnmount(root, disposeFit),
  };
}
