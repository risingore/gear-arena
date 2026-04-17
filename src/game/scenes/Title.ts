import { Scene } from 'phaser';

import gameOptions from '../helper/gameOptions';
import { createButton, createPanel } from '../helper/uiFactory';
import { resetRunState } from '../systems/runState';
import { PALETTE } from '../systems/palette';
import { playSfx } from '../systems/audio';
import { fadeInCurrent, fadeToScene } from '../systems/transition';
import { loadSaveData } from '../systems/savedata';
import { getPlayerTitle } from '../systems/achievements';
import { t } from '../systems/i18n';
import { playMusic, MUSIC_KEYS } from '../systems/music';
import { applyHiDpiToScene, showDebugBadge } from '../helper/hiDpiText';
import { runVisualChecks } from '../systems/visualDebugger';
import { isDebugEnabled, toggleDebug } from '../systems/debug';

export class Title extends Scene {
  constructor() {
    super('Title');
  }

  create(): void {
    const { gameWidth, gameHeight, gameTitle, textStyles } = gameOptions;

    // Reset run whenever returning to title.
    resetRunState(this);

    this.cameras.main.setBackgroundColor(PALETTE.bg);
    fadeInCurrent(this);
    playMusic(this, MUSIC_KEYS.title);

    // Blueprint-style grid background
    const gridAlpha = 0.06;
    for (let x = 0; x < gameWidth; x += 40) {
      this.add.rectangle(x, gameHeight / 2, 1, gameHeight, PALETTE.blueprintLine, gridAlpha);
    }
    for (let y = 0; y < gameHeight; y += 40) {
      this.add.rectangle(gameWidth / 2, y, gameWidth, 1, PALETTE.blueprintLine, gridAlpha);
    }

    // Decorative rotating gears
    this.drawBackgroundGear(gameWidth * 0.15, gameHeight * 0.72, 160, 14000, 0.15);
    this.drawBackgroundGear(gameWidth * 0.85, gameHeight * 0.28, 200, -18000, 0.12);
    this.drawBackgroundGear(gameWidth * 0.50, gameHeight * 0.85, 120, 10000, 0.08);

    // Title with entrance animation
    const titleText = this.add
      .text(gameWidth / 2, gameHeight * 0.28, gameTitle, { ...textStyles.title, fontSize: '80px' })
      .setOrigin(0.5)
      .setAlpha(0)
      .setScale(1.5);
    this.tweens.add({
      targets: titleText,
      alpha: 1,
      scale: 1,
      duration: 600,
      ease: 'Back.easeOut'
    });

    // Horizontal accent lines around title
    const lineY = gameHeight * 0.36;
    const lineL = this.add.rectangle(gameWidth / 2 - 200, lineY, 150, 2, PALETTE.accentOrange, 0.6);
    const lineR = this.add.rectangle(gameWidth / 2 + 200, lineY, 150, 2, PALETTE.accentOrange, 0.6);
    this.tweens.add({ targets: [lineL, lineR], alpha: { from: 0, to: 0.6 }, duration: 800, delay: 400 });

    // Subtitle
    const subText = this.add
      .text(gameWidth / 2, gameHeight * 0.40, t('One Shot. One Kill. Build Your Ultimate.'), textStyles.body)
      .setOrigin(0.5)
      .setAlpha(0);
    this.tweens.add({ targets: subText, alpha: 0.7, duration: 600, delay: 300 });

    this.add
      .text(gameWidth / 2, gameHeight - 24, t('Gamedev.js Jam 2026 / theme: Machines'), textStyles.small)
      .setOrigin(0.5)
      .setAlpha(0.4);

    // Best-run stats + title (if any)
    const save = loadSaveData();
    if (save.bestRound > 0 || save.totalClears > 0) {
      const statLine = `Best Round: ${save.bestRound}   ·   Victories: ${save.totalClears}   ·   Scrap: ${save.scrap}`;
      createPanel(this, gameWidth / 2, gameHeight * 0.83, 500, 64, { fillAlpha: 0.6, depth: 0 });
      this.add
        .text(gameWidth / 2, gameHeight * 0.80, statLine, textStyles.small)
        .setOrigin(0.5)
        .setAlpha(0.6);
    }
    const title = getPlayerTitle(save);
    if (title) {
      this.add
        .text(gameWidth / 2, gameHeight * 0.86, `— ${title} —`, textStyles.small)
        .setOrigin(0.5)
        .setColor('#ffd94a')
        .setAlpha(0.8);
    }

    const start = (): void => {
      playSfx('click');
      fadeToScene(this, 'Select');
    };
    this.input.keyboard?.once('keydown-SPACE', start);

    // Clickable start button
    createButton(this, gameWidth / 2, gameHeight * 0.56, 260, 48, t('START'), start);

    // Collection button
    createButton(this, gameWidth / 2, gameHeight * 0.63, 260, 44, t('COLLECTION'),
      () => { playSfx('click'); fadeToScene(this, 'Collection'); }
    );

    // Settings button
    createButton(this, gameWidth / 2, gameHeight * 0.69, 260, 44, t('SETTINGS'),
      () => { playSfx('click'); fadeToScene(this, 'Settings'); }
    );

    // Debug toggle button (bottom-left)
    const debugLabel = this.add
      .text(16, gameHeight - 24, `DEBUG: ${isDebugEnabled() ? 'ON' : 'OFF'}`, textStyles.small)
      .setOrigin(0, 1)
      .setAlpha(isDebugEnabled() ? 0.9 : 0.5)
      .setInteractive({ useHandCursor: true });
    debugLabel.on('pointerdown', () => {
      const on = toggleDebug();
      debugLabel.setText(`DEBUG: ${on ? 'ON' : 'OFF'}`);
      debugLabel.setAlpha(on ? 0.9 : 0.5);
      playSfx('click');
    });
    debugLabel.on('pointerover', () => debugLabel.setAlpha(1));
    debugLabel.on('pointerout', () => debugLabel.setAlpha(isDebugEnabled() ? 0.9 : 0.5));

    applyHiDpiToScene(this);
    showDebugBadge(this, isDebugEnabled());
    runVisualChecks(this);
  }

