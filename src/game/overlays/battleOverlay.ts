/**
 * Battle scene header overlay (hybrid).
 *
 * Top strip only: ROUND N / M, BATTLE / BOSS subheading, and the live
 * SPEED x-multiplier indicator in the top-right. Sprites, HP bars,
 * ULT gauge, cut-in animation, and log lines all stay on the Phaser
 * canvas — the renderer-side choreography (camera shake, tweened
 * positions, sprite knock-backs) is tightly coupled to Phaser's
 * update loop and porting it to DOM would be more work than the
 * crispness payoff justifies for the Jam deadline.
 *
 * The overlay exposes `setSpeed(x)` so the scene can update the
 * top-right label without re-mounting.
 */

import { escapeHtml as esc, ensureStyle, ensureFrameStyle, buildFrameHtml, clearPriorRoots, fitStageToCanvas, wrapUnmount } from './overlayBase';

export interface BattleOverlayOptions {
  round: number;
  totalRounds: number;
  roundLabel: string;
  speedLabel: string;
  isBoss: boolean;
  subheadingBattle: string;
  subheadingBoss: string;
  initialSpeed: number;
}

export interface BattleOverlayHandle {
  setSpeed(x: number): void;
  setDimmed(dim: boolean): void;
  unmount(): void;
}

const ROOT_CLASS = 'soul-strike-battle-overlay';
const STYLE_ID = 'soul-strike-battle-overlay-style';

const CSS = `
.${ROOT_CLASS}{
  position:fixed;inset:0;z-index:95;
  color:#e8ecf2;font-family:'Rajdhani',system-ui,sans-serif;
  pointer-events:none;opacity:0;transition:opacity 220ms ease;
  background:transparent;overflow:hidden;
}
.${ROOT_CLASS}.visible{opacity:1}
.${ROOT_CLASS}.dimmed{opacity:0;transition:opacity 120ms ease}
.${ROOT_CLASS} .stage{
  width:1280px;height:720px;position:absolute;left:50%;top:50%;
  transform:translate(-50%,-50%);
  pointer-events:none;
}
.${ROOT_CLASS} .round{
  position:absolute;left:50%;top:22px;transform:translateX(-50%);
  font-family:'Bebas Neue',sans-serif;font-size:46px;letter-spacing:.05em;color:#fff;
  line-height:1;
  text-shadow:0 0 18px rgba(255,217,74,.2);
}
.${ROOT_CLASS} .round .sep{color:#8da0ba;margin:0 10px}
.${ROOT_CLASS} .round .total{color:#8da0ba;font-size:34px}
.${ROOT_CLASS} .subheading{
  position:absolute;left:50%;top:78px;transform:translateX(-50%);
  font-size:15px;letter-spacing:.3em;color:#fff;text-transform:uppercase;
  font-weight:500;
}
.${ROOT_CLASS} .subheading.boss{color:#ff7a00;text-shadow:0 0 12px rgba(255,122,0,.5)}
.${ROOT_CLASS} .speed{
  position:absolute;right:24px;top:48px;
  font-size:14px;letter-spacing:.18em;color:#cfd8e4;opacity:.85;
  font-variant-numeric:tabular-nums;
}
.${ROOT_CLASS} .speed b{color:#ffd94a;font-weight:600;margin-left:4px}
`;

export function mountBattleOverlay(opts: BattleOverlayOptions): BattleOverlayHandle {
  ensureFrameStyle();
  ensureStyle(STYLE_ID, CSS);
  clearPriorRoots(ROOT_CLASS);

  const root = document.createElement('div');
  root.className = ROOT_CLASS;
  root.innerHTML = `
    <div class="stage">
      ${buildFrameHtml({
        tagLeft: `<b>SS</b>-<b>004</b> / COMBAT <span class="bar"></span> ${opts.isBoss ? 'BOSS' : 'BATTLE'}`,
        tagRight: `ROUND <span class="bar"></span> <b>${opts.round}</b> / ${opts.totalRounds}`,
        showGrid: false,
        showVignette: false,
      })}
      <div class="round">
        <span class="label">${esc(opts.roundLabel)}</span>
        <span class="current">${opts.round}</span>
        <span class="sep">/</span>
        <span class="total">${opts.totalRounds}</span>
      </div>
      <div class="subheading${opts.isBoss ? ' boss' : ''}">
        ${opts.isBoss ? esc(opts.subheadingBoss) : esc(opts.subheadingBattle)}
      </div>
      <div class="speed">(S) ${esc(opts.speedLabel)}<b data-role="speed">x${opts.initialSpeed}</b></div>
    </div>
  `;
  document.body.appendChild(root);

  const stage = root.querySelector('.stage') as HTMLElement;
  const speedEl = root.querySelector('[data-role="speed"]') as HTMLElement;

  const disposeFit = fitStageToCanvas(stage);
  requestAnimationFrame(() => root.classList.add('visible'));

  return {
    setSpeed(x: number): void {
      speedEl.textContent = `x${x}`;
    },
    setDimmed(dim: boolean): void {
      root.classList.toggle('dimmed', dim);
    },
    unmount: wrapUnmount(root, disposeFit),
  };
}
