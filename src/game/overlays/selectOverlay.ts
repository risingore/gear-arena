/**
 * Character select HTML overlay.
 *
 * Renders the roster picker as a DOM + inline-img layer on top of the
 * Phaser canvas. Matches the Title / Settings / GameOver overlays'
 * architecture: native DOM text (crisp at any DPR) + CSS transforms
 * for the 1280x720 design space, scaled to the canvas bounding box.
 */

export interface SelectOverlayCharacter {
  readonly key: string;
  readonly name: string;
  readonly archetype: string;
  readonly description: string;
  readonly passive: string;
  readonly hp: number;
  readonly slots: number;
  readonly buffSlots: number;
  readonly ultName: string | null;
  readonly quote: string;
  readonly locked: boolean;
  readonly portraitSrc: string | null;
  readonly themeHex: string;
}

export interface SelectOverlayOptions {
  readonly characters: readonly SelectOverlayCharacter[];
  readonly initialIndex: number;
  readonly thesisPrologue: string;
  readonly embarkLabel: string;
  readonly backLabel: string;
  readonly lockedLabel: string;
  readonly lockedHint: string;
  readonly ultLabelPrefix: string;
  onChange(idx: number): void;
  onConfirm(idx: number): void;
  onBack(): void;
}

export interface SelectOverlayHandle {
  setIndex(idx: number): void;
  unmount(): void;
}

const ROOT_CLASS = 'soul-strike-select-overlay';
const STYLE_ID = 'soul-strike-select-overlay-style';

