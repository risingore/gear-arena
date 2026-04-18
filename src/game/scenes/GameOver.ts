import { Scene } from 'phaser';

import gameOptions from '../helper/gameOptions';
import { createButton, createPanel } from '../helper/uiFactory';
import { getRunState } from '../systems/runState';
import { PALETTE } from '../systems/palette';
import { fadeInCurrent, fadeToScene } from '../systems/transition';
import { playSfx } from '../systems/audio';
import { recordScrap } from '../systems/savedata';
import { t } from '../systems/i18n';
import { applyHiDpiToScene, showDebugBadge } from '../helper/hiDpiText';
import { runVisualChecks } from '../systems/visualDebugger';
import { setupLayoutDebug } from '../systems/layoutDebug';
import { isDebugEnabled } from '../systems/debug';

export class GameOver extends Scene {
  constructor() {
    super('GameOver');
  }

  create(): void {
    const { gameWidth, gameHeight, textStyles } = gameOptions;
    this.cameras.main.setBackgroundColor(PALETTE.bg);
    fadeInCurrent(this);

    const state = getRunState(this);

    this.add
      .text(gameWidth / 2, gameHeight * 0.3, t('GAME OVER'), textStyles.title)
      .setOrigin(0.5)
      .setColor('#ff4444');

    this.add
      .text(
        gameWidth / 2,
        gameHeight * 0.40,
        `${t('Reached round')} ${state.currentRound} / ${state.generatedRounds?.length || 10}`,
        textStyles.body
      )
      .setOrigin(0.5);

    // Convert remaining gold to scrap on defeat.
    const scrapEarned = Math.floor(state.gold * 0.5);
    if (scrapEarned > 0) {
      recordScrap(scrapEarned);
      this.add
        .text(gameWidth / 2, gameHeight * 0.44, `+${scrapEarned} Scrap`, textStyles.small)
        .setOrigin(0.5)
        .setColor('#aeeaff');
    }

    // Run stats summary
    const rs = state.runStats;
    const statsLines = [
      `DMG Dealt: ${rs.totalDamageDealt}   DMG Taken: ${rs.totalDamageTaken}`,
      `Healed: ${rs.totalHealed}   Rounds: ${rs.roundsCleared}   Enemies: ${rs.enemiesDefeated}`,
      `Parts Used: ${rs.partsUsed}`
    ];
    this.add
      .text(gameWidth / 2, gameHeight * 0.49, statsLines.join('\n'), textStyles.small)
      .setOrigin(0.5)
      .setAlpha(0.7);

    // Analysis hint based on loadout.
    const equipped = state.equipped ?? {};
    const partCount = Object.keys(equipped).length;
    const weaponCount = Object.values(equipped).filter((e) => e?.key && String(e.key).startsWith('weapon_')).length;
    let hint = '';
    if (weaponCount === 0) hint = t('Tip: Equip modules to add strikes to your soul strike!');
    else if (partCount <= 2) hint = t('Tip: Fill more slots to power up your soul strike.');
    else if (weaponCount === 1) hint = t('Tip: More modules = more soul strike hits!');
    else hint = t('Tip: Try different part combos to boost your soul strike damage.');
    createPanel(this, gameWidth / 2, gameHeight * 0.59, 520, 36, { fillAlpha: 0.5, depth: 0 });
    this.add
      .text(gameWidth / 2, gameHeight * 0.59, hint, textStyles.small)
      .setOrigin(0.5)
      .setAlpha(0.7);

    const restart = (): void => {
      playSfx('click');
      fadeToScene(this, 'Title');
    };

    createButton(this, gameWidth / 2, gameHeight * 0.69, 280, 48, t('RETURN TO TITLE'), restart);
    this.input.keyboard?.once('keydown-SPACE', restart);
    this.input.keyboard?.once('keydown-R', restart);

    applyHiDpiToScene(this);
    showDebugBadge(this, isDebugEnabled());
    runVisualChecks(this);
    setupLayoutDebug(this);
  }
}
