/**
 * Mandala HTML component — extracted from titleOverlay so Battle cut-in
 * and other future scenes can reuse the same ritual circle visual.
 *
 * Built from pure SVG + CSS so it inherits browser-native rendering:
 *   - crisp at any resolution (Retina / 4K)
 *   - animated via CSS keyframes (spin CW/CCW, breathing pulse)
 *   - sub-pixel positioning via SVG vector math
 *
 * Call `renderMandalaMarkup()` for the inline HTML string (for embedding in
 * a larger overlay), or `mountMandalaOverlay()` for a standalone fullscreen
 * overlay (for cut-in animations).
 */

export interface MandalaMarkupOptions {
  /** Soul dial fill 0..1. Default 0.58. */
  readonly soulDialProgress?: number;
  /** Show central "SOUL STRIKE" title inside the mandala. Default true for Title, false elsewhere. */
  readonly showTitle?: boolean;
  /** Zodiac category labels. Default MODULE/IMPLANT/CHARGER/BOOSTER/SOUL. */
  readonly zodiacLabels?: readonly string[];
  /** Suffix id for SVG <defs> to avoid cross-instance collisions. */
  readonly idSuffix?: string;
}

export interface MandalaOverlayOptions extends MandalaMarkupOptions {
  /** Called when the overlay is removed from the DOM. */
  onDismiss?(): void;
  /** Auto-dismiss after this many ms. Omit to disable. */
  autoDismissMs?: number;
}

const OVERLAY_ROOT_CLASS = 'soul-strike-mandala-overlay';

/**
 * Inline-SVG markup for the mandala. Call this when you want to embed the
 * mandala inside another larger HTML overlay (like the Title screen).
 */
export function renderMandalaMarkup(opts: MandalaMarkupOptions = {}): string {
  const progress = opts.soulDialProgress ?? 0.58;
  const titleMarkup = opts.showTitle ?? true
    ? '<div class="mandala-center"><div class="mandala-soul">SOUL</div><div class="mandala-strike">STRIKE</div></div>'
    : '';
  const idSuffix = opts.idSuffix ?? 'default';

  // Soul dial arc: stroke-dasharray driven. Circle circumference at r=108
  // is 2πr ≈ 678.58. Fill length is progress × circumference.
  const circumference = 2 * Math.PI * 108;
  const fillLen = circumference * progress;
  const restLen = circumference - fillLen;

  return `
  <div class="mandala-wrap">
    <div class="mandala-pulse"></div>

    <div class="mandala-ring-outer">
      <svg width="560" height="560" viewBox="0 0 560 560" style="position:absolute;inset:0">
        <defs>
          <radialGradient id="mandalaCore_${idSuffix}" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stop-color="#ff7a00" stop-opacity="0.4"/>
            <stop offset="50%" stop-color="#ff7a00" stop-opacity="0.1"/>
            <stop offset="100%" stop-color="#ff7a00" stop-opacity="0"/>
          </radialGradient>
        </defs>
        <circle cx="280" cy="280" r="180" fill="url(#mandalaCore_${idSuffix})"/>
        <circle cx="280" cy="280" r="260" fill="none" stroke="#aeeaff" stroke-width="1" stroke-opacity=".38"/>
        <circle cx="280" cy="280" r="210" fill="none" stroke="#aeeaff" stroke-width="1" stroke-opacity=".22" stroke-dasharray="4 8"/>
        <line x1="20" y1="280" x2="540" y2="280" stroke="#aeeaff" stroke-opacity="0.18" stroke-dasharray="2 8"/>
        <line x1="280" y1="20" x2="280" y2="540" stroke="#aeeaff" stroke-opacity="0.18" stroke-dasharray="2 8"/>
        <g class="mandala-notches"></g>
      </svg>
      <div class="mandala-zodiac"></div>
    </div>

    <div class="mandala-ring-inner">
      <svg width="560" height="560" viewBox="0 0 560 560" style="position:absolute;inset:0">
        <circle cx="280" cy="280" r="170" fill="none" stroke="#aeeaff" stroke-width="1.5" stroke-opacity=".55"/>
        <circle cx="280" cy="280" r="120" fill="none" stroke="#aeeaff" stroke-width="1" stroke-opacity=".3" stroke-dasharray="2 6"/>
      </svg>
    </div>

    <svg class="mandala-soul-dial" width="260" height="260" viewBox="0 0 260 260">
      <circle cx="130" cy="130" r="108" fill="none" stroke="#0e1020" stroke-width="12"/>
      <circle cx="130" cy="130" r="108" fill="none" stroke="#ff7a00" stroke-width="12"
        stroke-dasharray="${fillLen.toFixed(1)} ${restLen.toFixed(1)}"
        transform="rotate(-90 130 130)"
        style="filter:drop-shadow(0 0 8px #ff7a00)"/>
      <g class="mandala-dial-ticks"></g>
    </svg>

    ${titleMarkup}
  </div>`;
}