const CSS = `
.${ROOT_CLASS}{
  position:fixed;inset:0;z-index:100;
  color:#e8ecf2;font-family:'Rajdhani',system-ui,sans-serif;
  pointer-events:none;opacity:0;transition:opacity 220ms ease;
  background:transparent;overflow:hidden;
  -webkit-user-select:none;user-select:none;
}
.${ROOT_CLASS}.visible{opacity:1;pointer-events:auto}
.${ROOT_CLASS} .stage{
  width:1280px;height:720px;position:absolute;left:50%;top:50%;
  transform:translate(-50%,-50%);
  pointer-events:none;
}
.${ROOT_CLASS} .stage button,
.${ROOT_CLASS} .stage .ch-icon,
.${ROOT_CLASS} .stage .arrow{pointer-events:auto;cursor:pointer}

.${ROOT_CLASS} .prologue{
  position:absolute;left:80px;right:80px;top:36px;
  text-align:center;font-size:14px;letter-spacing:.04em;
  color:rgba(174,234,255,.55);font-style:italic;line-height:1.4;
  opacity:0;transition:opacity 800ms ease .3s;
}
.${ROOT_CLASS}.visible .prologue{opacity:1}

.${ROOT_CLASS} .bg-wash{
  position:absolute;right:0;top:0;width:65%;height:100%;
  background:var(--theme-wash,rgba(255,122,0,.08));
  transition:background 280ms ease;
}

.${ROOT_CLASS} .portrait-wrap{
  position:absolute;left:50%;top:48%;transform:translate(-50%,-50%);
  width:560px;height:560px;
  display:flex;align-items:center;justify-content:center;
  margin-left:220px;
}
.${ROOT_CLASS} .portrait{
  max-width:100%;max-height:100%;
  filter:drop-shadow(0 10px 30px rgba(0,0,0,.6));
  transition:opacity 220ms ease, transform 220ms ease;
}
.${ROOT_CLASS} .portrait.locked{opacity:.3}
.${ROOT_CLASS} .portrait-placeholder{
  width:320px;height:440px;border:3px solid var(--theme-border,#ff7a00);
  background:var(--theme-border,#ff7a00);opacity:.3;
  display:flex;align-items:center;justify-content:center;
  font-family:'Bebas Neue',sans-serif;font-size:48px;color:#fff;
  letter-spacing:.08em;
}

.${ROOT_CLASS} .info{
  position:absolute;left:100px;top:110px;width:480px;
}
.${ROOT_CLASS} .info .name{
  font-family:'Bebas Neue',sans-serif;font-size:56px;letter-spacing:.03em;color:#fff;
  line-height:1;margin:0;
}
.${ROOT_CLASS} .info .name.locked{color:#555}
.${ROOT_CLASS} .info .arch{
  margin-top:12px;font-size:14px;letter-spacing:.22em;color:#8da0ba;
  text-transform:uppercase;
}
.${ROOT_CLASS} .info .accent{
  margin-top:8px;width:200px;height:3px;background:var(--theme-border,#ff7a00);
}
.${ROOT_CLASS} .info .desc{
  margin-top:22px;font-size:15px;line-height:1.5;color:rgba(232,236,242,.85);
}
.${ROOT_CLASS} .info .passive{
  margin-top:14px;font-size:12px;color:rgba(232,236,242,.6);line-height:1.4;
}
.${ROOT_CLASS} .info .stats{
  margin-top:22px;display:flex;gap:26px;
  font-size:13px;letter-spacing:.18em;color:#cfd8e4;
  font-variant-numeric:tabular-nums;
}
.${ROOT_CLASS} .info .stats b{color:#fff;font-weight:600;margin-left:4px}
.${ROOT_CLASS} .info .ult{
  margin-top:14px;font-size:14px;letter-spacing:.12em;color:#ffd94a;
}
.${ROOT_CLASS} .info .quote{
  margin-top:16px;font-size:13px;font-style:italic;
  color:rgba(232,236,242,.5);line-height:1.4;max-width:420px;
}

.${ROOT_CLASS} .action{
  position:absolute;left:220px;top:620px;
  width:280px;height:56px;border:none;
  font-family:'Bebas Neue',sans-serif;font-size:26px;letter-spacing:.14em;color:#fff;
  background:linear-gradient(90deg,var(--theme-border,#ff7a00),rgba(0,0,0,0));
  border:1px solid var(--theme-border,#ff7a00);border-left:3px solid var(--theme-border,#ff7a00);
  box-shadow:0 0 22px rgba(255,122,0,.45);
  clip-path:polygon(0 0,calc(100% - 14px) 0,100% 14px,100% 100%,14px 100%,0 calc(100% - 14px));
  transition:transform .15s ease, box-shadow .15s ease;
}
.${ROOT_CLASS} .action:hover{transform:translateX(3px);box-shadow:0 0 32px rgba(255,122,0,.7)}
.${ROOT_CLASS} .action.locked{
  color:#ff4444;background:rgba(255,68,68,.08);
  border-color:#ff4444;border-left-color:#ff4444;
  box-shadow:none;cursor:not-allowed;
}
.${ROOT_CLASS} .action.locked:hover{transform:none}
.${ROOT_CLASS} .lock-hint{
  position:absolute;left:220px;top:688px;width:320px;
  font-size:12px;letter-spacing:.12em;color:rgba(232,236,242,.45);
  text-align:center;
}

.${ROOT_CLASS} .arrows{position:absolute;inset:0;pointer-events:none}
.${ROOT_CLASS} .arrow{
  position:absolute;top:50%;transform:translateY(-50%);
  font-family:'Bebas Neue',sans-serif;font-size:52px;line-height:1;color:#fff;
  background:none;border:none;padding:14px 18px;opacity:.35;
  transition:opacity .15s, transform .15s;
}
.${ROOT_CLASS} .arrow:hover{opacity:1;transform:translateY(-50%) scale(1.25)}
.${ROOT_CLASS} .arrow-l{left:24px}
.${ROOT_CLASS} .arrow-r{right:24px;transform:translateY(-50%)}
.${ROOT_CLASS} .arrow-r:hover{transform:translateY(-50%) scale(1.25)}

.${ROOT_CLASS} .icons{
  position:absolute;left:50%;bottom:32px;transform:translateX(-50%);
  display:flex;gap:16px;
}
.${ROOT_CLASS} .ch-icon{
  width:56px;height:56px;display:flex;align-items:center;justify-content:center;
  background:#1a1a28;border:2px solid #444455;color:#888899;
  font-family:'Bebas Neue',sans-serif;font-size:22px;font-weight:700;
  transition:all .15s ease;
}
.${ROOT_CLASS} .ch-icon.current{
  background:var(--theme-border,#ff7a00);border-color:#fff;border-width:3px;
  color:#0a0a10;font-size:28px;
}
.${ROOT_CLASS} .ch-icon:hover:not(.current){border-color:#aaaaaa}
.${ROOT_CLASS} .ch-icon.locked{color:#333344}

.${ROOT_CLASS} .back{
  position:absolute;left:40px;bottom:28px;
  width:120px;height:36px;
  font-family:'Bebas Neue',sans-serif;font-size:16px;letter-spacing:.12em;color:#fff;
  background:rgba(58,58,85,.3);border:1px solid rgba(174,234,255,.3);
  transition:background .15s;
}
.${ROOT_CLASS} .back:hover{background:rgba(85,85,119,.6)}
`;

function ensureStyle(): void {
  if (document.getElementById(STYLE_ID)) return;
  const style = document.createElement('style');
  style.id = STYLE_ID;
  style.textContent = CSS;
  document.head.appendChild(style);
}

function esc(s: string): string {
  return s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c] ?? c));
}

