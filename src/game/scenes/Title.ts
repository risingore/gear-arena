import { Scene } from 'phaser';
import type { GameObjects } from 'phaser';

import gameOptions from '../helper/gameOptions';
import { resetRunState } from '../systems/runState';
import { PALETTE } from '../systems/palette';
import { playSfx } from '../systems/audio';
import { fadeInCurrent, fadeToScene } from '../systems/transition';
import { loadSaveData } from '../systems/savedata';
import { getPlayerTitle } from '../systems/achievements';
import { t } from '../systems/i18n';
import { playMusic, MUSIC_KEYS } from '../systems/music';
import { applyHiDpiToScene, showDebugBadge } from '../helper/hiDpiText';
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

    // Decorative rotating gears in the background (placeholder for Day 7 art).
    this.drawBackgroundGear(gameWidth * 0.18, gameHeight * 0.7, 140, 14000, 0.25);
    this.drawBackgroundGear(gameWidth * 0.82, gameHeight * 0.32, 180, -18000, 0.2);
    this.drawBackgroundGear(gameWidth * 0.92, gameHeight * 0.82, 100, 10000, 0.18);

    this.add
      .text(gameWidth / 2, gameHeight * 0.3, gameTitle, textStyles.title)
      .setOrigin(0.5);

    this.add
      .text(
        gameWidth / 2,
        gameHeight * 0.42,
        t('Slot-based Mecha Auto-Battler'),
        textStyles.body
      )
      .setOrigin(0.5)
      .setAlpha(0.7);

    this.add
      .text(gameWidth / 2, gameHeight - 24, t('Gamedev.js Jam 2026 / theme: Machines'), textStyles.small)
      .setOrigin(0.5)
      .setAlpha(0.4);

    // Best-run stats + title (if any)
    const save = loadSaveData();
    if (save.bestRound > 0 || save.totalClears > 0) {
      const statLine = `Best Round: ${save.bestRound}   ·   Victories: ${save.totalClears}   ·   Scrap: ${save.scrap}`;
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
    this.makeMenuButton(
      gameWidth / 2, gameHeight * 0.56, t('▶  START'), start
    );

    // Collection button
    this.makeMenuButton(
      gameWidth / 2, gameHeight * 0.63, t('COLLECTION'),
      () => { playSfx('click'); fadeToScene(this, 'Collection'); }
    );

    // Settings button
    this.makeMenuButton(
      gameWidth / 2, gameHeight * 0.69, t('SETTINGS'),
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
  }

  private makeMenuButton(
    x: number,
    y: number,
    label: string,
    onClick: () => void
  ): GameObjects.Text {
    const { textStyles } = gameOptions;
    const btn = this.add
      .text(x, y, label, textStyles.body)
      .setOrigin(0.5)
      .setAlpha(0.8)
      .setInteractive({ useHandCursor: true });
    btn.on('pointerover', () => { btn.setAlpha(1); btn.setScale(1.08); });
    btn.on('pointerout', () => { btn.setAlpha(0.8); btn.setScale(1); });
    btn.on('pointerdown', onClick);
    return btn;
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
