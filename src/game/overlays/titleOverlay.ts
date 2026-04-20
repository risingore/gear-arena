/**
 * Title screen HTML overlay.
 *
 * Ported verbatim from the Claude Design handoff (Title A v2.html) so we
 * get browser-native text rendering + SVG vector graphics at full DPI,
 * which the Phaser Canvas renderer cannot match. The overlay floats on
 * top of the Phaser canvas while the Title scene is active, and is
 * unmounted when the scene shuts down so the gameplay canvas takes over.
 *
 * Design constraint: keep the Claude Design structure and visual tokens
 * untouched. Only save-data HUD numbers, localized strings, and button
 * click handlers are wired to the game runtime.
 */

export interface TitleOverlaySaveData {
  readonly bestRound: number;
  readonly victories: number;
  readonly scrap: number;
  readonly playerTitle?: string;
}

export interface TitleOverlayOptions {
  onPlay(): void;
  onCollection(): void;
  onSettings(): void;
  onCredits?(): void;
  saveData?: TitleOverlaySaveData;
  atmanQuoteLine1?: string;
  atmanQuoteLine2?: string;
  atmanAttribution?: string;
  primaryLabel?: string;
  collectionLabel?: string;
  settingsLabel?: string;
  creditsLabel?: string;
}

const STYLE_ELEMENT_ID = 'title-overlay-style';
const ROOT_CLASS = 'soul-strike-title-overlay';

