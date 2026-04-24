/**
 * SANCTUM (加持堂) overlay — meta-progression buff shop.
 *
 * Player spends persistent scrap currency to consecrate buff items
 * that auto-equip at the start of the next run. Visual family matches
 * Collection: shared SS-NNN frame, chamfered panel, Bebas Neue title,
 * scrollable card grid, Back button bottom-left.
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

export interface SanctumBuffCard {
  readonly key: string;
  readonly name: string;
  readonly description: string;
  readonly scrapPrice: number;
  readonly categoryHex: string;
}

export interface SanctumOverlayOptions {
  readonly title: string;
  readonly subtitle: string;
  readonly scrapLabel: string;
  readonly scrapAmount: number;
  readonly consecrateLabel: string;
  readonly notEnoughLabel: string;
  readonly readiedHeading: string;
  readonly readiedEmpty: string;
  readonly readied: readonly string[];
  readonly cards: readonly SanctumBuffCard[];
  readonly backLabel: string;
  onPurchase(key: string): void;
  onBack(): void;
}

export interface SanctumOverlayHandle {
  /** Update scrap counter + readied list after a successful purchase. */
  update(scrapAmount: number, readied: readonly string[]): void;
  unmount(): void;
}

const ROOT_CLASS = 'soul-strike-sanctum-overlay';
const STYLE_ID = 'soul-strike-sanctum-overlay-style';

