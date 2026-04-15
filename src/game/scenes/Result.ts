import { Scene } from 'phaser';

import gameOptions from '../helper/gameOptions';
import { PARTS, ROBOTS, type PartCategory, type PartKey } from '@/data';
import { getRunState, setRunState } from '../systems/runState';
import { PALETTE } from '../systems/palette';
import { awardRoundReward } from '../systems/loadout';
import { generateShopOffer } from '../systems/shop';
import { playSfx } from '../systems/audio';
import { fadeInCurrent, fadeToScene } from '../systems/transition';
import { recordVictory, recordDefeatedEnemy, recordUsedPart } from '../systems/savedata';
import { t } from '../systems/i18n';
import { playMusic, MUSIC_KEYS } from '../systems/music';
import { applyHiDpiToScene } from '../helper/hiDpiText';

export class Result extends Scene {
  constructor() {
    super('Result');
  }

  create(): void {
    const { gameWidth, gameHeight, textStyles } = gameOptions;
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
      for (const partKey of Object.values(state.equipped)) {
        if (partKey) recordUsedPart(partKey as PartKey);
      }
    }

    const titleMap: Record<typeof outcome, string> = {
      pending: '...',
      win: t('ROUND CLEARED'),
      lose: t('DEFEATED'),
      victory: t('VICTORY')
    };
    const titleColor =
      outcome === 'victory'
        ? '#ffd94a'
        : outcome === 'win'
          ? '#3aff7a'
          : '#ff4444';

    this.add
      .text(gameWidth / 2, gameHeight * 0.3, titleMap[outcome], textStyles.title)
      .setOrigin(0.5)
      .setColor(titleColor);

    this.add
      .text(gameWidth / 2, gameHeight * 0.44, state.lastResultMessage, textStyles.body)
      .setOrigin(0.5);

    let instruction = '';
    if (outcome === 'win') {
      const rewarded = awardRoundReward(state);
      // Auto-reroll the shop on every round transition so the player always
      // greets the next Build phase with a fresh selection — no need to spend
      // a manual reroll just to clear leftover inventory.
      const advanced = {
        ...rewarded,
        currentRound: state.currentRound + 1,
        battleOutcome: 'pending' as const,
        shopOffer: generateShopOffer()
      };
      setRunState(this, advanced);
      instruction = t('Press SPACE to continue to next round   ·   R to quit');
      this.input.keyboard?.once('keydown-SPACE', () => {
        playSfx('click');
        fadeToScene(this, 'Build');
      });
      this.input.keyboard?.once('keydown-R', () => {
        playSfx('click');
        fadeToScene(this, 'Title');
      });
      this.add
        .text(
          gameWidth / 2,
          gameHeight * 0.55,
          `${t('Earned gold — total now')} ${advanced.gold}g`,
          textStyles.body
        )
        .setOrigin(0.5)
        .setColor('#ffd94a');
    } else if (outcome === 'victory') {
      if (state.robotKey) recordVictory(state.robotKey);
      instruction = t('Press SPACE to return to title');
      this.input.keyboard?.once('keydown-SPACE', () => fadeToScene(this, 'Title'));
      this.input.keyboard?.once('keydown-R', () => fadeToScene(this, 'Title'));
      const totalRounds = state.generatedRounds.length;
      this.add
        .text(
          gameWidth / 2,
          gameHeight * 0.55,
          `${t('All')} ${totalRounds} ${t('rounds cleared. Final gold:')} ${state.gold}g`,
          textStyles.body
        )
        .setOrigin(0.5)
        .setColor('#ffd94a');

      // Theme-reinforcing machine summary: "Your machine contained: ..."
      const summary = this.buildMachineSummary(state.robotKey, state.equipped);
      if (summary) {
        this.add
          .text(gameWidth / 2, gameHeight * 0.63, summary, textStyles.small)
          .setOrigin(0.5)
          .setAlpha(0.85);
      }
    } else if (outcome === 'lose') {
      instruction = t('Press SPACE or R to restart');
      this.input.keyboard?.once('keydown-SPACE', () => fadeToScene(this, 'GameOver'));
      this.input.keyboard?.once('keydown-R', () => fadeToScene(this, 'GameOver'));
      this.time.delayedCall(1800, () => fadeToScene(this, 'GameOver'));
    } else {
      instruction = t('Press SPACE to return to title');
      this.input.keyboard?.once('keydown-SPACE', () => fadeToScene(this, 'Title'));
    }

    this.add
      .text(gameWidth / 2, gameHeight * 0.75, instruction, textStyles.small)
      .setOrigin(0.5)
      .setAlpha(0.8);

    applyHiDpiToScene(this);
  }

  /**
   * Reinforce the "Machines" theme on the victory screen by describing the
   * assembled loadout: "Your KNIGHT-01 contained 2 weapons, 3 gears, 1 engine".
   */
  private buildMachineSummary(
    robotKey: string | null,
    equipped: Readonly<Record<string, string>>
  ): string {
    if (!robotKey || !(robotKey in ROBOTS)) return '';
    const robot = ROBOTS[robotKey as keyof typeof ROBOTS];
    const counts: Record<PartCategory, number> = {
      weapon: 0,
      armor: 0,
      engine: 0,
      gear: 0,
      special: 0
    };
    for (const slotId of Object.keys(equipped)) {
      const key = equipped[slotId];
      if (!key) continue;
      if (!(key in PARTS)) continue;
      const part = PARTS[key as keyof typeof PARTS];
      counts[part.category] += 1;
    }
    const parts: string[] = [];
    if (counts.weapon > 0) parts.push(`${counts.weapon} ${t('weapons')}`);
    if (counts.armor > 0) parts.push(`${counts.armor} ${t('armor')}`);
    if (counts.engine > 0) parts.push(`${counts.engine} ${t('engines')}`);
    if (counts.gear > 0) parts.push(`${counts.gear} ${t('gears')}`);
    if (counts.special > 0) parts.push(`${counts.special} ${t('specials')}`);
    if (parts.length === 0) return '';
    return `${t('Your')} ${t(robot.name)} ${t('contained')}: ${parts.join(', ')}`;
  }
}
