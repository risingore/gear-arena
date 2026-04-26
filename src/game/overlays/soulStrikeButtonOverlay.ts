/**
 * SOUL STRIKE button overlay.
 *
 * Replaces the flat yellow rectangle with a Title-style mandala ring:
 * concentric rotating cyan rings, breathing orange center-pulse,
 * and "SOUL STRIKE" centered in Bebas Neue. Mounted when the ult gauge
 * fills during combat; click or SPACE fires `onFire`.
 */

import {
  ensureStyle,
  ensureFrameStyle,
  clearPriorRoots,
  fitStageToCanvas,
  wrapUnmount,
} from './overlayBase';

export interface SoulStrikeButtonOptions {
  label?: string;
  hint?: string;
  auraHex?: string | null;
  onFire(): void;
}

export interface SoulStrikeButtonHandle {
  setAura(auraHex: string | null): void;
  /** Show or hide the button without unmounting. Used by Battle to
   *  hide the button (DOM, z-index 150) during a boss cut-in so it
   *  doesn't draw on top of the Phaser-canvas reveal. */
  setVisible(visible: boolean): void;
  unmount(): void;
}

const ROOT_CLASS = 'soul-strike-soulbtn-overlay';
const STYLE_ID = 'soul-strike-soulbtn-overlay-style';

const CSS = `
.${ROOT_CLASS}{
  position:fixed;inset:0;z-index:150;
  color:#fff;font-family:'Rajdhani',system-ui,sans-serif;
  pointer-events:none;opacity:0;transition:opacity 220ms ease;
  /* Dim the entire viewport, not just the 1280×720 stage rect — otherwise
   * on viewports wider/taller than the stage a visible dark rectangle
   * appears around the button. */
  background:rgba(0,0,0,.55);
  overflow:hidden;
  -webkit-user-select:none;user-select:none;
}
.${ROOT_CLASS}.visible{opacity:1}
.${ROOT_CLASS} .stage{
  width:1280px;height:720px;position:absolute;left:50%;top:50%;
  transform:translate(-50%,-50%);
  pointer-events:none;background:transparent;
}
.${ROOT_CLASS} .wrap{
  position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);
  width:480px;height:480px;pointer-events:none;
}
.${ROOT_CLASS} .center-pulse{
  position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);
  width:300px;height:300px;border-radius:50%;
  background:radial-gradient(circle,var(--aura-core,rgba(255,122,0,.4)) 0%,var(--aura-core-mid,rgba(255,122,0,.12)) 45%,transparent 70%);
  animation:ssb-breathe 1.2s ease-in-out infinite;
  filter:blur(3px);
}
@keyframes ssb-breathe{
  0%,100%{opacity:.55;transform:translate(-50%,-50%) scale(.92)}
  50%    {opacity:1;  transform:translate(-50%,-50%) scale(1.08)}
}
.${ROOT_CLASS} .ring-outer{position:absolute;inset:0;animation:ssb-spin-cw 14s linear infinite}
.${ROOT_CLASS} .ring-inner{position:absolute;inset:0;animation:ssb-spin-ccw 22s linear infinite}
@keyframes ssb-spin-cw{to{transform:rotate(360deg)}}
@keyframes ssb-spin-ccw{to{transform:rotate(-360deg)}}
.${ROOT_CLASS} .btn{
  position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);
  width:260px;height:260px;border-radius:50%;
  display:flex;align-items:center;justify-content:center;flex-direction:column;gap:2px;
  background:radial-gradient(circle,rgba(10,10,16,.35) 0%,rgba(10,10,16,.7) 70%);
  border:none;outline:none;cursor:pointer;
  pointer-events:auto;
  transition:transform .15s ease, filter .15s ease;
  filter:drop-shadow(0 0 18px var(--aura-glow,rgba(255,122,0,.6)));
}
.${ROOT_CLASS} .btn:hover{transform:translate(-50%,-50%) scale(1.04);filter:drop-shadow(0 0 28px var(--aura-glow,rgba(255,122,0,.85)))}
.${ROOT_CLASS} .btn:active{transform:translate(-50%,-50%) scale(.97)}
.${ROOT_CLASS} .btn .lbl-1{
  font-family:'Bebas Neue',sans-serif;font-size:44px;line-height:.9;
  color:#fff;letter-spacing:.05em;
  text-shadow:0 0 12px rgba(174,234,255,.4);
}
.${ROOT_CLASS} .btn .lbl-2{
  font-family:'Bebas Neue',sans-serif;font-size:48px;line-height:.9;
  color:var(--aura-accent,#ff7a00);letter-spacing:.05em;
  text-shadow:0 0 16px var(--aura-accent-glow,rgba(255,122,0,.6)), 0 2px 0 #000;
}
.${ROOT_CLASS} .btn-pulse{
  position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);
  width:260px;height:260px;border-radius:50%;
  border:2px solid var(--aura-accent,#ff7a00);opacity:.6;
  pointer-events:none;
  animation:ssb-pulse 1.3s ease-out infinite;
}
@keyframes ssb-pulse{
  0%  {transform:translate(-50%,-50%) scale(1);opacity:.7}
  100%{transform:translate(-50%,-50%) scale(1.45);opacity:0}
}
.${ROOT_CLASS} .hint{
  position:absolute;left:50%;top:calc(50% + 200px);transform:translateX(-50%);
  font-size:12px;letter-spacing:.3em;color:rgba(174,234,255,.7);text-transform:uppercase;
  animation:ssb-hint 1.6s ease-in-out infinite;
}
@keyframes ssb-hint{0%,100%{opacity:.45}50%{opacity:1}}
`;

