/**
 * Round / Campaign result HTML overlay.
 *
 * Outcomes:
 *   - `win`     : ROUND CLEARED + gold reward + (optional) skill pick
 *                 + NEXT ROUND / QUIT TO TITLE
 *   - `victory` : VICTORY + stats + machine summary + ED sequence
 *   - `lose`    : DEFEATED + auto-forward to GameOver
 *   - `pending` : fallback with RETURN TO TITLE
 */

import { escapeHtml as esc, ensureStyle, ensureFrameStyle, buildFrameHtml, clearPriorRoots, fitStageToCanvas, wrapUnmount } from './overlayBase';

export type ResultOutcome = 'win' | 'victory' | 'lose' | 'pending';

export interface ResultOverlaySkillChoice {
  readonly id: string;
  readonly name: string;
  readonly description: string;
}

export interface ResultOverlayAtmanStatement {
  readonly label: string;
  readonly text: string;
}

export interface ResultOverlayOptions {
  outcome: ResultOutcome;
  title: string;
  titleColor: string;
  roundLabel?: string;
  goldBefore?: number;
  goldAfter?: number;
  goldEarned?: number;
  scrapEarned?: number;
  statsLines?: readonly string[];
  machineSummary?: string;
  atman?: ResultOverlayAtmanStatement;
  skillChoices?: readonly ResultOverlaySkillChoice[];
  skillLabel?: string;
  primaryLabel?: string;
  secondaryLabel?: string;
  primaryAccentHex?: string;
  acquiredLabelPrefix?: string;
  onPrimary?(): void;
  onSecondary?(): void;
  onSkillPick?(choice: ResultOverlaySkillChoice): void;
}

export interface ResultOverlayHandle {
  showAcquired(skillName: string): void;
  showContinue(
    primaryLabel: string,
    secondaryLabel: string | undefined,
    primaryAccentHex: string,
    onPrimary: () => void,
    onSecondary: (() => void) | undefined,
  ): void;
  /**
   * Kick off the pre-ending glitch buildup: text RGB split, stage
   * jitter, and scanline intensification. Used by the Result scene
   * right before it hands off to the credits scroll.
   */
  startGlitch(): void;
  /**
   * Reveal the ATMAN statement one character at a time over
   * `durationMs` milliseconds. Called on the victory panel so the
   * player watches the closing monologue instead of reading it in a
   * single glance.
   */
  startAtmanTypewriter(durationMs: number): void;
  unmount(): void;
}

const ROOT_CLASS = 'soul-strike-result-overlay';
const STYLE_ID = 'soul-strike-result-overlay-style';