/**
 * CSS for the mandala. Scope-safe: all rules are prefixed with either the
 * overlay root class or a parent .stage wrapper.
 */
export const MANDALA_CSS = `
.mandala-wrap{position:absolute;left:50%;top:320px;transform:translate(-50%,-50%);width:560px;height:560px;pointer-events:none}
.mandala-ring-outer,.mandala-ring-inner{position:absolute;inset:0}
.mandala-ring-outer{animation: mandalaSpinCW 28s linear infinite}
.mandala-ring-inner{animation: mandalaSpinCCW 42s linear infinite}
@keyframes mandalaSpinCW{to{transform:rotate(360deg)}}
@keyframes mandalaSpinCCW{to{transform:rotate(-360deg)}}

.mandala-pulse{
  position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);
  width:340px;height:340px;border-radius:50%;
  background:radial-gradient(circle,rgba(255,122,0,.35) 0%,rgba(255,122,0,.12) 45%,transparent 70%);
  animation: mandalaBreathe 1.6s ease-in-out infinite;
  filter:blur(4px);
}
@keyframes mandalaBreathe{
  0%,100%{opacity:.43;transform:translate(-50%,-50%) scale(.95)}
  50%    {opacity:1;  transform:translate(-50%,-50%) scale(1.05)}
}

.mandala-zodiac{position:absolute;inset:0;pointer-events:none}
.mandala-zodiac .z{
  position:absolute;left:50%;top:50%;
  font-family:'Rajdhani',sans-serif;font-weight:400;font-size:11px;
  letter-spacing:.32em;text-transform:uppercase;
  color:#aeeaff;opacity:.25;white-space:nowrap;
  transform:translate(-50%,-50%);
}

.mandala-soul-dial{position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);width:260px;height:260px;z-index:2;pointer-events:none}

.mandala-center{position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);text-align:center;z-index:3}
.mandala-center .mandala-soul{
  font-family:'Bebas Neue',sans-serif;font-size:112px;line-height:.88;
  color:#fff;letter-spacing:.01em;
  text-shadow:0 0 32px rgba(174,234,255,.15);margin:0;
}
.mandala-center .mandala-strike{
  font-family:'Bebas Neue',sans-serif;font-size:112px;line-height:.88;
  color:#ff7a00;letter-spacing:.01em;
  text-shadow:0 0 36px rgba(255,122,0,.55), 0 2px 0 #000;margin:0;
}
`;

/**
 * Decorate the mandala DOM after it's been injected: add SVG notches
 * (48 ticks, major every 6), zodiac labels, and soul-dial ticks (20).
 * Must be called once after the markup lands in the document.
 */