export function mountSoulStrikeButton(opts: SoulStrikeButtonOptions): SoulStrikeButtonHandle {
  ensureFrameStyle();
  ensureStyle(STYLE_ID, CSS);
  clearPriorRoots(ROOT_CLASS);

  const root = document.createElement('div');
  root.className = ROOT_CLASS;
  const label = opts.label ?? 'SOUL STRIKE';
  const [lbl1, lbl2] = (() => {
    const parts = label.split(' ');
    if (parts.length >= 2) return [parts[0], parts.slice(1).join(' ')];
    return ['', label];
  })();
  root.innerHTML = `
    <div class="stage">
      <div class="wrap">
        <div class="center-pulse"></div>
        <div class="ring-outer">
          <svg width="480" height="480" viewBox="0 0 480 480" style="position:absolute;inset:0">
            <circle cx="240" cy="240" r="220" fill="none" stroke="#aeeaff" stroke-width="1" stroke-opacity=".35"/>
            <circle cx="240" cy="240" r="180" fill="none" stroke="#aeeaff" stroke-width="1" stroke-opacity=".22" stroke-dasharray="4 8"/>
            <line x1="20" y1="240" x2="460" y2="240" stroke="#aeeaff" stroke-opacity="0.18" stroke-dasharray="2 8"/>
            <line x1="240" y1="20" x2="240" y2="460" stroke="#aeeaff" stroke-opacity="0.18" stroke-dasharray="2 8"/>
          </svg>
        </div>
        <div class="ring-inner">
          <svg width="480" height="480" viewBox="0 0 480 480" style="position:absolute;inset:0">
            <circle cx="240" cy="240" r="148" fill="none" stroke="#aeeaff" stroke-width="1.5" stroke-opacity=".55"/>
            <circle cx="240" cy="240" r="100" fill="none" stroke="#aeeaff" stroke-width="1" stroke-opacity=".3" stroke-dasharray="2 6"/>
          </svg>
        </div>
        <div class="btn-pulse"></div>
        <button class="btn" data-role="fire">
          ${lbl1 ? `<span class="lbl-1">${lbl1}</span>` : ''}
          <span class="lbl-2">${lbl2}</span>
        </button>
      </div>
      ${opts.hint ? `<div class="hint">${opts.hint}</div>` : ''}
    </div>
  `;
  document.body.appendChild(root);

  const stage = root.querySelector('.stage') as HTMLElement;
  const btn = root.querySelector('[data-role="fire"]') as HTMLButtonElement;

  const applyAura = (hex: string | null): void => {
    if (hex) {
      stage.style.setProperty('--aura-accent', hex);
      stage.style.setProperty('--aura-accent-glow', hexToAlpha(hex, 0.6));
      stage.style.setProperty('--aura-core', hexToAlpha(hex, 0.4));
      stage.style.setProperty('--aura-core-mid', hexToAlpha(hex, 0.12));
      stage.style.setProperty('--aura-glow', hexToAlpha(hex, 0.6));
    } else {
      stage.style.removeProperty('--aura-accent');
      stage.style.removeProperty('--aura-accent-glow');
      stage.style.removeProperty('--aura-core');
      stage.style.removeProperty('--aura-core-mid');
      stage.style.removeProperty('--aura-glow');
    }
  };
  applyAura(opts.auraHex ?? null);

  btn.addEventListener('click', () => opts.onFire());

  const disposeFit = fitStageToCanvas(stage);
  requestAnimationFrame(() => root.classList.add('visible'));

  return {
    setAura: applyAura,
    setVisible: (visible: boolean) => { root.style.display = visible ? '' : 'none'; },
    unmount: wrapUnmount(root, disposeFit),
  };
}

function hexToAlpha(hex: string, alpha: number): string {
  const m = /^#?([a-f0-9]{6})$/i.exec(hex);
  if (!m) return hex;
  const n = parseInt(m[1]!, 16);
  const r = (n >> 16) & 0xff;
  const g = (n >> 8) & 0xff;
  const b = n & 0xff;
  return `rgba(${r},${g},${b},${alpha})`;
}
