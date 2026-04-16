import { Scene } from 'phaser';

import gameOptions from '../helper/gameOptions';
import { getRunState } from '../systems/runState';
import { PALETTE } from '../systems/palette';
import { fadeInCurrent, fadeToScene } from '../systems/transition';
import { playSfx } from '../systems/audio';
import { t } from '../systems/i18n';
import { applyHiDpiToScene, showDebugBadge } from '../helper/hiDpiText';
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
        gameHeight * 0.45,
        `${t('Reached round')} ${state.currentRound} / ${state.generatedRounds?.length || 10}`,
        textStyles.body
      )
      .setOrigin(0.5);

    // Analysis hint based on loadout.
    const equipped = state.equipped ?? {};
    const partCount = Object.keys(equipped).length;
    const weaponCount = Object.values(equipped).filter((k) => k && String(k).startsWith('weapon_')).length;
    let hint = '';
    if (weaponCount === 0) hint = t('Tip: You had no weapons. Buy a weapon first!');
    else if (partCount <= 2) hint = t('Tip: Try filling more slots before fighting.');
    else if (weaponCount === 1) hint = t('Tip: Adding a second weapon doubles your DPS.');
    else hint = t('Tip: Try different part combinations or a different robot.');
    this.add
      .text(gameWidth / 2, gameHeight * 0.54, hint, textStyles.small)
      .setOrigin(0.5)
      .setAlpha(0.7);

    const restartBtn = this.add
      .text(gameWidth / 2, gameHeight * 0.64, t('▶  RETURN TO TITLE'), textStyles.body)
      .setOrigin(0.5)
      .setAlpha(0.8)
      .setInteractive({ useHandCursor: true });

    const restart = (): void => {
      playSfx('click');
      fadeToScene(this, 'Title');
    };

    restartBtn.on('pointerover', () => { restartBtn.setAlpha(1); restartBtn.setScale(1.08); });
    restartBtn.on('pointerout', () => { restartBtn.setAlpha(0.8); restartBtn.setScale(1); });
    restartBtn.on('pointerdown', restart);
    this.input.keyboard?.once('keydown-SPACE', restart);
    this.input.keyboard?.once('keydown-R', restart);

    applyHiDpiToScene(this);
    showDebugBadge(this, isDebugEnabled());
  }
}
