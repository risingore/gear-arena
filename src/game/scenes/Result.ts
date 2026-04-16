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
import { applyHiDpiToScene, showDebugBadge } from '../helper/hiDpiText';
import { isDebugEnabled } from '../systems/debug';

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

    if (outcome === 'win') {
      const rewarded = awardRoundReward(state);
      const advanced = {
        ...rewarded,
        currentRound: state.currentRound + 1,
        battleOutcome: 'pending' as const,
        shopOffer: generateShopOffer()
      };
      setRunState(this, advanced);

      this.add
        .text(
          gameWidth / 2,
          gameHeight * 0.55,
          `${t('Earned gold — total now')} ${advanced.gold}g`,
          textStyles.body
        )
        .setOrigin(0.5)
        .setColor('#ffd94a');

      this.makeClickButton(gameWidth / 2, gameHeight * 0.70, t('▶  NEXT ROUND'), () => {
        playSfx('click');
        fadeToScene(this, 'Build');
      });
      this.makeClickButton(gameWidth / 2, gameHeight * 0.78, t('QUIT TO TITLE'), () => {
        playSfx('click');
        fadeToScene(this, 'Title');
      }, 0.5);

      this.input.keyboard?.once('keydown-SPACE', () => { playSfx('click'); fadeToScene(this, 'Build'); });
    } else if (outcome === 'victory') {
      if (state.robotKey) recordVictory(state.robotKey);
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

      const summary = this.buildMachineSummary(state.robotKey, state.equipped);
      if (summary) {
        this.add
          .text(gameWidth / 2, gameHeight * 0.63, summary, textStyles.small)
          .setOrigin(0.5)
          .setAlpha(0.85);
      }

      this.makeClickButton(gameWidth / 2, gameHeight * 0.75, t('▶  RETURN TO TITLE'), () => {
        playSfx('click');
        fadeToScene(this, 'Title');
      });
      this.input.keyboard?.once('keydown-SPACE', () => fadeToScene(this, 'Title'));
    } else if (outcome === 'lose') {
      this.makeClickButton(gameWidth / 2, gameHeight * 0.70, t('▶  CONTINUE'), () => {
        playSfx('click');
        fadeToScene(this, 'GameOver');
      });
      this.input.keyboard?.once('keydown-SPACE', () => fadeToScene(this, 'GameOver'));
      this.time.delayedCall(2500, () => fadeToScene(this, 'GameOver'));
    } else {
      this.makeClickButton(gameWidth / 2, gameHeight * 0.70, t('▶  RETURN TO TITLE'), () => {
        playSfx('click');
        fadeToScene(this, 'Title');
      });
      this.input.keyboard?.once('keydown-SPACE', () => fadeToScene(this, 'Title'));
    }

    applyHiDpiToScene(this);
    showDebugBadge(this, isDebugEnabled());
  }

  private makeClickButton(
    x: number,
    y: number,
    label: string,
    onClick: () => void,
    baseAlpha = 0.8
  ): void {
    const btn = this.add
      .text(x, y, label, gameOptions.textStyles.body)
      .setOrigin(0.5)
      .setAlpha(baseAlpha)
      .setInteractive({ useHandCursor: true });
    btn.on('pointerover', () => { btn.setAlpha(1); btn.setScale(1.08); });
    btn.on('pointerout', () => { btn.setAlpha(baseAlpha); btn.setScale(1); });
    btn.on('pointerdown', onClick);
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
