import { Scene } from 'phaser';

import { PARTS, ROBOTS, rollSkillChoices, type PartCategory } from '@/data';
import { BALANCE } from '@/data/balance';
import type { SkillDef } from '@/data/skills';
import { findEnemyDef } from '@/data/enemies';
import {
  ATMAN_NORMAL_STATEMENTS,
  ATMAN_MIDBOSS_STATEMENTS,
  ATMAN_BIGBOSS_STATEMENTS,
  HYAKKI_YAKOU_TEASER,
} from '@/data/storyText';
import { getRunState, setRunState } from '../systems/runState';
import { PALETTE } from '../systems/palette';
import { bl, t } from '../systems/i18n';
import { awardRoundReward } from '../systems/loadout';
import { generateShopOffer } from '../systems/shop';
import { playSfx } from '../systems/audio';
import { fadeInCurrent, fadeToScene } from '../systems/transition';
import {
  recordVictory,
  recordDefeatedEnemy,
  recordUsedPart,
  recordAcquiredSkill,
  recordScrap,
} from '../systems/savedata';
import { mountEdOverlay } from '../overlays/edOverlay';
import {
  mountResultOverlay,
  type ResultOverlayAtmanStatement,
  type ResultOverlaySkillChoice,
} from '../overlays/resultOverlay';
import { playMusic, MUSIC_KEYS } from '../systems/music';
import { showDebugBadge } from '../helper/hiDpiText';
import { isDebugEnabled } from '../systems/debug';

export class Result extends Scene {
  private unmountOverlay: (() => void) | null = null;
  private teaserEl: HTMLElement | null = null;
  private teaserTimers: number[] = [];

  constructor() {
    super('Result');
  }

  create(): void {
    this.cameras.main.setBackgroundColor(PALETTE.bg);
    fadeInCurrent(this);

    const state = getRunState(this);
    const outcome = state.battleOutcome;
    if (outcome === 'victory') playMusic(this, MUSIC_KEYS.victory);

    // Track defeated enemies and used parts in the collection.
    if ((outcome === 'win' || outcome === 'victory') && state.lastDefeatedEnemyId) {
      recordDefeatedEnemy(state.lastDefeatedEnemyId);
    }
    if (outcome === 'win' || outcome === 'victory') {
      for (const entry of Object.values(state.equipped)) {
        if (entry?.key) recordUsedPart(entry.key);
      }
    }

    if (outcome === 'win') {
      this.renderWin(state);
    } else if (outcome === 'victory') {
      this.renderVictory(state, t('VICTORY'), '#ffd94a');
    } else if (outcome === 'lose') {
      this.renderLose(t('DEFEATED'), '#ff4444');
    } else {
      this.renderPending('...', '#aeeaff');
    }

    const cleanup = (): void => {
      this.unmountOverlay?.();
      this.unmountOverlay = null;
      this.clearTeaser();
    };
    this.events.once('shutdown', cleanup);
    this.events.once('destroy', cleanup);

    showDebugBadge(this, isDebugEnabled());
  }