export function mountSelectOverlay(opts: SelectOverlayOptions): SelectOverlayHandle {
  ensureStyle();
  document.querySelectorAll(`.${ROOT_CLASS}`).forEach((el) => el.remove());

  const root = document.createElement('div');
  root.className = ROOT_CLASS;

  const iconsHtml = opts.characters
    .map((ch, i) => {
      const letter = ch.locked ? '?' : ch.name.charAt(0).toUpperCase();
      return `<button class="ch-icon${ch.locked ? ' locked' : ''}" data-idx="${i}">${esc(letter)}</button>`;
    })
    .join('');

  root.innerHTML = `
    <div class="stage">
      <div class="bg-wash"></div>
      <div class="prologue">${esc(opts.thesisPrologue)}</div>
      <div class="portrait-wrap"></div>
      <div class="info"></div>
      <button class="action" data-role="embark"></button>
      <div class="lock-hint" hidden></div>
      <div class="arrows">
        <button class="arrow arrow-l" data-role="arrow-l">◀</button>
        <button class="arrow arrow-r" data-role="arrow-r">▶</button>
      </div>
      <div class="icons">${iconsHtml}</div>
      <button class="back" data-role="back">${esc(opts.backLabel)}</button>
    </div>
  `;

  document.body.appendChild(root);

  const stage = root.querySelector('.stage') as HTMLElement;
  const bgWash = root.querySelector('.bg-wash') as HTMLElement;
  const portraitWrap = root.querySelector('.portrait-wrap') as HTMLElement;
  const info = root.querySelector('.info') as HTMLElement;
  const action = root.querySelector('[data-role="embark"]') as HTMLButtonElement;
  const lockHint = root.querySelector('.lock-hint') as HTMLElement;
  const iconEls = Array.from(root.querySelectorAll<HTMLElement>('.ch-icon'));

  let currentIdx = opts.initialIndex;

  const render = (idx: number): void => {
    const ch = opts.characters[idx];
    if (!ch) return;

    const hex = ch.themeHex;
    const washRgba = hexToRgba(hex, 0.08);
    stage.style.setProperty('--theme-wash', washRgba);
    stage.style.setProperty('--theme-border', hex);
    bgWash.style.background = washRgba;

    portraitWrap.innerHTML = ch.portraitSrc
      ? `<img class="portrait${ch.locked ? ' locked' : ''}" src="${esc(ch.portraitSrc)}" alt="${esc(ch.name)}" />`
      : `<div class="portrait-placeholder" style="--theme-border:${esc(hex)}">${esc(ch.name.charAt(0))}</div>`;

    info.innerHTML = `
      <h1 class="name${ch.locked ? ' locked' : ''}">${esc(ch.name)}</h1>
      <div class="arch">${esc(ch.archetype)}</div>
      <div class="accent"></div>
      <div class="desc">${esc(ch.description)}</div>
      <div class="passive">${esc(ch.passive)}</div>
      <div class="stats">
        <span>HP<b>${ch.hp}</b></span>
        <span>SLOTS<b>${ch.slots}</b></span>
        <span>BUFF<b>${ch.buffSlots}</b></span>
      </div>
      ${ch.ultName ? `<div class="ult">${esc(opts.ultLabelPrefix)} ${esc(ch.ultName)}</div>` : ''}
      ${!ch.locked ? `<div class="quote">"${esc(ch.quote)}"</div>` : ''}
    `;

    action.textContent = ch.locked ? opts.lockedLabel : opts.embarkLabel;
    action.classList.toggle('locked', ch.locked);
    if (ch.locked) {
      action.setAttribute('aria-disabled', 'true');
    } else {
      action.removeAttribute('aria-disabled');
    }

    if (ch.locked) {
      lockHint.textContent = opts.lockedHint;
      lockHint.hidden = false;
    } else {
      lockHint.hidden = true;
    }

    iconEls.forEach((el, i) => {
      el.classList.toggle('current', i === idx);
    });
  };

  render(currentIdx);

  // Event wiring (stable elements)
  const go = (dir: number): void => {
    const next = (currentIdx + dir + opts.characters.length) % opts.characters.length;
    currentIdx = next;
    render(next);
    opts.onChange(next);
  };

  (root.querySelector('[data-role="arrow-l"]') as HTMLElement | null)?.addEventListener('click', () => go(-1));
  (root.querySelector('[data-role="arrow-r"]') as HTMLElement | null)?.addEventListener('click', () => go(1));
  (root.querySelector('[data-role="back"]') as HTMLElement | null)?.addEventListener('click', () => opts.onBack());
  action.addEventListener('click', () => {
    const ch = opts.characters[currentIdx];
    if (ch && !ch.locked) opts.onConfirm(currentIdx);
  });

  iconEls.forEach((el, i) => {
    el.addEventListener('click', () => {
      if (i === currentIdx) {
        const ch = opts.characters[currentIdx];
        if (ch && !ch.locked) opts.onConfirm(currentIdx);
        return;
      }
      currentIdx = i;
      render(i);
      opts.onChange(i);
    });
  });

  // Fit to canvas
  const fit = (): void => {
    const canvas = document.querySelector('#game-container canvas') as HTMLCanvasElement | null;
    if (!canvas) return;
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

  requestAnimationFrame(() => root.classList.add('visible'));

  return {
    setIndex(idx: number): void {
      if (idx === currentIdx) return;
      currentIdx = idx;
      render(idx);
    },
    unmount(): void {
      root.classList.remove('visible');
      window.removeEventListener('resize', fit);
      if (ro) ro.disconnect();
      window.setTimeout(() => {
        if (root.parentNode) root.parentNode.removeChild(root);
      }, 240);
    },
  };
}

function hexToRgba(hex: string, alpha: number): string {
  const h = hex.replace('#', '');
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}