const CSS = `
.${ROOT_CLASS} *{box-sizing:border-box}
.${ROOT_CLASS}{
  position:fixed;inset:0;z-index:100;
  color:#e8ecf2;
  font-family:'Rajdhani',system-ui,sans-serif;
  overflow:hidden;
  opacity:0;transition:opacity 220ms ease;
  pointer-events:none;
  -webkit-user-select:none;user-select:none;
  background:transparent;
}
.${ROOT_CLASS}.visible{opacity:1;pointer-events:auto}
.${ROOT_CLASS} .stage{
  width:1280px;height:720px;position:absolute;overflow:hidden;
  background:radial-gradient(60% 45% at 50% 42%,#142040 0%,#0a0a10 55%,#05060a 100%);
  transform-origin:center center;
  left:50%;top:50%;transform:translate(-50%,-50%);
  pointer-events:none;
}
.${ROOT_CLASS} .stage .menu,
.${ROOT_CLASS} .stage .menu-backing,
.${ROOT_CLASS} .stage .primary,
.${ROOT_CLASS} .stage .secondary{pointer-events:auto}

.${ROOT_CLASS} .grid{position:absolute;inset:0;
  background-image:linear-gradient(rgba(174,234,255,.05) 1px,transparent 1px),linear-gradient(90deg,rgba(174,234,255,.05) 1px,transparent 1px);
  background-size:40px 40px;
  -webkit-mask-image:radial-gradient(70% 60% at 50% 50%,#000 30%,transparent 95%);
          mask-image:radial-gradient(70% 60% at 50% 50%,#000 30%,transparent 95%)}
.${ROOT_CLASS} .vignette{position:absolute;inset:0;pointer-events:none;
  background:radial-gradient(60% 55% at 50% 50%,transparent 0%,rgba(0,0,0,.55) 100%)}

.${ROOT_CLASS} .bracket{position:absolute;width:22px;height:22px;border:1.5px solid #aeeaff;opacity:.5}
.${ROOT_CLASS} .bracket.tl{top:14px;left:14px;border-right:none;border-bottom:none}
.${ROOT_CLASS} .bracket.tr{top:14px;right:14px;border-left:none;border-bottom:none}
.${ROOT_CLASS} .bracket.bl{bottom:14px;left:14px;border-right:none;border-top:none}
.${ROOT_CLASS} .bracket.br{bottom:14px;right:14px;border-left:none;border-top:none}

.${ROOT_CLASS} .tag{position:absolute;font-size:11px;letter-spacing:.28em;color:#aeeaff;opacity:.75;text-transform:uppercase;font-variant-numeric:tabular-nums}
.${ROOT_CLASS} .tag b{color:#ff7a00}
.${ROOT_CLASS} .tag .bar{display:inline-block;width:36px;height:2px;background:#ff7a00;vertical-align:middle;margin:0 6px}

.${ROOT_CLASS} .mandala-wrap{position:absolute;left:50%;top:320px;transform:translate(-50%,-50%);width:560px;height:560px;pointer-events:none}
.${ROOT_CLASS} .ring-outer,.${ROOT_CLASS} .ring-inner{position:absolute;inset:0}
.${ROOT_CLASS} .ring-outer{animation: spinCW 28s linear infinite}
.${ROOT_CLASS} .ring-inner{animation: spinCCW 42s linear infinite}
@keyframes spinCW{to{transform:rotate(360deg)}}
@keyframes spinCCW{to{transform:rotate(-360deg)}}

.${ROOT_CLASS} .center-pulse{
  position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);
  width:340px;height:340px;border-radius:50%;
  background:radial-gradient(circle,rgba(255,122,0,.35) 0%,rgba(255,122,0,.12) 45%,transparent 70%);
  animation: breathe 1.6s ease-in-out infinite;
  filter:blur(4px);
}
@keyframes breathe{
  0%,100%{opacity:.43;transform:translate(-50%,-50%) scale(.95)}
  50%    {opacity:1;  transform:translate(-50%,-50%) scale(1.05)}
}

.${ROOT_CLASS} .zodiac{position:absolute;inset:0;pointer-events:none}
.${ROOT_CLASS} .zodiac .z{
  position:absolute;left:50%;top:50%;
  font-family:'Rajdhani',sans-serif;font-weight:400;font-size:11px;
  letter-spacing:.32em;text-transform:uppercase;
  color:#aeeaff;opacity:.25;white-space:nowrap;
  transform:translate(-50%,-50%);
}

.${ROOT_CLASS} .center{position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);text-align:center;z-index:3}
.${ROOT_CLASS} .center .soul{
  font-family:'Bebas Neue',sans-serif;font-size:112px;line-height:.88;
  color:#fff;letter-spacing:.01em;
  text-shadow:0 0 32px rgba(174,234,255,.15);margin:0;
}
.${ROOT_CLASS} .center .strike{
  font-family:'Bebas Neue',sans-serif;font-size:112px;line-height:.88;
  color:#ff7a00;letter-spacing:.01em;
  text-shadow:0 0 36px rgba(255,122,0,.55), 0 2px 0 #000;margin:0;
}

.${ROOT_CLASS} .soul-dial{position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);width:260px;height:260px;z-index:2;pointer-events:none}

.${ROOT_CLASS} .menu{
  position:absolute;left:50%;bottom:180px;transform:translateX(-50%);
  display:flex;flex-direction:column;gap:10px;align-items:center;z-index:4;
}
.${ROOT_CLASS} .menu-backing{
  position:absolute;left:50%;bottom:170px;transform:translateX(-50%);
  width:530px;height:130px;
  background:rgba(10,10,16,.7);
  border:1px solid rgba(174,234,255,.12);
  filter:drop-shadow(0 0 18px rgba(10,10,16,.55));
  z-index:3;
  clip-path:polygon(0 0,calc(100% - 14px) 0,100% 14px,100% 100%,14px 100%,0 calc(100% - 14px));
}
.${ROOT_CLASS} .menu .primary{
  width:280px;height:56px;padding:0 22px;
  display:flex;align-items:center;justify-content:center;gap:16px;
  background:linear-gradient(90deg,rgba(255,122,0,.22),rgba(255,122,0,.04));
  border:1px solid #ff7a00;border-left:3px solid #ff7a00;
  filter:drop-shadow(0 0 10px rgba(255,122,0,.45));
  clip-path:polygon(0 0,calc(100% - 14px) 0,100% 14px,100% 100%,14px 100%,0 calc(100% - 14px));
  cursor:pointer;transition:all .15s ease;
}
.${ROOT_CLASS} .menu .primary:hover{background:linear-gradient(90deg,#ff7a00,rgba(255,122,0,.55));filter:drop-shadow(0 0 14px rgba(255,122,0,.7))}
.${ROOT_CLASS} .menu .primary:hover .lbl{color:#0a0a10;text-shadow:none}
.${ROOT_CLASS} .menu .primary .lbl{font-family:'Bebas Neue',sans-serif;font-size:30px;letter-spacing:.1em;color:#fff;text-shadow:0 0 10px rgba(255,122,0,.55);transition:all .15s}

.${ROOT_CLASS} .secondary-row{display:flex;gap:10px}
.${ROOT_CLASS} .secondary{
  width:240px;height:44px;padding:0 18px;
  display:flex;align-items:center;justify-content:center;gap:12px;
  background:linear-gradient(90deg,rgba(174,234,255,.18),rgba(174,234,255,.03));
  border:1px solid rgba(174,234,255,.35);border-left:3px solid rgba(174,234,255,.6);
  filter:drop-shadow(0 0 8px rgba(174,234,255,.2));
  clip-path:polygon(0 0,calc(100% - 10px) 0,100% 10px,100% 100%,10px 100%,0 calc(100% - 10px));
  cursor:pointer;transition:all .15s ease;
}
.${ROOT_CLASS} .secondary:hover{background:linear-gradient(90deg,#3a7fbf,#1f4d80);border-color:#5aaaff;filter:drop-shadow(0 0 12px rgba(90,170,255,.55))}
.${ROOT_CLASS} .secondary:hover .lbl{color:#eaf6ff;text-shadow:0 0 10px rgba(174,234,255,.5)}
.${ROOT_CLASS} .secondary .lbl{font-family:'Bebas Neue',sans-serif;font-size:22px;letter-spacing:.1em;color:#cfd8e4;transition:color .15s}

.${ROOT_CLASS} .pilot-title{
  position:absolute;left:50%;top:116px;transform:translateX(-50%);z-index:4;
  font-size:12px;letter-spacing:.32em;color:#ffd94a;opacity:.7;
  text-align:center;font-weight:500;
}

.${ROOT_CLASS} .atman-quote{
  position:absolute;left:0;right:0;bottom:72px;z-index:4;
  text-align:center;pointer-events:none;
}
.${ROOT_CLASS} .atman-quote .q{
  font-family:'Rajdhani',sans-serif;font-style:italic;font-weight:400;font-size:15px;
  color:rgba(174,234,255,.45);line-height:1.35;
  max-width:620px;margin:0 auto;
  letter-spacing:.02em;
}
.${ROOT_CLASS} .atman-quote .attr{
  margin-top:4px;font-family:'Rajdhani',sans-serif;font-style:italic;font-weight:400;font-size:12px;
  color:rgba(174,234,255,.30);
  max-width:620px;margin-left:auto;margin-right:auto;
  padding-right:min(150px, 20%);
  text-align:right;letter-spacing:.04em;
}

.${ROOT_CLASS} .hud{
  position:absolute;left:50%;transform:translateX(-50%);bottom:34px;z-index:4;
  display:flex;gap:28px;align-items:baseline;
  font-size:11px;letter-spacing:.22em;color:#8da0ba;text-transform:uppercase;font-variant-numeric:tabular-nums;
}
.${ROOT_CLASS} .hud b{color:#fff;font-size:14px;margin-left:6px;font-weight:600}
.${ROOT_CLASS} .hud .gold b{color:#ffd94a}
.${ROOT_CLASS} .hud .sep{opacity:.3;color:#aeeaff}

.${ROOT_CLASS} .footer{position:absolute;left:40px;bottom:34px;font-size:10px;letter-spacing:.22em;color:#6a7687;z-index:4}
.${ROOT_CLASS} .footer .kbd{padding:2px 7px;background:#0e1020;border:1px solid rgba(174,234,255,.3);color:#fff;margin:0 2px}
.${ROOT_CLASS} .credits-link{
  position:absolute;right:40px;bottom:34px;font-size:10px;letter-spacing:.22em;
  color:#6a7687;z-index:5;pointer-events:auto;cursor:pointer;
  background:none;border:none;padding:4px 8px;
  font-family:inherit;text-transform:uppercase;
  transition:color .15s ease;
}
.${ROOT_CLASS} .credits-link:hover{color:#aeeaff}

/* Post-cyberpunk CRT scanlines + holographic glitch tear */
.${ROOT_CLASS} .stage::after{
  content:'';position:absolute;inset:0;pointer-events:none !important;z-index:99;
  background:repeating-linear-gradient(0deg,
    transparent 0,transparent 2px,
    rgba(174,234,255,.035) 3px,transparent 4px);
  opacity:.7;mix-blend-mode:overlay;
  animation:ss-scanline 2.4s steps(40) infinite;
}
@keyframes ss-scanline{from{background-position:0 0}to{background-position:0 4px}}

.${ROOT_CLASS} .stage::before{
  content:'';position:absolute;inset:-4px;pointer-events:none;z-index:98;
  background:linear-gradient(90deg,transparent 0%,rgba(255,122,0,.18) 48%,rgba(174,234,255,.22) 52%,transparent 100%);
  opacity:0;
  animation:ss-glitch-tear 7.3s ease-in infinite;
}
@keyframes ss-glitch-tear{
  0%,88%,100%{opacity:0;transform:translate(0,0) skewX(0deg)}
  89%{opacity:.85;transform:translate(3px,18px) skewX(-2deg)}
  91%{opacity:.55;transform:translate(-5px,-22px) skewX(3deg)}
  93%{opacity:.75;transform:translate(2px,9px) skewX(-1deg)}
  95%{opacity:0;transform:translate(0,0) skewX(0deg)}
}

.${ROOT_CLASS} .stage > *{animation-fill-mode:both}
.${ROOT_CLASS}.visible .stage .center{animation:titleIn .7s cubic-bezier(.2,.9,.25,1.15) both}
.${ROOT_CLASS}.visible .stage .menu{animation:fadeUp .5s ease both .5s}
.${ROOT_CLASS}.visible .stage .menu-backing{animation:fadeUp .5s ease both .45s}
.${ROOT_CLASS}.visible .stage .atman-quote{animation:fadeIn 1.2s ease both .8s}
.${ROOT_CLASS}.visible .stage .hud{animation:fadeUp .5s ease both .9s}
.${ROOT_CLASS}.visible .stage .pilot-title{animation:fadeIn .8s ease both .6s}
@keyframes titleIn{from{opacity:0;transform:translate(-50%,-40%) scale(1.08)}to{opacity:1;transform:translate(-50%,-50%) scale(1)}}
@keyframes fadeUp{from{opacity:0;transform:translateX(-50%) translateY(10px)}to{opacity:1;transform:translateX(-50%) translateY(0)}}
@keyframes fadeIn{from{opacity:0}to{opacity:1}}
`;