const CSS = `
.${ROOT_CLASS}{
  position:fixed;inset:0;z-index:100;
  color:#e8ecf2;font-family:'Rajdhani',system-ui,sans-serif;
  pointer-events:none;opacity:0;transition:opacity 220ms ease;
  background:transparent;overflow:hidden;
}
.${ROOT_CLASS}.visible{opacity:1;pointer-events:auto}
.${ROOT_CLASS} .stage{
  width:1280px;height:720px;
  position:absolute;left:50%;top:50%;
  transform:translate(-50%,-50%);
}
.${ROOT_CLASS} .title{
  position:absolute;left:50%;top:28px;transform:translateX(-50%);
  font-family:'Bebas Neue',sans-serif;font-size:44px;letter-spacing:.06em;color:#fff;
  line-height:1;margin:0;padding:0;
}
.${ROOT_CLASS} .subtitle{
  position:absolute;left:50%;top:76px;transform:translateX(-50%);
  font-size:13px;letter-spacing:.18em;color:rgba(174,234,255,.55);
  font-style:italic;text-transform:uppercase;
}
.${ROOT_CLASS} .scrap-line{
  position:absolute;right:40px;top:76px;
  font-family:'Bebas Neue',sans-serif;font-size:22px;letter-spacing:.16em;
}
.${ROOT_CLASS} .scrap-line .label{color:#8da0ba;font-size:13px;letter-spacing:.22em;margin-right:10px}
.${ROOT_CLASS} .scrap-line .amount{color:#ffd94a;text-shadow:0 0 10px rgba(255,217,74,.35)}
.${ROOT_CLASS} .panel{
  position:absolute;left:50%;top:116px;transform:translateX(-50%);
  width:820px;max-height:460px;padding:24px 30px 28px;
  overflow-y:auto;
  background:rgba(10,10,16,.55);
  border:1px solid rgba(174,234,255,.18);
  scrollbar-width:thin;scrollbar-color:rgba(174,234,255,.35) rgba(10,10,16,.4);
  clip-path:polygon(0 0,calc(100% - 14px) 0,100% 14px,100% 100%,14px 100%,0 calc(100% - 14px));
}
.${ROOT_CLASS} .panel::-webkit-scrollbar{width:8px}
.${ROOT_CLASS} .panel::-webkit-scrollbar-track{background:rgba(10,10,16,.4)}
.${ROOT_CLASS} .panel::-webkit-scrollbar-thumb{background:rgba(174,234,255,.35);border-radius:3px}
.${ROOT_CLASS} .panel::-webkit-scrollbar-thumb:hover{background:rgba(174,234,255,.55)}
.${ROOT_CLASS} .grid{
  display:grid;grid-template-columns:repeat(3,1fr);gap:16px;
}
.${ROOT_CLASS} .card{
  position:relative;padding:14px 16px 18px;min-height:180px;
  background:linear-gradient(180deg,rgba(22,30,44,.85),rgba(16,20,32,.75));
  border:1px solid rgba(174,234,255,.3);
  clip-path:polygon(0 0,calc(100% - 10px) 0,100% 10px,100% 100%,10px 100%,0 calc(100% - 10px));
  display:flex;flex-direction:column;gap:8px;
}
.${ROOT_CLASS} .card .bar{
  position:absolute;left:0;top:0;bottom:0;width:3px;
}
.${ROOT_CLASS} .card .name{
  font-family:'Bebas Neue',sans-serif;font-size:22px;letter-spacing:.06em;color:#fff;
  line-height:1.1;
}
.${ROOT_CLASS} .card .desc{
  font-size:13px;line-height:1.45;color:#cfd8e4;flex:1;
}
.${ROOT_CLASS} .card .foot{
  display:flex;align-items:center;justify-content:space-between;gap:10px;
}
.${ROOT_CLASS} .card .price{
  font-family:'Bebas Neue',sans-serif;font-size:20px;letter-spacing:.08em;color:#ffd94a;
}
.${ROOT_CLASS} .card .price .unit{font-size:12px;color:#b89c3a;margin-left:3px;letter-spacing:.18em}
.${ROOT_CLASS} .card .buy{
  width:100px;height:34px;padding:0 10px;
  display:inline-flex;align-items:center;justify-content:center;
  font-family:'Bebas Neue',sans-serif;font-size:15px;letter-spacing:.18em;color:#fff;
  background:linear-gradient(90deg,rgba(255,122,0,.22),rgba(255,122,0,.04));
  border:1px solid #ff7a00;border-left:3px solid #ff7a00;
  filter:drop-shadow(0 0 8px rgba(255,122,0,.35));
  clip-path:polygon(0 0,calc(100% - 10px) 0,100% 10px,100% 100%,10px 100%,0 calc(100% - 10px));
  cursor:pointer;transition:all .15s ease;
}
.${ROOT_CLASS} .card .buy:hover{background:linear-gradient(90deg,#ff7a00,rgba(255,122,0,.55));color:#0a0a10}
.${ROOT_CLASS} .card.locked .buy{
  background:rgba(58,58,85,.25);border-color:rgba(255,68,68,.55);border-left-color:rgba(255,68,68,.55);
  color:#ff9a9a;filter:none;cursor:not-allowed;pointer-events:none;
}
.${ROOT_CLASS} .readied{
  position:absolute;left:50%;top:600px;transform:translateX(-50%);
  width:820px;
  display:flex;align-items:baseline;gap:16px;
  font-size:12px;letter-spacing:.2em;color:#8da0ba;
  text-transform:uppercase;
}
.${ROOT_CLASS} .readied .label{
  font-family:'Bebas Neue',sans-serif;font-size:14px;letter-spacing:.24em;color:#aeeaff;
}
.${ROOT_CLASS} .readied .items{color:#cfd8e4;letter-spacing:.12em;font-size:13px;text-transform:none}
.${ROOT_CLASS} .readied .items.empty{color:#5a6c85;font-style:italic}
.${ROOT_CLASS} .back{
  position:absolute;left:40px;bottom:30px;
  width:120px;height:36px;
  font-family:'Bebas Neue',sans-serif;font-size:16px;letter-spacing:.12em;color:#fff;
  background:rgba(58,58,85,.3);border:1px solid rgba(174,234,255,.3);
  cursor:pointer;transition:background .15s;
}
.${ROOT_CLASS} .back:hover{background:rgba(85,85,119,.6)}
`;