  private renderWin(state: import('../systems/runState').RunState): void {
    const rewarded = awardRoundReward(state);
    const advanced = {
      ...rewarded,
      currentRound: state.currentRound + 1,
      battleOutcome: 'pending' as const,
      shopOffer: generateShopOffer(),
    };
    setRunState(this, advanced);

    const goldEarned = advanced.gold - state.gold;

    // Boss round → offer skill selection
    const clearedRound = state.generatedRounds[state.currentRound - 1];
    const isBossRound = clearedRound?.isBoss === true;
    const isBigBoss =
      clearedRound && !clearedRound.isSuperBoss && state.currentRound >= 10;
    const isSuperRoute = state.generatedRounds.length > 10;

    let skillChoices: SkillDef[] = [];
    let skillRoll: ResultOverlaySkillChoice[] = [];
    if (isBossRound && advanced.acquiredSkills.length < 3) {
      const offerSkills = isBigBoss ? isSuperRoute : true;
      if (offerSkills) {
        const tier = isBigBoss ? ('bigBoss' as const) : ('midBoss' as const);
        skillChoices = rollSkillChoices(tier, advanced.acquiredSkills);
        skillRoll = skillChoices.map((s) => ({
          id: s.id,
          name: t(s.name),
          description: t(s.description),
        }));
      }
    }

    playSfx('buy');

    const handle = mountResultOverlay({
      outcome: 'win',
      title: t('ROUND CLEARED'),
      titleColor: '#3aff7a',
      goldBefore: state.gold,
      goldAfter: advanced.gold,
      goldEarned,
      atman: this.findAtmanStatement(state.lastDefeatedEnemyId),
      skillChoices: skillRoll.length > 0 ? skillRoll : undefined,
      skillLabel: t('CHOOSE A SKILL'),
      primaryLabel: skillRoll.length > 0 ? undefined : t('NEXT ROUND'),
      secondaryLabel: skillRoll.length > 0 ? undefined : t('QUIT TO TITLE'),
      primaryAccentHex: '#3aff7a',
      acquiredLabelPrefix: t('Acquired:'),
      onPrimary: () => {
        playSfx('click');
        fadeToScene(this, 'Build');
      },
      onSecondary: () => {
        playSfx('click');
        fadeToScene(this, 'Title');
      },
      onSkillPick: (choice) => {
        const skill = skillChoices.find((s) => s.id === choice.id);
        if (!skill) return;
        playSfx('buy');
        recordAcquiredSkill(skill.id);
        const updated = {
          ...advanced,
          acquiredSkills: [...advanced.acquiredSkills, skill.id],
        };
        setRunState(this, updated);
        handle.showAcquired(t(skill.name));
        handle.showContinue(
          t('NEXT ROUND'),
          t('QUIT TO TITLE'),
          '#3aff7a',
          () => {
            playSfx('click');
            fadeToScene(this, 'Build');
          },
          () => {
            playSfx('click');
            fadeToScene(this, 'Title');
          },
        );
      },
    });
    this.unmountOverlay = () => handle.unmount();

    this.input.keyboard?.once('keydown-SPACE', () => {
      if (skillRoll.length > 0) return; // wait for skill pick
      playSfx('click');
      fadeToScene(this, 'Build');
    });
  }

  private renderVictory(
    state: import('../systems/runState').RunState,
    title: string,
    titleColor: string,
  ): void {
    if (state.robotKey) recordVictory(state.robotKey);
    const scrapEarned = Math.floor(state.gold * BALANCE.scrapConversionRate);
    if (scrapEarned > 0) recordScrap(scrapEarned);

    const totalRounds = state.generatedRounds.length;
    const rs = state.runStats;
    const statsLines = [
      `DMG Dealt: ${rs.totalDamageDealt}   DMG Taken: ${rs.totalDamageTaken}`,
      `Healed: ${rs.totalHealed}   Rounds: ${rs.roundsCleared}   Enemies: ${rs.enemiesDefeated}`,
      `Parts Used: ${rs.partsUsed}`,
    ];

    const summary = this.buildMachineSummary(state.robotKey, state.equipped);
    const victoryLine = `${t('All')} ${totalRounds} ${t('rounds cleared. Final gold:')} ${state.gold} g`;

    const handle = mountResultOverlay({
      outcome: 'victory',
      title,
      titleColor,
      scrapEarned,
      statsLines: [victoryLine, '', ...statsLines],
      machineSummary: summary || undefined,
      atman: this.findAtmanStatement(state.lastDefeatedEnemyId),
      primaryLabel: t('RETURN TO TITLE'),
      primaryAccentHex: '#ffd94a',
      onPrimary: () => {
        playSfx('click');
        fadeToScene(this, 'Title');
      },
    });
    this.unmountOverlay = () => handle.unmount();

    this.showEdSequence();
  }

  private renderLose(title: string, titleColor: string): void {
    const handle = mountResultOverlay({
      outcome: 'lose',
      title,
      titleColor,
      primaryLabel: t('CONTINUE'),
      primaryAccentHex: '#ff4444',
      onPrimary: () => {
        playSfx('click');
        fadeToScene(this, 'GameOver');
      },
    });
    this.unmountOverlay = () => handle.unmount();

    // Shared single-shot guard so SPACE + auto-timer cannot both fire
    // `fadeToScene` on a shutting-down scene.
    let fired = false;
    const goGameOver = (): void => {
      if (fired) return;
      fired = true;
      autoTimer.remove(false);
      fadeToScene(this, 'GameOver');
    };
    const autoTimer = this.time.delayedCall(2500, goGameOver);
    this.input.keyboard?.once('keydown-SPACE', goGameOver);
  }

