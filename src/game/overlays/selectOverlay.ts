/**
 * Character select HTML overlay.
 *
 * Renders the roster picker as a DOM + inline-img layer on top of the
 * Phaser canvas. Matches the Title / Settings / GameOver overlays'
 * architecture: native DOM text (crisp at any DPR) + CSS transforms
 * for the 1280x720 design space, scaled to the canvas bounding box.
 */

import {
  ensureFrameStyle,
  buildFrameHtml,
  ensureStyle,
  escapeHtml as esc,
  clearPriorRoots,
  fitStageToCanvas,
  wrapUnmount,
} from './overlayBase';

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
  /** Jam-scope teaser state: shown as "COMING SOON" with name only. */
  readonly comingSoon?: boolean;
  readonly portraitSrc: string | null;
  /** Cropped face/head icon shown in the small character-selector button.
   *  Falls back to the empty button when null. */
  readonly iconSrc?: string | null;
  readonly themeHex: string;
}

export interface SelectOverlayOptions {
  readonly characters: readonly SelectOverlayCharacter[];
  readonly initialIndex: number;
  readonly thesisPrologue: string;
  readonly embarkLabel: string;
  readonly backLabel: string;
  readonly lockedLabel: string;
  readonly comingSoonLabel?: string;
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
.${ROOT_CLASS} .stage .ch-icon{pointer-events:auto;cursor:pointer}

.${ROOT_CLASS} .prologue{
  position:absolute;left:80px;right:80px;top:36px;
  text-align:center;font-size:14px;letter-spacing:.04em;
  color:rgba(174,234,255,.55);font-style:italic;line-height:1.4;
  opacity:0;transition:opacity 800ms ease .3s;
}
.${ROOT_CLASS}.visible .prologue{opacity:1}
.${ROOT_CLASS} .prologue-echo{
  position:absolute;left:80px;right:80px;top:64px;
  text-align:center;font-size:11px;letter-spacing:.18em;
  color:rgba(255,217,74,.34);font-style:italic;line-height:1.4;
  opacity:0;transition:opacity 800ms ease .55s;
}
.${ROOT_CLASS}.visible .prologue-echo{opacity:1}

.${ROOT_CLASS} .bg-wash{
  position:absolute;left:0;top:0;width:65%;height:100%;
  background:var(--theme-wash,rgba(255,122,0,.08));
  transition:background 280ms ease;
}

.${ROOT_CLASS} .portrait-wrap{
  position:absolute;left:50%;top:48%;transform:translate(-50%,-50%);
  width:560px;height:560px;
  display:flex;align-items:center;justify-content:center;
  margin-left:-220px;
  /* Sit above the shared frame effects (grid z:1, vignette z:1,
     scanline ::after z:99) so the character sprite is always the
     clearest element on the screen. */
  z-index:100;pointer-events:none;
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

.${ROOT_CLASS} .info-panel{
  position:absolute;right:80px;top:110px;width:480px;
  display:flex;flex-direction:column;
}
.${ROOT_CLASS} .info{
  width:100%;
  /* Natural content height — action button follows the description with
     a fixed margin, rather than floating at the bottom of a reserved
     vertical slot. */
  padding-bottom:8px;
}
.${ROOT_CLASS} .info .name{
  font-family:'Bebas Neue',sans-serif;font-size:56px;letter-spacing:.03em;color:#fff;
  line-height:1;margin:0;
}
.${ROOT_CLASS} .info .name.locked{color:#555}
.${ROOT_CLASS} .info .arch{
  margin-top:12px;font-size:16px;letter-spacing:.22em;color:#8da0ba;
  text-transform:uppercase;
}
.${ROOT_CLASS} .info .accent{
  margin-top:8px;width:200px;height:3px;background:var(--theme-border,#ff7a00);
}
.${ROOT_CLASS} .info .desc{
  margin-top:22px;font-size:19px;line-height:1.55;color:rgba(232,236,242,.9);
  /* Reserve height for 2 lines so descriptions of varying length all
     occupy the same vertical footprint and every section below stays
     aligned across characters. */
  min-height:calc(1.55em * 2);
}
.${ROOT_CLASS} .info .passive{
  margin-top:14px;font-size:15px;color:rgba(232,236,242,.7);line-height:1.45;
  min-height:calc(1.45em * 2);
}
.${ROOT_CLASS} .info .quote{
  margin-top:10px;font-size:16px;font-style:italic;
  color:rgba(232,236,242,.55);line-height:1.45;max-width:440px;
  min-height:calc(1.45em * 1);
}
.${ROOT_CLASS} .info .stats{
  margin-top:22px;display:flex;gap:26px;
  font-size:16px;letter-spacing:.18em;color:#cfd8e4;
  font-variant-numeric:tabular-nums;
}
.${ROOT_CLASS} .info .stats b{color:#fff;font-weight:600;margin-left:4px}
.${ROOT_CLASS} .info .ult{
  margin-top:14px;font-size:17px;letter-spacing:.12em;color:#ffd94a;
}

.${ROOT_CLASS} .action{
  margin-top:14px;align-self:flex-start;
  width:280px;height:56px;border:none;
  font-family:'Bebas Neue',sans-serif;font-size:26px;letter-spacing:.14em;color:#fff;
  background:linear-gradient(90deg,rgba(255,122,0,.22),rgba(255,122,0,.04));
  border:1px solid #ff7a00;border-left:3px solid #ff7a00;
  filter:drop-shadow(0 0 10px rgba(255,122,0,.45));
  clip-path:polygon(0 0,calc(100% - 14px) 0,100% 14px,100% 100%,14px 100%,0 calc(100% - 14px));
  transition:transform .15s ease, background .15s ease, filter .15s ease, color .15s ease;
}
.${ROOT_CLASS} .action:hover{
  transform:translateX(3px);
  background:linear-gradient(90deg,#ff7a00,rgba(255,122,0,.55));
  filter:drop-shadow(0 0 14px rgba(255,122,0,.7));
  color:#0a0a10;
}
.${ROOT_CLASS} .action.locked{
  color:#ff4444;background:rgba(255,68,68,.08);
  border-color:#ff4444;border-left-color:#ff4444;
  filter:none;cursor:not-allowed;
}
.${ROOT_CLASS} .action.locked:hover{transform:none}
.${ROOT_CLASS} .lock-hint{
  margin-top:10px;width:280px;
  font-size:12px;letter-spacing:.12em;color:rgba(232,236,242,.45);
  text-align:left;
}

.${ROOT_CLASS} .icons{
  position:absolute;left:50%;bottom:20px;transform:translateX(-50%);
  display:flex;gap:24px;
}
.${ROOT_CLASS} .ch-icon{
  width:112px;height:112px;display:flex;align-items:center;justify-content:center;
  background:#1a1a28;border:2px solid #444455;color:#888899;
  font-family:'Bebas Neue',sans-serif;font-size:44px;font-weight:700;
  transition:all .15s ease;
  overflow:hidden;padding:0;
}
.${ROOT_CLASS} .ch-icon .ic-portrait{
  width:100%;height:100%;object-fit:cover;display:block;pointer-events:none;
}
.${ROOT_CLASS} .ch-icon.current{
  background:var(--theme-border,#ff7a00);border-color:#fff;border-width:3px;
  color:#0a0a10;font-size:56px;
}
.${ROOT_CLASS} .ch-icon:hover:not(.current):not(.coming-soon){border-color:#aaaaaa}
.${ROOT_CLASS} .ch-icon.locked{color:#333344}
.${ROOT_CLASS} .ch-icon.coming-soon{
  flex-direction:column;gap:6px;cursor:not-allowed;
  background:#14141f;border-color:#2e2e42;color:#4a4a5c;
}
.${ROOT_CLASS} .ch-icon.coming-soon .ic-coming,
.${ROOT_CLASS} .ch-icon.coming-soon .ic-soon{
  font-size:15px;letter-spacing:.22em;line-height:1;
  color:#c49bff;opacity:.9;font-weight:600;
}

.${ROOT_CLASS} .back{
  position:absolute;left:40px;bottom:30px;
  width:120px;height:36px;
  font-family:'Bebas Neue',sans-serif;font-size:16px;letter-spacing:.12em;color:#fff;
  background:rgba(58,58,85,.3);border:1px solid rgba(174,234,255,.3);
  cursor:pointer;transition:background .15s;
}
.${ROOT_CLASS} .back:hover{background:rgba(85,85,119,.6)}
`;

export function mountSelectOverlay(opts: SelectOverlayOptions): SelectOverlayHandle {
  ensureFrameStyle();
  ensureStyle(STYLE_ID, CSS);
  clearPriorRoots(ROOT_CLASS);

  const root = document.createElement('div');
  root.className = ROOT_CLASS;

  const iconsHtml = opts.characters
    .map((ch, i) => {
      if (ch.comingSoon) {
        return `<button class="ch-icon coming-soon" data-idx="${i}" aria-disabled="true" disabled><span class="ic-coming">COMING</span><span class="ic-soon">SOON</span></button>`;
      }
      const iconImg = ch.iconSrc
        ? `<img class="ic-portrait" src="${esc(ch.iconSrc)}" alt="${esc(ch.name)}" />`
        : '';
      return `<button class="ch-icon${ch.locked ? ' locked' : ''}" data-idx="${i}">${iconImg}</button>`;
    })
    .join('');

  root.innerHTML = `
    <div class="stage ss-stage">
      ${buildFrameHtml({
        tagLeft: '<b>SS</b>-<b>002</b> / ROSTER <span class="bar"></span> SELECT',
        tagRight: 'MACHINE PROFILE <span class="bar"></span> <b data-role="idxTag"></b> / <b data-role="totalTag"></b>',
      })}
      <div class="bg-wash"></div>
      <div class="prologue">${esc(opts.thesisPrologue)}</div>
      <div class="prologue-echo">and what could not convert is still ringing.</div>
      <div class="portrait-wrap"></div>
      <div class="info-panel">
        <div class="info"></div>
        <button class="action" data-role="embark"></button>
        <div class="lock-hint" hidden></div>
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
  const idxTag = root.querySelector('[data-role="idxTag"]') as HTMLElement | null;
  const totalTag = root.querySelector('[data-role="totalTag"]') as HTMLElement | null;
  if (totalTag) totalTag.textContent = String(opts.characters.length).padStart(2, '0');

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

    if (ch.comingSoon) {
      // Teaser slot: show only the name + COMING SOON, hide full profile.
      info.innerHTML = `
        <h1 class="name locked">${esc(ch.name)}</h1>
        <div class="arch">&nbsp;</div>
        <div class="accent"></div>
        <div class="desc" style="color:rgba(232,236,242,.55);font-style:italic">${esc(opts.comingSoonLabel ?? 'COMING SOON')}</div>
      `;
    } else {
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
        ${ch.ultName ? `<div class="ult">${esc(opts.ultLabelPrefix)} ${esc(ch.ultName)}</div>` : '<div class="ult" aria-hidden="true">&nbsp;</div>'}
        <div class="quote">${ch.locked ? '' : `"${esc(ch.quote)}"`}</div>
      `;
    }

    const disabled = ch.comingSoon || ch.locked;
    action.textContent = ch.comingSoon
      ? (opts.comingSoonLabel ?? 'COMING SOON')
      : ch.locked
        ? opts.lockedLabel
        : opts.embarkLabel;
    action.classList.toggle('locked', disabled);
    if (disabled) {
      action.setAttribute('aria-disabled', 'true');
    } else {
      action.removeAttribute('aria-disabled');
    }

    if (ch.locked && !ch.comingSoon) {
      lockHint.textContent = opts.lockedHint;
      lockHint.hidden = false;
    } else {
      lockHint.hidden = true;
    }

    iconEls.forEach((el, i) => {
      el.classList.toggle('current', i === idx);
    });
    if (idxTag) idxTag.textContent = String(idx + 1).padStart(2, '0');
  };

  render(currentIdx);

  (root.querySelector('[data-role="back"]') as HTMLElement | null)?.addEventListener('click', () => opts.onBack());
  action.addEventListener('click', () => {
    const ch = opts.characters[currentIdx];
    if (ch && !ch.locked && !ch.comingSoon) opts.onConfirm(currentIdx);
  });

  iconEls.forEach((el, i) => {
    el.addEventListener('click', () => {
      if (opts.characters[i]?.comingSoon) return;
      if (i === currentIdx) return;
      currentIdx = i;
      render(i);
      opts.onChange(i);
    });
  });

  const disposeFit = fitStageToCanvas(stage);

  requestAnimationFrame(() => root.classList.add('visible'));

  const unmount = wrapUnmount(root, disposeFit);

  return {
    setIndex(idx: number): void {
      if (idx === currentIdx) return;
      currentIdx = idx;
      render(idx);
    },
    unmount,
  };
}

function hexToRgba(hex: string, alpha: number): string {
  const h = hex.replace('#', '');
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}