function renderCard(card: SanctumBuffCard, scrap: number, consecrateLabel: string, notEnoughLabel: string): string {
  const canAfford = scrap >= card.scrapPrice;
  return `
    <div class="card${canAfford ? '' : ' locked'}" data-key="${esc(card.key)}">
      <div class="bar" style="background:${esc(card.categoryHex)}"></div>
      <div class="name">${esc(card.name)}</div>
      <div class="desc">${esc(card.description)}</div>
      <div class="foot">
        <div class="price">${card.scrapPrice}<span class="unit">SCR</span></div>
        <button class="buy" data-role="buy" data-key="${esc(card.key)}">${esc(canAfford ? consecrateLabel : notEnoughLabel)}</button>
      </div>
    </div>
  `;
}

export function mountSanctumOverlay(opts: SanctumOverlayOptions): SanctumOverlayHandle {
  ensureFrameStyle();
  ensureStyle(STYLE_ID, CSS);
  clearPriorRoots(ROOT_CLASS);

  const root = document.createElement('div');
  root.className = ROOT_CLASS;

  let scrap = opts.scrapAmount;

  const renderReadied = (items: readonly string[]): string =>
    items.length === 0
      ? `<span class="items empty">${esc(opts.readiedEmpty)}</span>`
      : `<span class="items">${items.map(esc).join('  ·  ')}</span>`;

  const renderGrid = (): string => `
    <div class="grid">
      ${opts.cards.map((c) => renderCard(c, scrap, opts.consecrateLabel, opts.notEnoughLabel)).join('')}
    </div>
  `;

  root.innerHTML = `
    <div class="stage ss-stage">
      ${buildFrameHtml({
        tagLeft: '<b>SS</b>-<b>077</b> / SANCTUM <span class="bar"></span> KAJIDŌ',
        tagRight: 'META PROGRESSION <span class="bar"></span> <b>READY ROOM</b>',
      })}
      <div class="title">${esc(opts.title)}</div>
      <div class="subtitle">${esc(opts.subtitle)}</div>
      <div class="scrap-line"><span class="label">${esc(opts.scrapLabel)}</span><span class="amount" data-role="scrap">${scrap}</span></div>
      <div class="panel">
        <div data-role="cards">${renderGrid()}</div>
      </div>
      <div class="readied">
        <span class="label">${esc(opts.readiedHeading)}</span>
        <span data-role="readied">${renderReadied(opts.readied)}</span>
      </div>
      <button class="back" data-role="back">${esc(opts.backLabel)}</button>
    </div>
  `;

  document.body.appendChild(root);
  const stage = root.querySelector('.stage') as HTMLElement;
  const disposeFit = fitStageToCanvas(stage);

  const backBtn = root.querySelector('[data-role="back"]') as HTMLElement | null;
  backBtn?.addEventListener('click', () => opts.onBack());

  const wireBuys = (): void => {
    root.querySelectorAll<HTMLElement>('[data-role="buy"]').forEach((el) => {
      el.addEventListener('click', () => {
        const key = el.getAttribute('data-key');
        if (!key) return;
        opts.onPurchase(key);
      });
    });
  };
  wireBuys();

  requestAnimationFrame(() => root.classList.add('visible'));

  return {
    update(newScrap, newReadied): void {
      scrap = newScrap;
      const scrapEl = root.querySelector('[data-role="scrap"]') as HTMLElement | null;
      if (scrapEl) scrapEl.textContent = String(newScrap);
      const readiedEl = root.querySelector('[data-role="readied"]') as HTMLElement | null;
      if (readiedEl) readiedEl.innerHTML = renderReadied(newReadied);
      const cardsEl = root.querySelector('[data-role="cards"]') as HTMLElement | null;
      if (cardsEl) cardsEl.innerHTML = renderGrid();
      wireBuys();
    },
    unmount: wrapUnmount(root, disposeFit),
  };
}
