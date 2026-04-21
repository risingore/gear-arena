/**
 * Collection overlay.
 *
 * DOM-based collection browser matching the Title / Settings visual
 * language: shared SS-NNN frame, Bebas Neue title, scrollable panel
 * with the same scrollbar styling, and Back button anchored bottom-left.
 * The Phaser scene just mounts this overlay and routes Title/ESC.
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

export type CollectionTab = 'machines' | 'parts' | 'enemies' | 'titles';

export interface CollectionMachine {
  readonly name: string;
  readonly archetype: string;
  readonly hp: number;
  readonly slots: number;
  readonly clears: number;
  readonly themeHex: string;
  readonly unlocked: boolean;
}

export interface CollectionPart {
  readonly name: string;
  readonly category: string;
  readonly categoryLabel: string;
  readonly price: number;
  readonly themeHex: string;
  readonly used: boolean;
}

export interface CollectionEnemy {
  readonly name: string;
  readonly categoryLabel: string;
  readonly hp: number;
  readonly damage: number;
  readonly themeHex: string;
  readonly defeated: boolean;
}

export interface CollectionTitle {
  readonly name: string;
  readonly title: string;
  readonly description: string;
  readonly earned: boolean;
}

export interface CollectionSkill {
  readonly name: string;
  readonly description: string;
  readonly acquired: boolean;
}

export interface CollectionOverlayOptions {
  readonly title: string;
  readonly tabLabels: Record<CollectionTab, string>;
  readonly countTemplates: {
    machines: (unlocked: number, total: number) => string;
    parts: (discovered: number, total: number) => string;
    enemies: (defeated: number, total: number) => string;
    titles: (earned: number, total: number, skills: number, skillTotal: number) => string;
  };
  readonly lockedLabel: string;
  readonly skillsHeading: string;
  readonly clearsLabel: string;
  readonly machines: readonly CollectionMachine[];
  readonly parts: readonly CollectionPart[];
  readonly enemies: readonly CollectionEnemy[];
  readonly titles: readonly CollectionTitle[];
  readonly skills: readonly CollectionSkill[];
  readonly backLabel: string;
  readonly onBack: () => void;
}

const ROOT_CLASS = 'soul-strike-collection-overlay';
const STYLE_ID = 'soul-strike-collection-overlay-style';

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
.${ROOT_CLASS} .panel{
  position:absolute;left:50%;top:100px;transform:translateX(-50%);
  width:742px;max-height:540px;padding:20px 30px 28px;
  overflow-y:auto;
  background:rgba(10,10,16,.55);
  border:1px solid rgba(174,234,255,.18);
  scrollbar-width:thin;scrollbar-color:rgba(174,234,255,.35) rgba(10,10,16,.4);
}
.${ROOT_CLASS} .tabs{
  display:flex;gap:10px;justify-content:center;margin-bottom:10px;
}
.${ROOT_CLASS} .tab{
  width:150px;height:36px;display:flex;align-items:center;justify-content:center;
  font-family:'Bebas Neue',sans-serif;font-size:16px;letter-spacing:.14em;color:#cfd8e4;
  background:rgba(26,42,68,.6);border:1px solid rgba(68,102,170,.8);
  cursor:pointer;transition:all .15s;
}
.${ROOT_CLASS} .tab:hover{background:rgba(42,58,85,.8);border-color:#5aaaff}
.${ROOT_CLASS} .tab.active{
  background:rgba(42,58,85,1);border-color:#ff7a00;color:#fff;
  filter:drop-shadow(0 0 10px rgba(255,122,0,.35));
}
.${ROOT_CLASS} .count{
  text-align:center;margin-bottom:16px;
  font-size:13px;letter-spacing:.12em;color:#8da0ba;
  text-transform:uppercase;font-variant-numeric:tabular-nums;
}
.${ROOT_CLASS} .panel::-webkit-scrollbar{width:8px}
.${ROOT_CLASS} .panel::-webkit-scrollbar-track{background:rgba(10,10,16,.4)}
.${ROOT_CLASS} .panel::-webkit-scrollbar-thumb{background:rgba(174,234,255,.35);border-radius:3px}
.${ROOT_CLASS} .panel::-webkit-scrollbar-thumb:hover{background:rgba(174,234,255,.55)}
.${ROOT_CLASS} .grid{
  display:flex;flex-wrap:wrap;gap:14px;justify-content:center;
}
.${ROOT_CLASS} .card{
  width:160px;
  background:rgba(22,30,44,.85);border:1px solid rgba(68,102,170,.5);
  padding:14px 10px;min-height:120px;box-sizing:border-box;
  display:flex;flex-direction:column;align-items:center;justify-content:center;
  text-align:center;gap:4px;
  clip-path:polygon(0 0,calc(100% - 10px) 0,100% 10px,100% 100%,10px 100%,0 calc(100% - 10px));
}
.${ROOT_CLASS} .card.locked{background:rgba(12,14,22,.6);opacity:.5}
.${ROOT_CLASS} .card .cat{
  font-size:10px;letter-spacing:.22em;color:#8da0ba;text-transform:uppercase;
}
.${ROOT_CLASS} .card .name{
  font-family:'Bebas Neue',sans-serif;font-size:17px;letter-spacing:.06em;color:#fff;
}
.${ROOT_CLASS} .card .sub{
  font-size:11px;letter-spacing:.08em;color:#cfd8e4;opacity:.85;
  font-variant-numeric:tabular-nums;
}
.${ROOT_CLASS} .card .clears{
  font-size:11px;letter-spacing:.12em;color:#ffd94a;
}
.${ROOT_CLASS} .card.locked .placeholder{
  font-family:'Bebas Neue',sans-serif;font-size:18px;color:#ff4444;
}
.${ROOT_CLASS} .list{display:flex;flex-direction:column;gap:8px}
.${ROOT_CLASS} .row{
  display:flex;align-items:center;justify-content:space-between;
  padding:10px 16px;min-height:44px;
  background:rgba(22,30,44,.7);border:1px solid rgba(68,102,170,.5);
}
.${ROOT_CLASS} .row.locked{background:rgba(12,14,22,.5);opacity:.45}
.${ROOT_CLASS} .row.earned{border-color:rgba(255,122,0,.8)}
.${ROOT_CLASS} .row .left{display:flex;align-items:center;gap:10px;flex:1}
.${ROOT_CLASS} .row .star{font-size:16px;color:#ffd94a}
.${ROOT_CLASS} .row .locked-star{font-size:16px;color:#6a7687}
.${ROOT_CLASS} .row .name{
  font-family:'Bebas Neue',sans-serif;font-size:16px;letter-spacing:.08em;color:#fff;
}
.${ROOT_CLASS} .row.locked .name{color:#6a7687}
.${ROOT_CLASS} .row .title-text{
  font-size:13px;color:#ffd94a;font-style:italic;margin-left:10px;
}
.${ROOT_CLASS} .row .desc{
  font-size:12px;color:#8da0ba;text-align:right;max-width:540px;
}
.${ROOT_CLASS} .section-heading{
  margin:18px 4px 8px;
  font-family:'Bebas Neue',sans-serif;font-size:18px;letter-spacing:.18em;
  color:#aeeaff;text-transform:uppercase;
}
.${ROOT_CLASS} .skill-row{
  display:flex;align-items:center;justify-content:space-between;
  padding:8px 14px;min-height:40px;
  background:rgba(22,30,44,.6);border:1px solid rgba(58,176,255,.35);
}
.${ROOT_CLASS} .skill-row.locked{background:rgba(12,14,22,.4);opacity:.4;border-color:rgba(68,102,170,.4)}
.${ROOT_CLASS} .skill-row .name{
  font-family:'Bebas Neue',sans-serif;font-size:15px;letter-spacing:.08em;color:#3ab0ff;
}
.${ROOT_CLASS} .skill-row.locked .name{color:#6a7687}
.${ROOT_CLASS} .skill-row .desc{
  font-size:12px;color:#8da0ba;text-align:right;max-width:540px;
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

function renderMachinesCards(machines: readonly CollectionMachine[], lockedLabel: string, clearsLabel: string): string {
  return `<div class="grid">${machines.map((m) => {
    if (!m.unlocked) {
      return `<div class="card locked"><div class="placeholder">${esc(lockedLabel)}</div><div class="sub">???</div></div>`;
    }
    return `<div class="card" style="border-color:${esc(m.themeHex)}">
      <div class="name">${esc(m.name)}</div>
      <div class="cat">${esc(m.archetype)}</div>
      <div class="sub">HP ${m.hp} · ${m.slots} SLOTS</div>
      <div class="clears">${m.clears} ${esc(clearsLabel)}</div>
    </div>`;
  }).join('')}</div>`;
}

function renderPartsCards(parts: readonly CollectionPart[]): string {
  return `<div class="grid">${parts.map((p) => {
    if (!p.used) {
      return `<div class="card locked"><div class="placeholder">???</div></div>`;
    }
    return `<div class="card" style="border-color:${esc(p.themeHex)}">
      <div class="cat">${esc(p.categoryLabel)}</div>
      <div class="name">${esc(p.name)}</div>
      <div class="sub" style="color:#ffd94a">${p.price} g</div>
    </div>`;
  }).join('')}</div>`;
}

function renderEnemiesCards(enemies: readonly CollectionEnemy[]): string {
  return `<div class="grid">${enemies.map((e) => {
    if (!e.defeated) {
      return `<div class="card locked"><div class="placeholder">???</div></div>`;
    }
    return `<div class="card" style="border-color:${esc(e.themeHex)}">
      <div class="cat">${esc(e.categoryLabel)}</div>
      <div class="name">${esc(e.name)}</div>
      <div class="sub">HP ${e.hp} · DMG ${e.damage}</div>
    </div>`;
  }).join('')}</div>`;
}

function renderTitles(
  titles: readonly CollectionTitle[],
  skills: readonly CollectionSkill[],
  skillsHeading: string,
): string {
  const titleRows = titles.map((t) => {
    if (t.earned) {
      return `<div class="row earned">
        <div class="left">
          <span class="star">★</span>
          <span class="name">${esc(t.name)}</span>
          <span class="title-text">"${esc(t.title)}"</span>
        </div>
        <div class="desc">${esc(t.description)}</div>
      </div>`;
    }
    return `<div class="row locked">
      <div class="left">
        <span class="locked-star">☆</span>
        <span class="name">${esc(t.name)}</span>
      </div>
      <div class="desc">${esc(t.description)}</div>
    </div>`;
  }).join('');

  const skillRows = skills.map((s) => {
    if (s.acquired) {
      return `<div class="skill-row">
        <span class="name">${esc(s.name)}</span>
        <span class="desc">${esc(s.description)}</span>
      </div>`;
    }
    return `<div class="skill-row locked">
      <span class="name">???</span>
      <span class="desc"></span>
    </div>`;
  }).join('');

  return `
    <div class="list">${titleRows}</div>
    <div class="section-heading">${esc(skillsHeading)}</div>
    <div class="list">${skillRows}</div>
  `;
}

export function mountCollectionOverlay(opts: CollectionOverlayOptions): () => void {
  ensureFrameStyle();
  ensureStyle(STYLE_ID, CSS);
  clearPriorRoots(ROOT_CLASS);

  const root = document.createElement('div');
  root.className = ROOT_CLASS;

  const tabs: CollectionTab[] = ['machines', 'parts', 'enemies', 'titles'];
  let activeTab: CollectionTab = 'machines';

  const renderTabs = (): string => tabs
    .map((t) => `<div class="tab${t === activeTab ? ' active' : ''}" data-tab="${t}">${esc(opts.tabLabels[t])}</div>`)
    .join('');

  const renderCount = (): string => {
    if (activeTab === 'machines') {
      const unlocked = opts.machines.filter((m) => m.unlocked).length;
      return opts.countTemplates.machines(unlocked, opts.machines.length);
    }
    if (activeTab === 'parts') {
      const discovered = opts.parts.filter((p) => p.used).length;
      return opts.countTemplates.parts(discovered, opts.parts.length);
    }
    if (activeTab === 'enemies') {
      const defeated = opts.enemies.filter((e) => e.defeated).length;
      return opts.countTemplates.enemies(defeated, opts.enemies.length);
    }
    const earned = opts.titles.filter((t) => t.earned).length;
    const skillsAcquired = opts.skills.filter((s) => s.acquired).length;
    return opts.countTemplates.titles(earned, opts.titles.length, skillsAcquired, opts.skills.length);
  };

  const renderBody = (): string => {
    switch (activeTab) {
      case 'machines': return renderMachinesCards(opts.machines, opts.lockedLabel, opts.clearsLabel);
      case 'parts': return renderPartsCards(opts.parts);
      case 'enemies': return renderEnemiesCards(opts.enemies);
      case 'titles': return renderTitles(opts.titles, opts.skills, opts.skillsHeading);
    }
  };

  root.innerHTML = `
    <div class="stage ss-stage">
      ${buildFrameHtml({
        tagLeft: '<b>SS</b>-<b>050</b> / ARCHIVE <span class="bar"></span> COLLECTION',
        tagRight: 'UNLOCK STATUS <span class="bar"></span> <b>INDEX</b>',
      })}
      <div class="title">${esc(opts.title)}</div>
      <div class="panel">
        <div class="tabs">${renderTabs()}</div>
        <div class="count">${renderCount()}</div>
        <div class="body">${renderBody()}</div>
      </div>
      <button class="back" data-role="back">${esc(opts.backLabel)}</button>
    </div>
  `;

  document.body.appendChild(root);

  const stage = root.querySelector('.stage') as HTMLElement;
  const disposeFit = fitStageToCanvas(stage);

  const refreshBody = (): void => {
    const tabsEl = root.querySelector('.tabs');
    const countEl = root.querySelector('.count');
    const bodyEl = root.querySelector('.body');
    if (tabsEl) tabsEl.innerHTML = renderTabs();
    if (countEl) countEl.textContent = renderCount();
    if (bodyEl) bodyEl.innerHTML = renderBody();
    wireTabs();
  };

  const wireTabs = (): void => {
    root.querySelectorAll<HTMLElement>('[data-tab]').forEach((el) => {
      el.addEventListener('click', () => {
        const next = el.getAttribute('data-tab') as CollectionTab | null;
        if (!next || next === activeTab) return;
        activeTab = next;
        refreshBody();
      });
    });
  };
  wireTabs();

  const backBtn = root.querySelector('[data-role="back"]') as HTMLElement | null;
  backBtn?.addEventListener('click', () => opts.onBack());

  requestAnimationFrame(() => root.classList.add('visible'));

  return wrapUnmount(root, disposeFit);
}