  private renderPending(title: string, titleColor: string): void {
    const handle = mountResultOverlay({
      outcome: 'pending',
      title,
      titleColor,
      primaryLabel: t('RETURN TO TITLE'),
      primaryAccentHex: '#aeeaff',
      onPrimary: () => {
        playSfx('click');
        fadeToScene(this, 'Title');
      },
    });
    this.unmountOverlay = () => handle.unmount();

    this.input.keyboard?.once('keydown-SPACE', () => fadeToScene(this, 'Title'));
  }

  private showEdSequence(): void {
    // Phase 1 (delay 1800ms): HYAKKI YAKOU glitch teaser text (the DOM
    // overlay flashes it over the victory panel at the bottom).
    this.time.delayedCall(1800, () => {
      const teaser = bl(HYAKKI_YAKOU_TEASER);
      this.flashTeaser(teaser);
    });

    // Phase 2 (delay 3600ms): SOUL BREAKER reveal via edOverlay.
    this.time.delayedCall(3600, () => {
      mountEdOverlay({
        continuedLabel: t('TO BE CONTINUED:'),
        heroText: 'SOUL BREAKER',
        holdMs: 3500,
      });
    });
  }

  private flashTeaser(text: string): void {
    this.clearTeaser();
    const el = document.createElement('div');
    el.textContent = text;
    el.style.cssText = `
      position:fixed;left:50%;bottom:80px;transform:translateX(-50%);
      font-family:'Rajdhani',sans-serif;font-style:italic;
      font-size:14px;letter-spacing:.12em;color:#aeeaff;
      opacity:0;pointer-events:none;z-index:105;
      transition:opacity 200ms ease;
    `;
    document.body.appendChild(el);
    this.teaserEl = el;
    requestAnimationFrame(() => {
      el.style.opacity = '0.6';
      this.teaserTimers.push(window.setTimeout(() => {
        el.style.opacity = '0';
        this.teaserTimers.push(window.setTimeout(() => {
          el.remove();
          if (this.teaserEl === el) this.teaserEl = null;
        }, 300));
      }, 500));
    });
  }

  private clearTeaser(): void {
    this.teaserTimers.forEach((id) => window.clearTimeout(id));
    this.teaserTimers = [];
    this.teaserEl?.remove();
    this.teaserEl = null;
  }

  private findAtmanStatement(enemyId: string | null | undefined): ResultOverlayAtmanStatement | undefined {
    if (!enemyId) return undefined;
    const def = findEnemyDef(enemyId);
    if (!def) return undefined;

    let statement: { en: string; ja: string } | undefined;
    if (def.category === 'midBoss') {
      statement = ATMAN_MIDBOSS_STATEMENTS[def.id];
    } else if (def.category === 'bigBoss') {
      statement = ATMAN_BIGBOSS_STATEMENTS[def.id];
    }
    if (!statement) {
      const idx = Math.floor(Math.random() * ATMAN_NORMAL_STATEMENTS.length);
      statement = ATMAN_NORMAL_STATEMENTS[idx];
    }
    if (!statement) return undefined;

    return { label: '— ATMAN —', text: bl(statement) };
  }

  private buildMachineSummary(
    robotKey: string | null,
    equipped: Readonly<Record<string, import('../systems/runState').EquippedEntry>>,
  ): string {
    if (!robotKey || !(robotKey in ROBOTS)) return '';
    const robot = ROBOTS[robotKey as keyof typeof ROBOTS];
    const counts: Record<PartCategory, number> = {
      module: 0,
      implant: 0,
      charger: 0,
      booster: 0,
      soul: 0,
    };
    for (const slotId of Object.keys(equipped)) {
      const entry = equipped[slotId];
      if (!entry?.key) continue;
      if (!(entry.key in PARTS)) continue;
      const part = PARTS[entry.key as keyof typeof PARTS];
      counts[part.category] += 1;
    }
    const parts: string[] = [];
    if (counts.module > 0) parts.push(`${counts.module} ${t('modules')}`);
    if (counts.implant > 0) parts.push(`${counts.implant} ${t('implants')}`);
    if (counts.charger > 0) parts.push(`${counts.charger} ${t('chargers')}`);
    if (counts.booster > 0) parts.push(`${counts.booster} ${t('boosters')}`);
    if (counts.soul > 0) parts.push(`${counts.soul} ${t('souls')}`);
    if (parts.length === 0) return '';
    return `${t('Your')} ${t(robot.name)} ${t('contained')}: ${parts.join(', ')}`;
  }
}
