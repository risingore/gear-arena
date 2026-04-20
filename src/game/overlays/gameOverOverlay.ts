/**
 * GameOver HTML overlay — minimal DOM version so the large "GAME OVER"
 * headline and run summary render at full native resolution instead of
 * the softer Phaser Canvas text. Buttons still route through Phaser
 * scene transitions so keyboard shortcuts keep working.
 */

import { ensureFrameStyle, buildFrameHtml } from './overlayBase';

export interface GameOverOverlayOptions {
  round: number;
  totalRounds: number;
  scrapEarned: number;
  statsLines: readonly string[];
  hint: string;
  onReturnToTitle(): void;
  returnLabel?: string;
}

const ROOT_CLASS = 'soul-strike-gameover-overlay';
const STYLE_ID = 'soul-strike-gameover-overlay-style';

const CSS = `
.${ROOT_CLASS}{
  position:fixed;inset:0;z-index:100;
  color:#e8ecf2;font-family:'Rajdhani',system-ui,sans-serif;
  pointer-events:none;opacity:0;transition:opacity 220ms ease;
  background:transparent;
  overflow:hidden;
}
.${ROOT_CLASS}.visible{opacity:1;pointer-events:auto}
.${ROOT_CLASS} .stage{
  width:1280px;height:720px;
  position:absolute;left:50%;top:50%;
  transform:translate(-50%,-50%);
  display:flex;flex-direction:column;align-items:center;justify-content:center;
  gap:18px;
}
.${ROOT_CLASS} .title{
  font-family:'Bebas Neue',sans-serif;font-size:88px;letter-spacing:.04em;
  color:#ff4444;text-shadow:0 0 20px rgba(255,68,68,.4);margin:0;
}
.${ROOT_CLASS} .round{
  font-size:18px;letter-spacing:.2em;color:#cfd8e4;
}
.${ROOT_CLASS} .scrap{
  font-size:14px;letter-spacing:.18em;color:#aeeaff;opacity:.85;
}
.${ROOT_CLASS} .stats{
  text-align:center;font-size:12px;letter-spacing:.1em;color:#8da0ba;
  line-height:1.6;
}
.${ROOT_CLASS} .hint{
  margin-top:10px;padding:8px 18px;
  font-size:12px;letter-spacing:.12em;color:#ffd94a;
  background:rgba(10,10,16,.6);
  border:1px solid rgba(255,217,74,.35);
}
.${ROOT_CLASS} .return{
  margin-top:24px;
  width:280px;height:48px;
  display:flex;align-items:center;justify-content:center;
  font-family:'Bebas Neue',sans-serif;font-size:22px;letter-spacing:.14em;
  color:#fff;
  background:linear-gradient(90deg,rgba(255,68,68,.22),rgba(255,68,68,.04));
  border:1px solid #ff4444;border-left:3px solid #ff4444;
  box-shadow:0 0 20px rgba(255,68,68,.35);
  cursor:pointer;transition:background .15s;
}
.${ROOT_CLASS} .return:hover{background:linear-gradient(90deg,#ff4444,rgba(255,68,68,.5))}
.${ROOT_CLASS} .credits{
  margin-top:18px;
  text-align:center;font-size:10px;letter-spacing:.22em;color:#6a7687;
  line-height:1.6;text-transform:uppercase;
}
.${ROOT_CLASS} .credits b{color:#aeeaff;font-weight:500;letter-spacing:.16em}
`;

function ensureStyle(): void {
  if (document.getElementById(STYLE_ID)) return;
  const style = document.createElement('style');
  style.id = STYLE_ID;
  style.textContent = CSS;
  document.head.appendChild(style);
}

function esc(s: string): string {
  return s.replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c] ?? c));
}

export function mountGameOverOverlay(opts: GameOverOverlayOptions): () => void {
  ensureStyle();

  document.querySelectorAll(`.${ROOT_CLASS}`).forEach((el) => el.remove());

  const root = document.createElement('div');
  root.className = ROOT_CLASS;

  const statsHtml = opts.statsLines.map(esc).join('<br/>');
  const scrapHtml = opts.scrapEarned > 0
    ? `<div class="scrap">+${opts.scrapEarned} Scrap</div>`
    : '';

  ensureFrameStyle();
  root.innerHTML = `
    <div class="stage ss-stage">
      ${buildFrameHtml({
        tagLeft: '<b>SS</b>-<b>066</b> / FLATLINE <span class="bar"></span> TERMINATED',
        tagRight: `REACHED <span class="bar"></span> <b>${opts.round}</b> / ${opts.totalRounds}`,
      })}
      <div class="title">GAME OVER</div>
      <div class="round">REACHED ROUND ${opts.round} / ${opts.totalRounds}</div>
      ${scrapHtml}
      <div class="stats">${statsHtml}</div>
      <div class="hint">${esc(opts.hint)}</div>
      <div class="return" data-role="return">${esc(opts.returnLabel ?? 'RETURN TO TITLE')}</div>
      <div class="credits">
        <b>SOUL STRIKE</b> · GAMEDEV.JS JAM 2026 · THEME MACHINES<br/>
        PHASER 4 · TYPESCRIPT · VITE · BUN
      </div>
    </div>
  `;

  document.body.appendChild(root);

  const fit = (): void => {
    const stage = root.querySelector('.stage') as HTMLElement | null;
    const canvas = document.querySelector('#game-container canvas') as HTMLCanvasElement | null;
    if (!stage || !canvas) return;
    const rect = canvas.getBoundingClientRect();
    const s = Math.min(rect.width / 1280, rect.height / 720);
    stage.style.left = `${rect.left + rect.width / 2}px`;
    stage.style.top = `${rect.top + rect.height / 2}px`;
    stage.style.transform = `translate(-50%, -50%) scale(${s})`;
  };
  window.addEventListener('resize', fit);
  let ro: ResizeObserver | null = null;
  const canvasEl = document.querySelector('#game-container canvas');
  if (canvasEl && typeof ResizeObserver !== 'undefined') {
    ro = new ResizeObserver(() => fit());
    ro.observe(canvasEl);
  }
  fit();

  const btn = root.querySelector('[data-role="return"]') as HTMLElement | null;
  btn?.addEventListener('click', () => opts.onReturnToTitle());

  requestAnimationFrame(() => root.classList.add('visible'));

  return (): void => {
    root.classList.remove('visible');
    window.removeEventListener('resize', fit);
    if (ro) ro.disconnect();
    window.setTimeout(() => {
      if (root.parentNode) root.parentNode.removeChild(root);
    }, 240);
  };
}
