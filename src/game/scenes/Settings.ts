import { Scene } from 'phaser';

import gameOptions from '../helper/gameOptions';
import { PALETTE } from '../systems/palette';
import { playSfx } from '../systems/audio';
import { fadeInCurrent, fadeToScene } from '../systems/transition';
import { t } from '../systems/i18n';
import { setLocale, getLocale, type Locale } from '../systems/i18n';
import { loadSettings, updateSetting } from '../systems/settings';
import { resetAllData } from '../systems/savedata';
import { applyHiDpiToScene, showDebugBadge } from '../helper/hiDpiText';
import { isDebugEnabled, toggleDebug } from '../systems/debug';
import { setMusicMuted } from '../systems/music';
import { setSfxMuted } from '../systems/audio';

const ROW_H = 52;
const LABEL_X = 340;
const VALUE_X = 700;

export class Settings extends Scene {
  constructor() {
    super('Settings');
  }

  create(): void {
    const { gameWidth, gameHeight, textStyles } = gameOptions;
    this.cameras.main.setBackgroundColor(PALETTE.bg);
    fadeInCurrent(this);

    this.add
      .text(gameWidth / 2, 40, t('SETTINGS'), textStyles.title)
      .setOrigin(0.5);

    const settings = loadSettings();
    let y = 130;

    // --- BGM Volume ---
    this.drawRow(y, t('BGM Volume'), this.volumeLabel(settings.bgmVolume), () => {
      const s = loadSettings();
      const next = this.cycleVolume(s.bgmVolume);
      updateSetting('bgmVolume', next);
      setMusicMuted(next === 0);
      return this.volumeLabel(next);
    });
    y += ROW_H;

    // --- SFX Volume ---
    this.drawRow(y, t('SFX Volume'), this.volumeLabel(settings.sfxVolume), () => {
      const s = loadSettings();
      const next = this.cycleVolume(s.sfxVolume);
      updateSetting('sfxVolume', next);
      setSfxMuted(next === 0);
      return this.volumeLabel(next);
    });
    y += ROW_H;

    // --- Language ---
    this.drawRow(y, t('Language'), getLocale().toUpperCase(), () => {
      const next: Locale = getLocale() === 'en' ? 'ja' : 'en';
      setLocale(next);
      updateSetting('locale', next);
      return next.toUpperCase();
    });
    y += ROW_H;

    // --- Fullscreen ---
    this.drawRow(y, t('Fullscreen'), settings.fullscreen ? 'ON' : 'OFF', () => {
      const s = loadSettings();
      const next = !s.fullscreen;
      updateSetting('fullscreen', next);
      if (next) {
        this.scale.startFullscreen();
      } else {
        this.scale.stopFullscreen();
      }
      return next ? 'ON' : 'OFF';
    });
    y += ROW_H;

    // --- Default Battle Speed ---
    this.drawRow(y, t('Battle Speed'), `x${settings.defaultBattleSpeed}`, () => {
      const s = loadSettings();
      const seq = [1, 2, 4, 6];
      const idx = seq.indexOf(s.defaultBattleSpeed);
      const next = seq[(idx + 1) % seq.length]!;
      updateSetting('defaultBattleSpeed', next);
      return `x${next}`;
    });
    y += ROW_H;

    // --- Recommended resolution (read-only info) ---
    this.add
      .text(LABEL_X, y, t('Recommended'), textStyles.body)
      .setOrigin(0, 0.5);
    this.add
      .text(VALUE_X, y, `${gameWidth} × ${gameHeight}`, textStyles.body)
      .setOrigin(0.5)
      .setAlpha(0.7);
    y += ROW_H;

    // --- Separator ---
    y += 10;
    this.add
      .rectangle(gameWidth / 2, y, 500, 2, PALETTE.cardStroke, 0.5)
      .setOrigin(0.5);
    y += 20;

    // --- Debug Mode ---
    this.drawRow(y, t('Debug Mode'), isDebugEnabled() ? 'ON' : 'OFF', () => {
      const on = toggleDebug();
      return on ? 'ON' : 'OFF';
    });
    y += ROW_H;

    // --- Separator ---
    y += 10;
    this.add
      .rectangle(gameWidth / 2, y, 500, 2, PALETTE.danger, 0.5)
      .setOrigin(0.5);
    y += 24;

    // --- Reset All Data ---
    const resetLabel = this.add
      .text(gameWidth / 2, y, t('RESET ALL DATA'), textStyles.body)
      .setOrigin(0.5)
      .setColor('#ff4444')
      .setInteractive({ useHandCursor: true });
    resetLabel.on('pointerover', () => resetLabel.setScale(1.05));
    resetLabel.on('pointerout', () => resetLabel.setScale(1));

    let confirmPending = false;
    resetLabel.on('pointerdown', () => {
      if (!confirmPending) {
        confirmPending = true;
        resetLabel.setText(t('Click again to confirm'));
        resetLabel.setColor('#ff8800');
        playSfx('click');
        // Auto-cancel after 3 seconds.
        this.time.delayedCall(3000, () => {
          confirmPending = false;
          resetLabel.setText(t('RESET ALL DATA'));
          resetLabel.setColor('#ff4444');
        });
      } else {
        resetAllData();
        playSfx('lose');
        resetLabel.setText(t('Data reset. Reloading...'));
        resetLabel.setColor('#ffffff');
        this.time.delayedCall(1000, () => {
          window.location.reload();
        });
      }
    });

    // --- Back to Title ---
    const backBtn = this.add
      .text(80, gameHeight - 28, t('← BACK'), textStyles.body)
      .setOrigin(0.5)
      .setAlpha(0.7)
      .setInteractive({ useHandCursor: true });
    backBtn.on('pointerdown', () => { playSfx('click'); fadeToScene(this, 'Title'); });
    backBtn.on('pointerover', () => { backBtn.setAlpha(1); backBtn.setScale(1.05); });
    backBtn.on('pointerout', () => { backBtn.setAlpha(0.7); backBtn.setScale(1); });

    this.input.keyboard?.on('keydown-ESC', () => fadeToScene(this, 'Title'));
    this.input.keyboard?.on('keydown-R', () => fadeToScene(this, 'Title'));

    applyHiDpiToScene(this);
    showDebugBadge(this, isDebugEnabled());
  }

  private drawRow(
    y: number,
    label: string,
    initialValue: string,
    onCycle: () => string
  ): void {
    const { textStyles } = gameOptions;
    this.add
      .text(LABEL_X, y, label, textStyles.body)
      .setOrigin(0, 0.5);

    const valueBg = this.add
      .rectangle(VALUE_X, y, 160, 36, PALETTE.buttonBg, 1)
      .setStrokeStyle(2, PALETTE.cardStroke)
      .setInteractive({ useHandCursor: true });

    const valueText = this.add
      .text(VALUE_X, y, initialValue, textStyles.body)
      .setOrigin(0.5);

    valueBg.on('pointerdown', () => {
      const next = onCycle();
      valueText.setText(next);
      playSfx('click');
    });
    valueBg.on('pointerover', () => valueBg.setFillStyle(PALETTE.buttonBgHover, 1));
    valueBg.on('pointerout', () => valueBg.setFillStyle(PALETTE.buttonBg, 1));
  }

  private cycleVolume(current: number): number {
    const steps = [0, 0.25, 0.5, 0.75, 1.0];
    const idx = steps.findIndex((v) => Math.abs(v - current) < 0.05);
    return steps[(idx + 1) % steps.length]!;
  }

  private volumeLabel(v: number): string {
    if (v <= 0) return 'OFF';
    return `${Math.round(v * 100)}%`;
  }
}
