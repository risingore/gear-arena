import { Scene } from 'phaser';

import { getRunState } from '../systems/runState';
import { PALETTE } from '../systems/palette';
import { fadeInCurrent, fadeToScene } from '../systems/transition';
import { playSfx } from '../systems/audio';
import { recordBattleCompleted } from '../systems/savedata';
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
    // No scrap on death. Per-round scrap (Hard) was already banked via
    // Result.renderWin on each cleared round. Death simply forfeits the
    // remaining rounds' rewards. Easy gives nothing on death (its only
    // payout is the easyVictoryScrap on full clear).
    const scrapEarned = 0;
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

    // SANCTUM (加持堂) call-to-action — Hard mode only. Easy is meant
    // to be clearable buff-less, so a defeat there points at loadout
    // construction rather than meta-progression. Hard, by contrast,
    // is gear-walled past R7 and the SANCTUM loop is the intended
    // recovery arc, so we nudge the player toward it the moment they
    // bank scrap from a failed run.
    const sanctumPrompt = (state.endingMode === 'hard' && scrapEarned > 0)
      ? t('Spend Scrap at SANCTUM (加持堂) to consecrate buffs for your next run. With 3+ buffs, even Hard mode bends.')
      : '';

    this.unmountOverlay = mountGameOverOverlay({
      round: state.currentRound,
      totalRounds: state.generatedRounds?.length || 10,
      scrapEarned,
      statsLines,
      hint,
      sanctumPrompt,
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
