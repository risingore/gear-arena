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
}

export interface SanctumBuffSection {
  readonly kindKey: string;
  readonly kindLabel: string;
  readonly kindHex: string;
  readonly cards: readonly SanctumBuffCard[];
}

export interface SanctumOverlayOptions {
  readonly title: string;
  readonly subtitle: string;
  readonly scrapLabel: string;
  readonly scrapAmount: number;
  readonly notEnoughLabel: string;
  readonly ownedLabel: string;
  readonly readiedHeading: string;
  readonly readiedEmpty: string;
  readonly readied: readonly string[];
  /** Keys already purchased and waiting to be consumed; locked from re-buy. */
  readonly ownedKeys: readonly string[];
  readonly sections: readonly SanctumBuffSection[];
  readonly backLabel: string;
  onPurchase(key: string): void;
  onBack(): void;
}

export interface SanctumOverlayHandle {
  /** Update scrap counter + readied list after a successful purchase. */
  update(scrapAmount: number, readied: readonly string[], ownedKeys: readonly string[]): void;
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
  position:absolute;left:50%;top:108px;transform:translateX(-50%);
  width:820px;height:432px;padding:14px 20px;
  box-sizing:border-box;overflow:hidden;
  background:rgba(10,10,16,.55);
  border:1px solid rgba(174,234,255,.18);
  clip-path:polygon(0 0,calc(100% - 14px) 0,100% 14px,100% 100%,14px 100%,0 calc(100% - 14px));
}
.${ROOT_CLASS} .section{margin-bottom:8px}
.${ROOT_CLASS} .section:last-child{margin-bottom:0}
.${ROOT_CLASS} .section-head{
  display:flex;align-items:center;gap:10px;margin:0 4px 4px;
}
.${ROOT_CLASS} .section-head .swatch{
  width:12px;height:12px;
  clip-path:polygon(0 0,calc(100% - 4px) 0,100% 4px,100% 100%,4px 100%,0 calc(100% - 4px));
}
.${ROOT_CLASS} .section-head .kind-name{
  font-family:'Bebas Neue',sans-serif;font-size:14px;letter-spacing:.22em;
}
.${ROOT_CLASS} .section-head .rule{
  flex:1;height:1px;background:rgba(174,234,255,.18);
}
.${ROOT_CLASS} .grid{
  display:grid;grid-template-columns:repeat(3,160px);
  justify-content:center;gap:10px;
}
.${ROOT_CLASS} .card{
  position:relative;width:160px;height:108px;padding:10px 10px;
  box-sizing:border-box;
  background:rgba(22,30,44,.85);
  border:1px solid rgba(68,102,170,.5);
  display:flex;flex-direction:column;align-items:center;justify-content:center;
  text-align:center;gap:3px;
  clip-path:polygon(0 0,calc(100% - 10px) 0,100% 10px,100% 100%,10px 100%,0 calc(100% - 10px));
  cursor:pointer;transition:transform .12s ease,border-color .12s ease,filter .12s ease;
}
.${ROOT_CLASS} .card:hover{
  transform:translateY(-1px);
  border-color:#ff7a00;
  filter:drop-shadow(0 0 10px rgba(255,122,0,.3));
}
.${ROOT_CLASS} .card .bar{
  position:absolute;left:0;top:0;bottom:0;width:3px;
}
.${ROOT_CLASS} .card .name{
  font-family:'Bebas Neue',sans-serif;font-size:14px;letter-spacing:.06em;color:#fff;
  line-height:1.1;
}
.${ROOT_CLASS} .card .desc{
  font-size:10px;line-height:1.25;color:#cfd8e4;opacity:.85;
}
.${ROOT_CLASS} .card .price{
  font-family:'Bebas Neue',sans-serif;font-size:14px;letter-spacing:.08em;color:#ffd94a;
}
.${ROOT_CLASS} .card .price .unit{font-size:9px;color:#b89c3a;margin-left:3px;letter-spacing:.18em}
.${ROOT_CLASS} .card.locked{
  background:rgba(12,14,22,.6);opacity:.55;cursor:not-allowed;
  border-color:rgba(255,68,68,.55);
}
.${ROOT_CLASS} .card.locked:hover{transform:none;filter:none;border-color:rgba(255,68,68,.55)}
.${ROOT_CLASS} .card.owned{
  background:rgba(12,14,22,.6);opacity:.7;cursor:not-allowed;
  border-color:rgba(174,234,255,.55);
}
.${ROOT_CLASS} .card.owned:hover{transform:none;filter:none;border-color:rgba(174,234,255,.55)}
.${ROOT_CLASS} .card .status{
  font-family:'Bebas Neue',sans-serif;font-size:10px;letter-spacing:.22em;
  text-transform:uppercase;
}
.${ROOT_CLASS} .card.owned .status{color:#aeeaff}
.${ROOT_CLASS} .card.locked .status{color:#ff9a9a}
.${ROOT_CLASS} .readied{
  position:absolute;left:50%;top:556px;transform:translateX(-50%);
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

function renderCard(
  card: SanctumBuffCard,
  kindHex: string,
  scrap: number,
  ownedKeys: ReadonlySet<string>,
  ownedLabel: string,
  notEnoughLabel: string,
): string {
  const isOwned = ownedKeys.has(card.key);
  const canAfford = scrap >= card.scrapPrice;
  const stateClass = isOwned ? ' owned' : (canAfford ? '' : ' locked');
  const purchasable = !isOwned && canAfford;
  const status = isOwned ? ownedLabel : (canAfford ? '' : notEnoughLabel);
  return `
    <div class="card${stateClass}"${purchasable ? ` data-role="buy" data-key="${esc(card.key)}"` : ''}>
      <div class="bar" style="background:${esc(kindHex)}"></div>
      <div class="name">${esc(card.name)}</div>
      <div class="desc">${esc(card.description)}</div>
      <div class="price">${card.scrapPrice}<span class="unit">SCR</span></div>
      ${status ? `<div class="status">${esc(status)}</div>` : ''}
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
  let ownedSet = new Set<string>(opts.ownedKeys);

  const renderReadied = (items: readonly string[]): string =>
    items.length === 0
      ? `<span class="items empty">${esc(opts.readiedEmpty)}</span>`
      : `<span class="items">${items.map(esc).join('  ·  ')}</span>`;

  const renderSection = (sec: SanctumBuffSection): string => `
    <div class="section">
      <div class="section-head">
        <span class="swatch" style="background:${esc(sec.kindHex)}"></span>
        <span class="kind-name" style="color:${esc(sec.kindHex)}">${esc(sec.kindLabel)}</span>
        <span class="rule"></span>
      </div>
      <div class="grid">
        ${sec.cards
          .map((c) => renderCard(c, sec.kindHex, scrap, ownedSet, opts.ownedLabel, opts.notEnoughLabel))
          .join('')}
      </div>
    </div>
  `;

  const renderGrid = (): string => opts.sections.map(renderSection).join('');

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
    update(newScrap, newReadied, newOwnedKeys): void {
      scrap = newScrap;
      ownedSet = new Set<string>(newOwnedKeys);
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
