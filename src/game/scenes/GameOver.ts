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

    this.add
      .text(gameWidth / 2, gameHeight * 0.6, t('Press SPACE or R to restart'), textStyles.body)
      .setOrigin(0.5);

    const restart = (): void => {
      playSfx('click');
      fadeToScene(this, 'Title');
    };

    this.input.keyboard?.once('keydown-SPACE', restart);
    this.input.keyboard?.once('keydown-R', restart);
    this.input.once('pointerdown', restart);

    applyHiDpiToScene(this);
    showDebugBadge(this, isDebugEnabled());
  }
}