const CSS = `
.${ROOT_CLASS}{
  position:fixed;inset:0;z-index:100;
  color:#e8ecf2;font-family:'Rajdhani',system-ui,sans-serif;
  pointer-events:none;opacity:0;transition:opacity 220ms ease;
  background:transparent;overflow:hidden;
}
.${ROOT_CLASS}.visible{opacity:1;pointer-events:auto}
.${ROOT_CLASS} .stage{
  width:1280px;height:720px;position:absolute;left:50%;top:50%;
  transform:translate(-50%,-50%);
  pointer-events:none;
}
.${ROOT_CLASS} .stage button{pointer-events:auto;cursor:pointer}
.${ROOT_CLASS} .stage .skill-card{pointer-events:auto;cursor:pointer}

.${ROOT_CLASS} .title{
  position:absolute;left:50%;top:110px;transform:translateX(-50%);
  font-family:'Bebas Neue',sans-serif;font-size:72px;letter-spacing:.05em;
  color:#fff;margin:0;
  /* Glow follows title colour via currentColor so lose (red) / win (green)
     / victory (gold) each get their own matching shadow. */
  text-shadow:0 0 20px currentColor;
}
.${ROOT_CLASS} .round{
  position:absolute;left:50%;top:200px;transform:translateX(-50%);
  font-size:14px;letter-spacing:.28em;color:#cfd8e4;opacity:.7;
}
.${ROOT_CLASS} .gold-panel{
  position:absolute;left:50%;top:210px;transform:translateX(-50%);
  width:260px;height:70px;background:rgba(10,10,16,.55);
  border:1px solid rgba(255,217,74,.35);
  display:flex;flex-direction:column;align-items:center;justify-content:center;
}
.${ROOT_CLASS} .gold-value{
  font-family:'Bebas Neue',sans-serif;font-size:36px;letter-spacing:.06em;
  color:#ffd94a;line-height:1;
}
.${ROOT_CLASS} .gold-earned{
  margin-top:4px;font-size:13px;letter-spacing:.12em;color:#3aff7a;
}
.${ROOT_CLASS} .scrap{
  position:absolute;left:50%;top:300px;transform:translateX(-50%);
  font-size:13px;letter-spacing:.18em;color:#aeeaff;
}

.${ROOT_CLASS} .atman{
  position:absolute;left:50%;transform:translateX(-50%);
  width:560px;padding:14px 24px;
  background:rgba(10,32,48,.85);border:1px solid #00ccff;
  box-shadow:0 0 22px rgba(0,204,255,.25);
}
.${ROOT_CLASS} .atman .label{
  font-size:11px;letter-spacing:.32em;color:#00ccff;opacity:.8;text-align:center;
}
.${ROOT_CLASS} .atman .text{
  margin-top:6px;font-size:14px;line-height:1.4;color:#88ddff;text-align:center;
}

.${ROOT_CLASS} .stats{
  position:absolute;left:50%;transform:translateX(-50%);
  font-size:12px;letter-spacing:.12em;color:#8da0ba;
  line-height:1.7;text-align:center;opacity:.8;
  font-variant-numeric:tabular-nums;
}
.${ROOT_CLASS} .machine-summary{
  position:absolute;left:50%;transform:translateX(-50%);
  font-size:13px;letter-spacing:.12em;color:#cfd8e4;opacity:.85;text-align:center;
}

.${ROOT_CLASS} .skill-label{
  position:absolute;left:50%;transform:translateX(-50%);
  font-family:'Bebas Neue',sans-serif;font-size:26px;letter-spacing:.18em;color:#ffd94a;
}
.${ROOT_CLASS} .skill-cards{
  position:absolute;left:50%;transform:translateX(-50%);
  display:flex;gap:16px;
}
.${ROOT_CLASS} .skill-card{
  width:240px;height:120px;padding:14px 18px;
  background:rgba(26,26,40,.75);border:2px solid rgba(174,234,255,.3);
  display:flex;flex-direction:column;align-items:center;justify-content:center;
  transition:border-color .15s ease, transform .15s ease;
  text-align:center;
}
.${ROOT_CLASS} .skill-card:hover{border-color:#ff7a00;transform:translateY(-3px)}
.${ROOT_CLASS} .skill-card .name{
  font-size:15px;letter-spacing:.1em;color:#ffd94a;font-weight:600;
}
.${ROOT_CLASS} .skill-card .desc{
  margin-top:8px;font-size:11px;letter-spacing:.05em;color:#cfd8e4;line-height:1.4;
}

.${ROOT_CLASS} .acquired{
  position:absolute;left:50%;transform:translateX(-50%);
  font-size:15px;letter-spacing:.12em;color:#3aff7a;
}

.${ROOT_CLASS} .actions{
  position:absolute;left:50%;transform:translateX(-50%);
  display:flex;flex-direction:column;gap:12px;align-items:center;
}
.${ROOT_CLASS} .btn-primary{
  width:280px;height:48px;border:none;
  font-family:'Bebas Neue',sans-serif;font-size:22px;letter-spacing:.14em;color:#fff;
  background:linear-gradient(90deg,var(--accent,#3aff7a),rgba(0,0,0,0));
  border:1px solid var(--accent,#3aff7a);border-left:3px solid var(--accent,#3aff7a);
  clip-path:polygon(0 0,calc(100% - 14px) 0,100% 14px,100% 100%,14px 100%,0 calc(100% - 14px));
  transition:transform .15s;
}
.${ROOT_CLASS} .btn-primary:hover{transform:translateX(3px)}
.${ROOT_CLASS} .btn-secondary{
  width:240px;height:42px;border:none;
  font-family:'Bebas Neue',sans-serif;font-size:16px;letter-spacing:.12em;color:#cfd8e4;
  background:rgba(58,58,85,.3);border:1px solid rgba(174,234,255,.3);
  transition:background .15s;
}
.${ROOT_CLASS} .btn-secondary:hover{background:rgba(85,85,119,.6)}

/* Victory -> ending glitch buildup: applied via JS just before the
   scroll overlay fades in. Three 1-second phases intensify the RGB
   split on the title, add positional jitter on the whole stage, and
   crank the scanline opacity so the screen visibly corrupts. */
.${ROOT_CLASS}.glitching .title{
  animation:ss-res-glitch-text 2s linear 1 forwards;
}
.${ROOT_CLASS}.glitching .atman,
.${ROOT_CLASS}.glitching .stats,
.${ROOT_CLASS}.glitching .machine-summary{
  animation:ss-res-glitch-jitter 2s linear 1 forwards;
}
.${ROOT_CLASS}.glitching .stage{
  animation:ss-res-glitch-filter 2s linear 1 forwards;
}
.${ROOT_CLASS}.glitching .stage::after{
  animation:ss-res-glitch-scan 2s linear 1 forwards !important;
}
.${ROOT_CLASS} .atman .text{
  /* soft cursor-like pulse at the end of the current typewriter chunk */
  min-height:1em;
}
@keyframes ss-res-glitch-text{
  0%   { text-shadow:0 0 20px currentColor; }
  20%  { text-shadow:-1px 0 rgba(255,0,60,.4), 1px 0 rgba(0,220,255,.4), 0 0 20px currentColor; }
  40%  { text-shadow:-2px 0 rgba(255,0,60,.6),-1px 0 rgba(0,220,255,.6), 0 0 24px currentColor; transform:translate(calc(-50% + 1px),1px); }
  55%  { text-shadow:3px 0 rgba(255,0,60,.8), -3px 0 rgba(0,220,255,.8), 0 0 26px currentColor; transform:translate(calc(-50% - 2px),-1px); }
  70%  { text-shadow:-4px 0 rgba(255,0,60,.9), 5px 0 rgba(0,220,255,.9), 0 0 30px currentColor; transform:translate(calc(-50% + 3px),2px); }
  85%  { text-shadow:-6px 0 rgba(255,0,60,1),  6px 0 rgba(0,220,255,1),  0 0 36px currentColor; transform:translate(calc(-50% - 4px),-2px); }
  100% { text-shadow:-8px 0 rgba(255,0,60,1),  8px 0 rgba(0,220,255,1),  0 0 44px currentColor; transform:translate(calc(-50% + 5px),0); opacity:.85; }
}
@keyframes ss-res-glitch-filter{
  /* Scale-safe: only mutate filter on .stage so the JS-set
     translate/scale on the stage transform is not clobbered. */
  0%,55% { filter:none; }
  60% { filter:hue-rotate(6deg) saturate(1.2); }
  65% { filter:none; }
  75% { filter:hue-rotate(-8deg) contrast(1.1); }
  85% { filter:hue-rotate(12deg) saturate(1.4); }
  95% { filter:hue-rotate(-14deg) contrast(1.2); }
  100%{ filter:hue-rotate(20deg) saturate(1.6) contrast(1.3); }
}
@keyframes ss-res-glitch-jitter{
  /* Applied to individual info blocks so each can slide without
     affecting the stage wrapper (which is JS-scaled). */
  0%,55% { transform:translateX(-50%); }
  60% { transform:translate(calc(-50% + 2px),0); }
  65% { transform:translate(calc(-50% - 3px),1px); }
  72% { transform:translate(calc(-50% + 4px),-2px); }
  80% { transform:translate(calc(-50% - 5px),0); }
  88% { transform:translate(calc(-50% + 6px),1px); }
  95% { transform:translate(calc(-50% - 4px),-1px); }
  100%{ transform:translate(-50%,0); opacity:.85; }
}
@keyframes ss-res-glitch-scan{
  0%   { opacity:.7; }
  50%  { opacity:.9; }
  100% { opacity:1; }
}
`;