function ensureStyle(): void {
  if (document.getElementById(STYLE_ELEMENT_ID)) return;
  const style = document.createElement('style');
  style.id = STYLE_ELEMENT_ID;
  style.textContent = CSS;
  document.head.appendChild(style);
}

function buildStageHtml(opts: TitleOverlayOptions): string {
  const primary = opts.primaryLabel ?? 'PLAY';
  const collection = opts.collectionLabel ?? 'COLLECTION';
  const settings = opts.settingsLabel ?? 'SETTINGS';
  const q1 = opts.atmanQuoteLine1 ?? '&ldquo;The soul is a myth.';
  const q2 = opts.atmanQuoteLine2 ?? "What you call &lsquo;soul&rsquo; is merely unprocessed data.&rdquo;";
  const attr = opts.atmanAttribution ?? '— ATMAN, broadcast';

  const pilotLine = opts.saveData?.playerTitle
    ? `<div class="pilot-title">— ${escapeHtml(opts.saveData.playerTitle)} —</div>`
    : '';

  const hud = opts.saveData && (opts.saveData.bestRound > 0 || opts.saveData.victories > 0)
    ? `
    <div class="hud">
      <span>BEST ROUND <b>${String(opts.saveData.bestRound).padStart(2, '0')}</b></span>
      <span class="sep">◆</span>
      <span>VICTORIES <b>${opts.saveData.victories}</b></span>
      <span class="sep">◆</span>
      <span class="gold">SCRAP <b>${opts.saveData.scrap.toLocaleString()}</b></span>
    </div>`
    : '';

  return `
  <div class="stage" data-screen-label="01 Title">
    <div class="grid"></div>
    <div class="vignette"></div>

    <div class="bracket tl"></div><div class="bracket tr"></div>
    <div class="bracket bl"></div><div class="bracket br"></div>
    <div class="tag" style="top:18px;left:22px"><b>SS</b>-<b>001</b> / BLUEPRINT <span class="bar"></span> REV.05</div>
    <div class="tag" style="top:18px;right:22px">GAMEDEV.JS JAM <b>2026</b> · THEME <span class="bar"></span> <b>MACHINES</b></div>

    <div class="mandala-wrap">
      <div class="center-pulse"></div>

      <div class="ring-outer">
        <svg width="560" height="560" viewBox="0 0 560 560" style="position:absolute;inset:0">
          <defs>
            <radialGradient id="tolCoreGlow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stop-color="#ff7a00" stop-opacity="0.4"/>
              <stop offset="50%" stop-color="#ff7a00" stop-opacity="0.1"/>
              <stop offset="100%" stop-color="#ff7a00" stop-opacity="0"/>
            </radialGradient>
          </defs>
          <circle cx="280" cy="280" r="180" fill="url(#tolCoreGlow)"/>
          <circle cx="280" cy="280" r="260" fill="none" stroke="#aeeaff" stroke-width="1" stroke-opacity=".38"/>
          <circle cx="280" cy="280" r="210" fill="none" stroke="#aeeaff" stroke-width="1" stroke-opacity=".22" stroke-dasharray="4 8"/>
          <line x1="20" y1="280" x2="540" y2="280" stroke="#aeeaff" stroke-opacity="0.18" stroke-dasharray="2 8"/>
          <line x1="280" y1="20" x2="280" y2="540" stroke="#aeeaff" stroke-opacity="0.18" stroke-dasharray="2 8"/>
          <g class="notches"></g>
        </svg>
        <div class="zodiac"></div>
      </div>

      <div class="ring-inner">
        <svg width="560" height="560" viewBox="0 0 560 560" style="position:absolute;inset:0">
          <circle cx="280" cy="280" r="170" fill="none" stroke="#aeeaff" stroke-width="1.5" stroke-opacity=".55"/>
          <circle cx="280" cy="280" r="120" fill="none" stroke="#aeeaff" stroke-width="1" stroke-opacity=".3" stroke-dasharray="2 6"/>
        </svg>
      </div>

      <svg class="soul-dial" width="260" height="260" viewBox="0 0 260 260">
        <circle cx="130" cy="130" r="108" fill="none" stroke="#0e1020" stroke-width="12"/>
        <circle cx="130" cy="130" r="108" fill="none" stroke="#ff7a00" stroke-width="12"
          stroke-dasharray="393.4 678.6"
          transform="rotate(-90 130 130)"
          style="filter:drop-shadow(0 0 8px #ff7a00)"/>
        <g class="dialTicks"></g>
      </svg>

      <div class="center">
        <div class="soul">SOUL</div>
        <div class="strike">STRIKE</div>
      </div>
    </div>

    ${pilotLine}

    <div class="menu-backing"></div>
    <div class="menu">
      <div class="primary" data-role="play"><span class="lbl">${escapeHtml(primary)}</span></div>
      <div class="secondary-row">
        <div class="secondary" data-role="collection"><span class="lbl">${escapeHtml(collection)}</span></div>
        <div class="secondary" data-role="settings"><span class="lbl">${escapeHtml(settings)}</span></div>
      </div>
    </div>

    <div class="atman-quote">
      <div class="q">${q1}<br/>${q2}</div>
      <div class="attr">${attr}</div>
    </div>

    ${hud}

    <div class="footer">PRESS <span class="kbd">SPACE</span> / NAV <span class="kbd">MOUSE</span></div>
    <button class="credits-link" data-role="credits">${escapeHtml(opts.creditsLabel ?? 'CREDITS')}</button>
  </div>`;
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function drawNotches(root: HTMLElement): void {
  const NS = 'http://www.w3.org/2000/svg';
  const g = root.querySelector('.notches');
  if (!g) return;
  const N = 48;
  const cx = 280, cy = 280, r = 260;
  for (let i = 0; i < N; i += 1) {
    const major = i % 6 === 0;
    const accent = i === 0 || i === 24;
    const ang = (i / N) * 360 - 90;
    const rad = (ang * Math.PI) / 180;
    const len = major ? 18 : 10;
    const w = major ? 2 : 1;
    const x1 = cx + Math.cos(rad) * r;
    const y1 = cy + Math.sin(rad) * r;
    const x2 = cx + Math.cos(rad) * (r - len);
    const y2 = cy + Math.sin(rad) * (r - len);
    const line = document.createElementNS(NS, 'line');
    line.setAttribute('x1', String(x1));
    line.setAttribute('y1', String(y1));
    line.setAttribute('x2', String(x2));
    line.setAttribute('y2', String(y2));
    line.setAttribute('stroke', accent ? '#ff7a00' : '#aeeaff');
    line.setAttribute('stroke-width', String(w));
    line.setAttribute('stroke-opacity', String(accent ? 0.9 : major ? 0.55 : 0.28));
    g.appendChild(line);
  }
}

function drawZodiac(root: HTMLElement): void {
  const z = root.querySelector('.zodiac');
  if (!z) return;
  const cats = ['MODULE', 'IMPLANT', 'CHARGER', 'BOOSTER', 'SOUL'];
  const R = 238;
  const cx = 280, cy = 280;
  cats.forEach((c, i) => {
    const ang = (i / cats.length) * 360 - 54;
    const rad = (ang * Math.PI) / 180;
    const x = cx + Math.cos(rad) * R;
    const y = cy + Math.sin(rad) * R;
    const el = document.createElement('div');
    el.className = 'z';
    el.style.left = x + 'px';
    el.style.top = y + 'px';
    el.style.transform = `translate(-50%,-50%) rotate(${ang + 90}deg)`;
    el.textContent = c;
    z.appendChild(el);
  });
}

function drawDialTicks(root: HTMLElement): void {
  const NS = 'http://www.w3.org/2000/svg';
  const g = root.querySelector('.dialTicks');
  if (!g) return;
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
    g.appendChild(line);
  }
}