export function decorateMandala(root: Element, opts: MandalaMarkupOptions = {}): void {
  const labels = opts.zodiacLabels ?? ['MODULE', 'IMPLANT', 'CHARGER', 'BOOSTER', 'SOUL'];

  const NS = 'http://www.w3.org/2000/svg';
  const notches = root.querySelector('.mandala-notches');
  if (notches) {
    for (let i = 0; i < 48; i += 1) {
      const major = i % 6 === 0;
      const accent = i === 0 || i === 24;
      const ang = (i / 48) * 360 - 90;
      const rad = (ang * Math.PI) / 180;
      const len = major ? 18 : 10;
      const w = major ? 2 : 1;
      const x1 = 280 + Math.cos(rad) * 260;
      const y1 = 280 + Math.sin(rad) * 260;
      const x2 = 280 + Math.cos(rad) * (260 - len);
      const y2 = 280 + Math.sin(rad) * (260 - len);
      const line = document.createElementNS(NS, 'line');
      line.setAttribute('x1', String(x1));
      line.setAttribute('y1', String(y1));
      line.setAttribute('x2', String(x2));
      line.setAttribute('y2', String(y2));
      line.setAttribute('stroke', accent ? '#ff7a00' : '#aeeaff');
      line.setAttribute('stroke-width', String(w));
      line.setAttribute('stroke-opacity', String(accent ? 0.9 : major ? 0.55 : 0.28));
      notches.appendChild(line);
    }
  }

  const zodiac = root.querySelector('.mandala-zodiac');
  if (zodiac) {
    labels.forEach((c, i) => {
      const ang = (i / labels.length) * 360 - 54;
      const rad = (ang * Math.PI) / 180;
      const x = 280 + Math.cos(rad) * 238;
      const y = 280 + Math.sin(rad) * 238;
      const el = document.createElement('div');
      el.className = 'z';
      el.style.left = `${x}px`;
      el.style.top = `${y}px`;
      el.style.transform = `translate(-50%, -50%) rotate(${ang + 90}deg)`;
      el.textContent = c;
      zodiac.appendChild(el);
    });
  }

  const dialTicks = root.querySelector('.mandala-dial-ticks');
  if (dialTicks) {
    for (let i = 0; i < 20; i += 1) {
      const line = document.createElementNS(NS, 'line');
      line.setAttribute('x1', '130');
      line.setAttribute('y1', '14');
      line.setAttribute('x2', '130');
      line.setAttribute('y2', '22');
      line.setAttribute('stroke', '#aeeaff');
      line.setAttribute('stroke-opacity', i % 5 === 0 ? '0.8' : '0.3');
      line.setAttribute('stroke-width', i % 5 === 0 ? '1.5' : '1');
      line.setAttribute('transform', `rotate(${i * 18} 130 130)`);
      dialTicks.appendChild(line);
    }
  }
}

/**
 * Mount a full-screen mandala overlay. Use for Battle cut-ins or other
 * moments where the mandala takes over the whole screen briefly.
 * Returns an unmount function.
 */
export function mountMandalaOverlay(opts: MandalaOverlayOptions = {}): () => void {
  const styleId = 'soul-strike-mandala-overlay-style';
  if (!document.getElementById(styleId)) {
    const style = document.createElement('style');
    style.id = styleId;
    style.textContent = `
      .${OVERLAY_ROOT_CLASS}{
        position:fixed;inset:0;z-index:90;pointer-events:none;
        display:grid;place-items:center;
        background:transparent;
        opacity:0;transition:opacity 300ms ease;
      }
      .${OVERLAY_ROOT_CLASS}.visible{opacity:1}
      .${OVERLAY_ROOT_CLASS} .stage{
        width:1280px;height:720px;position:relative;
        transform-origin:center center;
      }
      ${MANDALA_CSS}
    `;
    document.head.appendChild(style);
  }

  document.querySelectorAll(`.${OVERLAY_ROOT_CLASS}`).forEach((el) => el.remove());

  const root = document.createElement('div');
  root.className = OVERLAY_ROOT_CLASS;
  root.innerHTML = `<div class="stage">${renderMandalaMarkup(opts)}</div>`;
  document.body.appendChild(root);
  decorateMandala(root, opts);

  const fit = (): void => {
    const stage = root.querySelector('.stage') as HTMLElement | null;
    if (!stage) return;
    const s = Math.min(window.innerWidth / 1280, window.innerHeight / 720);
    stage.style.transform = `scale(${s})`;
  };
  window.addEventListener('resize', fit);
  fit();

  requestAnimationFrame(() => root.classList.add('visible'));

  const unmount = (): void => {
    root.classList.remove('visible');
    window.removeEventListener('resize', fit);
    window.setTimeout(() => {
      if (root.parentNode) root.parentNode.removeChild(root);
      opts.onDismiss?.();
    }, 320);
  };

  if (opts.autoDismissMs && opts.autoDismissMs > 0) {
    window.setTimeout(unmount, opts.autoDismissMs);
  }

  return unmount;
}