export function mountResultOverlay(opts: ResultOverlayOptions): ResultOverlayHandle {
  ensureStyle(STYLE_ID, CSS);
  clearPriorRoots(ROOT_CLASS);

  const root = document.createElement('div');
  root.className = ROOT_CLASS;

  const showSkills = (opts.skillChoices?.length ?? 0) > 0;
  const skillsBlock = showSkills
    ? `
      <div class="skill-label" style="top:450px">${esc(opts.skillLabel ?? 'CHOOSE A SKILL')}</div>
      <div class="skill-cards" style="top:500px">
        ${opts.skillChoices!
          .map(
            (s, i) => `
          <button class="skill-card" data-skill="${i}">
            <div class="name">${esc(s.name)}</div>
            <div class="desc">${esc(s.description)}</div>
          </button>`,
          )
          .join('')}
      </div>
    `
    : '';

  const atmanY = opts.outcome === 'victory' ? 260 : showSkills ? 320 : 360;
  const atmanBlock = opts.atman
    ? `
      <div class="atman" style="top:${atmanY}px">
        <div class="label">${esc(opts.atman.label)}</div>
        <div class="text">${esc(opts.atman.text)}</div>
      </div>`
    : '';

  const goldBlock =
    opts.outcome === 'win' && opts.goldAfter !== undefined
      ? `
      <div class="gold-panel">
        <div class="gold-value" data-role="gold">${opts.goldBefore ?? opts.goldAfter} g</div>
        ${opts.goldEarned !== undefined ? `<div class="gold-earned">+${opts.goldEarned} g</div>` : ''}
      </div>`
      : '';

  const statsY = opts.outcome === 'victory' ? 430 : 0;
  // Stats line-height (12px × 1.7 ≈ 21px) → height per `<br/>`-joined line.
  // Compute the summary's top dynamically so it lands clear of the stats
  // block regardless of how many lines we pack into statsLines (currently
  // 5: victoryLine / blank / dmg / healed / parts). A previous hardcoded
  // 510 collided with the 5-line stats which extends to ~535.
  const STATS_LINE_PX = 21;
  const SUMMARY_PAD_PX = 24;
  const statsBlock =
    opts.outcome === 'victory' && opts.statsLines
      ? `<div class="stats" style="top:${statsY}px">${opts.statsLines.map(esc).join('<br/>')}</div>`
      : '';

  const summaryY =
    opts.outcome === 'victory' && opts.statsLines
      ? statsY + opts.statsLines.length * STATS_LINE_PX + SUMMARY_PAD_PX
      : 510;
  const summaryBlock =
    opts.outcome === 'victory' && opts.machineSummary
      ? `<div class="machine-summary" style="top:${summaryY}px">${esc(opts.machineSummary)}</div>`
      : '';

  const scrapBlock =
    opts.outcome === 'victory' && opts.scrapEarned && opts.scrapEarned > 0
      ? `<div class="scrap" style="top:400px">+${opts.scrapEarned} Scrap</div>`
      : '';

  const actionsTop = showSkills ? 610 : opts.outcome === 'victory' ? 660 : 570;
  const actionsBlock = opts.primaryLabel
    ? `
      <div class="actions" style="top:${actionsTop}px">
        ${opts.primaryLabel ? `<button class="btn-primary" data-role="primary" style="--accent:${esc(opts.primaryAccentHex ?? '#3aff7a')}">${esc(opts.primaryLabel)}</button>` : ''}
        ${opts.secondaryLabel ? `<button class="btn-secondary" data-role="secondary">${esc(opts.secondaryLabel)}</button>` : ''}
      </div>`
    : '';

  ensureFrameStyle();
  const outcomeTag = opts.outcome === 'win' ? 'ROUND CLEARED'
    : opts.outcome === 'victory' ? 'CAMPAIGN VICTORY'
    : opts.outcome === 'lose' ? 'DEFEATED'
    : 'RESULT';
  root.innerHTML = `
    <div class="stage ss-stage">
      ${buildFrameHtml({
        tagLeft: '<b>SS</b>-<b>005</b> / RESULT <span class="bar"></span> SUMMARY',
        tagRight: `${esc(outcomeTag)} <span class="bar"></span> <b>${esc(opts.roundLabel ?? '')}</b>`,
      })}
      <h1 class="title" style="color:${esc(opts.titleColor)}">${esc(opts.title)}</h1>
      ${goldBlock}
      ${scrapBlock}
      ${statsBlock}
      ${summaryBlock}
      ${atmanBlock}
      ${skillsBlock}
      ${actionsBlock}
    </div>
  `;

  document.body.appendChild(root);

  const stage = root.querySelector('.stage') as HTMLElement;
  const actionsContainer = root.querySelector('.actions') as HTMLElement | null;

  // Animate gold counter if provided
  if (opts.outcome === 'win' && opts.goldAfter !== undefined && opts.goldBefore !== undefined) {
    const goldEl = root.querySelector('[data-role="gold"]') as HTMLElement | null;
    if (goldEl) {
      const start = opts.goldBefore;
      const end = opts.goldAfter;
      const t0 = performance.now();
      const dur = 800;
      const step = (now: number): void => {
        if (!document.body.contains(goldEl)) return;
        const t = Math.min(1, (now - t0) / dur);
        const eased = 1 - Math.pow(1 - t, 3);
        const val = Math.floor(start + (end - start) * eased);
        goldEl.textContent = `${val} g`;
        if (t < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    }
  }

  // Wire actions
  (root.querySelector('[data-role="primary"]') as HTMLElement | null)?.addEventListener('click', () => opts.onPrimary?.());
  (root.querySelector('[data-role="secondary"]') as HTMLElement | null)?.addEventListener('click', () => opts.onSecondary?.());

  // Wire skill cards
  root.querySelectorAll<HTMLElement>('[data-skill]').forEach((el) => {
    el.addEventListener('click', () => {
      const idx = Number(el.dataset.skill);
      const choice = opts.skillChoices?.[idx];
      if (choice) opts.onSkillPick?.(choice);
    });
  });

  const disposeFit = fitStageToCanvas(stage);

  requestAnimationFrame(() => root.classList.add('visible'));

  return {
    showAcquired(skillName: string): void {
      // Remove skill card block
      root.querySelector('.skill-label')?.remove();
      root.querySelector('.skill-cards')?.remove();
      // Inject acquired label at the previous skill-label position
      const label = document.createElement('div');
      label.className = 'acquired';
      label.style.top = '470px';
      label.textContent = `${opts.acquiredLabelPrefix ?? 'Acquired:'} ${skillName}`;
      stage.appendChild(label);
    },
    showContinue(primaryLabel, secondaryLabel, primaryAccentHex, onPrimary, onSecondary): void {
      if (actionsContainer) actionsContainer.remove();
      const container = document.createElement('div');
      container.className = 'actions';
      container.style.top = '570px';
      const secondaryHtml = secondaryLabel
        ? `<button class="btn-secondary" data-role="secondary">${esc(secondaryLabel)}</button>`
        : '';
      container.innerHTML = `
        <button class="btn-primary" data-role="primary" style="--accent:${esc(primaryAccentHex)}">${esc(primaryLabel)}</button>
        ${secondaryHtml}
      `;
      stage.appendChild(container);
      (container.querySelector('[data-role="primary"]') as HTMLElement).addEventListener('click', onPrimary);
      const secondaryBtn = container.querySelector('[data-role="secondary"]') as HTMLElement | null;
      if (secondaryBtn && onSecondary) {
        secondaryBtn.addEventListener('click', onSecondary);
      }
    },
    startGlitch(): void {
      root.classList.add('glitching');
    },
    startAtmanTypewriter(durationMs: number): void {
      const textEl = root.querySelector('.atman .text') as HTMLElement | null;
      if (!textEl) return;
      const full = textEl.textContent ?? '';
      if (full.length === 0) return;
      textEl.textContent = '';
      const start = performance.now();
      const step = (now: number): void => {
        const elapsed = now - start;
        const ratio = Math.min(1, elapsed / durationMs);
        const shown = Math.floor(ratio * full.length);
        textEl.textContent = full.slice(0, shown);
        if (ratio < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    },
    unmount: wrapUnmount(root, disposeFit),
  };
}
