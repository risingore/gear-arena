import { Scene } from 'phaser';

import { BALANCE } from '@/data/balance';
import { getRunState } from '../systems/runState';
import { PALETTE } from '../systems/palette';
import { fadeInCurrent, fadeToScene } from '../systems/transition';
import { playSfx } from '../systems/audio';
import { recordScrap, recordBattleCompleted } from '../systems/savedata';
import { t } from '../systems/i18n';
import { isDebugEnabled } from '../systems/debug';
import { showDebugBadge } from '../helper/hiDpiText';
import { mountGameOverOverlay } from '../overlays/gameOverOverlay';

export class GameOver extends Scene {
  private unmountOverlay: (() => void) | null = null;

  constructor() {
    super('GameOver');
  }

  create(): void {
    this.cameras.main.setBackgroundColor(PALETTE.bg);
    fadeInCurrent(this);

    const state = getRunState(this);
    const scrapEarned = Math.floor(state.gold * BALANCE.scrapConversionRate);
    if (scrapEarned > 0) recordScrap(scrapEarned);
    // SANCTUM unlock counter — only ticks on full-run completion
    // (this branch = defeat). Mid-run R-to-Title leaves it untouched.
    recordBattleCompleted();

    const equipped = state.equipped ?? {};
    const partCount = Object.keys(equipped).length;
    const weaponCount = Object.values(equipped).filter(
      (e) => e?.key && String(e.key).startsWith('weapon_')
    ).length;
    let hint = '';
    if (weaponCount === 0) hint = t('Tip: Equip modules to add strikes to your soul strike!');
    else if (partCount <= 2) hint = t('Tip: Fill more slots to power up your soul strike.');
    else if (weaponCount === 1) hint = t('Tip: More modules = more soul strike hits!');
    else hint = t('Tip: Try different part combos to boost your soul strike damage.');

    const rs = state.runStats;
    const statsLines = [
      `DMG Dealt: ${rs.totalDamageDealt}   DMG Taken: ${rs.totalDamageTaken}`,
      `Healed: ${rs.totalHealed}   Rounds: ${rs.roundsCleared}   Enemies: ${rs.enemiesDefeated}`,
      `Parts Used: ${rs.partsUsed}`,
    ];

    const restart = (): void => {
      playSfx('click');
      fadeToScene(this, 'Title');
    };

    this.unmountOverlay = mountGameOverOverlay({
      round: state.currentRound,
      totalRounds: state.generatedRounds?.length || 10,
      scrapEarned,
      statsLines,
      hint,
      onReturnToTitle: restart,
      returnLabel: t('RETURN TO TITLE'),
    });

    this.events.once('shutdown', () => {
      this.unmountOverlay?.();
      this.unmountOverlay = null;
    });
    this.events.once('destroy', () => {
      this.unmountOverlay?.();
      this.unmountOverlay = null;
    });

    this.input.keyboard?.once('keydown-SPACE', restart);
    this.input.keyboard?.once('keydown-R', restart);

    showDebugBadge(this, isDebugEnabled());
  }
}
