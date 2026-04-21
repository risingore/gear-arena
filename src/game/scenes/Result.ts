import { Scene } from 'phaser';

import { PARTS, ROBOTS, rollSkillChoices, type PartCategory } from '@/data';
import { BALANCE } from '@/data/balance';
import type { SkillDef } from '@/data/skills';
import { findEnemyDef } from '@/data/enemies';
import {
  ATMAN_NORMAL_STATEMENTS,
  ATMAN_MIDBOSS_STATEMENTS,
  ATMAN_BIGBOSS_STATEMENTS,
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
  loadSaveData,
} from '../systems/savedata';
import { mountEndingScrollOverlay } from '../overlays/endingScrollOverlay';
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
  private unmountEnding: (() => void) | null = null;

  constructor() {
    super('Result');
  }

  create(): void {
    this.cameras.main.setBackgroundColor(PALETTE.bg);
    fadeInCurrent(this);

    const state = getRunState(this);
    const outcome = state.battleOutcome;
    if (outcome === 'victory') playMusic(this, MUSIC_KEYS.victory, false);

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
    } else {
      this.renderPending('...', '#aeeaff');
    }

    const cleanup = (): void => {
      this.unmountOverlay?.();
      this.unmountOverlay = null;
      this.unmountEnding?.();
      this.unmountEnding = null;
    };
    this.events.once('shutdown', cleanup);
    this.events.once('destroy', cleanup);

    // Global R shortcut: matches every other scene — bail to Title.
    this.input.keyboard?.on('keydown-R', () => {
      playSfx('click');
      fadeToScene(this, 'Title');
    });

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
      primaryAccentHex: '#3aff7a',
      acquiredLabelPrefix: t('Acquired:'),
      onPrimary: () => {
        playSfx('click');
        fadeToScene(this, 'Build');
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
          undefined,
          '#3aff7a',
          () => {
            playSfx('click');
            fadeToScene(this, 'Build');
          },
          undefined,
        );
      },
    });
    this.unmountOverlay = () => handle.unmount();

    // SPACE advances to the next round. While the skill cards are still
    // on screen we ignore it so the player has to actually pick a skill
    // with 1/2/3 first; once the skill-cards block is gone SPACE is the
    // "NEXT ROUND" shortcut again.
    this.input.keyboard?.on('keydown-SPACE', () => {
      const cardsStillUp = document.querySelector(
        '.soul-strike-result-overlay .skill-cards',
      );
      if (cardsStillUp) return;
      playSfx('click');
      fadeToScene(this, 'Build');
    });

    // Boss-clear skill selection: 1 / 2 / 3 keys map to the three cards
    // from left to right so the player never has to reach for the mouse.
    if (skillRoll.length > 0) {
      const numberKeys = ['ONE', 'TWO', 'THREE'] as const;
      numberKeys.forEach((key, i) => {
        this.input.keyboard?.once(`keydown-${key}`, () => {
          const choice = skillRoll[i];
          if (!choice) return;
          const card = document.querySelector(
            `.soul-strike-result-overlay [data-skill="${i}"]`,
          ) as HTMLElement | null;
          card?.click();
        });
      });
    }
  }

  private renderVictory(
    state: import('../systems/runState').RunState,
    title: string,
    titleColor: string,
  ): void {
    const priorClears = loadSaveData().totalClears;
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
    });
    this.unmountOverlay = () => handle.unmount();

    // Start the typewriter immediately so players watch ATMAN's final
    // statement unfold during the Victory screen.
    handle.startAtmanTypewriter(8000);
    this.scheduleEndingScroll(priorClears > 0, handle);
  }

  private scheduleEndingScroll(showSkip: boolean, handle: import('../overlays/resultOverlay').ResultOverlayHandle): void {
    this.time.delayedCall(10000, () => {
      handle.startGlitch();
    });
    this.time.delayedCall(12000, () => {
      this.unmountEnding = mountEndingScrollOverlay({
        returnLabel: t('← RETURN TO TITLE'),
        showSkip,
        onReturn: () => {
          playSfx('click');
          fadeToScene(this, 'Title');
        },
      });
    });
    this.time.delayedCall(12800, () => {
      this.unmountOverlay?.();
      this.unmountOverlay = null;
    });
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