export function mountTitleOverlay(opts: TitleOverlayOptions): () => void {
  ensureStyle();

  // If a previous overlay is still animating out from the last mount,
  // remove it immediately — otherwise its DOM tree intercepts pointer
  // events for ~240 ms, breaking click-to-play on rapid scene loops.
  document.querySelectorAll(`.${ROOT_CLASS}`).forEach((el) => el.remove());

  const root = document.createElement('div');
  root.className = ROOT_CLASS;
  root.innerHTML = buildStageHtml(opts);
  document.body.appendChild(root);

  drawNotches(root);
  drawZodiac(root);
  drawDialTicks(root);

  // Track the Phaser canvas' on-screen rect so the overlay stage overlaps it
  // exactly — Phaser uses Scale.FIT + flex-center on #game-container, which
  // puts the canvas at an offset that window-relative math won't match.
  const stage = root.querySelector('.stage') as HTMLElement | null;
  const canvasEl = document.querySelector(
    '#game-container canvas'
  ) as HTMLCanvasElement | null;

  const fit = (): void => {
    if (!stage) return;
    const rect = canvasEl?.getBoundingClientRect();
    const w = rect && rect.width > 0 ? rect.width : window.innerWidth;
    const h = rect && rect.height > 0 ? rect.height : window.innerHeight;
    const cx = rect ? rect.left + w / 2 : window.innerWidth / 2;
    const cy = rect ? rect.top + h / 2 : window.innerHeight / 2;
    const s = Math.min(w / 1280, h / 720);
    stage.style.left = `${cx}px`;
    stage.style.top = `${cy}px`;
    stage.style.transform = `translate(-50%, -50%) scale(${s})`;
  };
  window.addEventListener('resize', fit);
  // Phaser can resize the canvas without firing window resize — observe it.
  let ro: ResizeObserver | null = null;
  if (canvasEl && typeof ResizeObserver !== 'undefined') {
    ro = new ResizeObserver(() => fit());
    ro.observe(canvasEl);
  }
  fit();

  // Button wiring
  const onClick = (role: 'play' | 'collection' | 'settings' | 'credits', handler: () => void): void => {
    const el = root.querySelector(`[data-role="${role}"]`) as HTMLElement | null;
    if (!el) return;
    el.addEventListener('click', () => handler());
  };
  onClick('play', opts.onPlay);
  onClick('collection', opts.onCollection);
  onClick('settings', opts.onSettings);
  if (opts.onCredits) onClick('credits', opts.onCredits);

  // Fade in on next frame
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