  private drawBackgroundGear(
    cx: number,
    cy: number,
    radius: number,
    periodMs: number,
    alpha: number
  ): void {
    const container = this.add.container(cx, cy).setAlpha(alpha);
    const ring = this.add.circle(0, 0, radius, 0x000000, 0).setStrokeStyle(3, PALETTE.blueprintLine);
    container.add(ring);
    const innerRing = this.add.circle(0, 0, radius * 0.55, 0x000000, 0).setStrokeStyle(2, PALETTE.blueprintLine);
    container.add(innerRing);
    const teeth = 10;
    for (let i = 0; i < teeth; i += 1) {
      const angle = (i / teeth) * Math.PI * 2;
      const tx = Math.cos(angle) * radius;
      const ty = Math.sin(angle) * radius;
      const tooth = this.add
        .rectangle(tx, ty, 12, 18, PALETTE.blueprintLine, 1)
        .setAngle((angle * 180) / Math.PI + 90);
      container.add(tooth);
    }
    const cross1 = this.add
      .rectangle(0, 0, radius * 1.4, 2, PALETTE.blueprintLine, 0.5)
      .setOrigin(0.5);
    const cross2 = this.add
      .rectangle(0, 0, 2, radius * 1.4, PALETTE.blueprintLine, 0.5)
      .setOrigin(0.5);
    container.add(cross1);
    container.add(cross2);
    this.tweens.add({
      targets: container,
      angle: periodMs > 0 ? 360 : -360,
      duration: Math.abs(periodMs),
      repeat: -1,
      ease: 'Linear'
    });
  }
}
