import { Scene } from 'phaser';

import gameOptions from '../helper/gameOptions';
import { createButton, createPanel, createDivider } from '../helper/uiFactory';
import { PALETTE } from '../systems/palette';
import { playSfx } from '../systems/audio';
import { fadeInCurrent, fadeToScene } from '../systems/transition';
import { t } from '../systems/i18n';
import { setLocale, getLocale, type Locale } from '../systems/i18n';
import { loadSettings, updateSetting } from '../systems/settings';
import { resetAllData } from '../systems/savedata';
import { applyHiDpiToScene, showDebugBadge } from '../helper/hiDpiText';
import { runVisualChecks } from '../systems/visualDebugger';
import { setupLayoutDebug } from '../systems/layoutDebug';
import { isDebugEnabled, toggleDebug } from '../systems/debug';
import { setMusicMuted } from '../systems/music';
import { setSfxMuted } from '../systems/audio';

const ROW_H = 48;
const DIVIDER_MARGIN = 36;
const LABEL_X = 370;
const VALUE_X = 700;

export class Settings extends Scene {
  constructor() {
    super('Settings');
  }

  create(): void {
    const { gameWidth, gameHeight, textStyles } = gameOptions;
    this.cameras.main.setBackgroundColor(PALETTE.bg);
    fadeInCurrent(this);

    // Page background panel
    createPanel(this, gameWidth / 2, gameHeight / 2 + 30, 600, gameHeight - 140, { fillAlpha: 0.4, depth: 0 });

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

    // --- Separator (margin symmetric: DIVIDER_MARGIN above = DIVIDER_MARGIN below) ---
    y += DIVIDER_MARGIN;
    createDivider(this, gameWidth / 2, y, 520);
    y += DIVIDER_MARGIN;

    // --- Debug Mode ---
    this.drawRow(y, t('Debug Mode'), isDebugEnabled() ? 'ON' : 'OFF', () => {
      const on = toggleDebug();
      return on ? 'ON' : 'OFF';
    });

    // --- Separator ---
    y += DIVIDER_MARGIN;
    createDivider(this, gameWidth / 2, y, 520);
    y += DIVIDER_MARGIN;

    // --- Reset All Data ---
    let confirmPending = false;
    const resetBtn = createButton(this, gameWidth / 2, y, 280, 44, t('RESET ALL DATA'), () => {
      if (!confirmPending) {
        confirmPending = true;
        resetBtn.text.setText(t('Click again to confirm'));
        resetBtn.text.setColor('#ff8800');
        playSfx('click');
        this.time.delayedCall(3000, () => {
          confirmPending = false;
          resetBtn.text.setText(t('RESET ALL DATA'));
          resetBtn.text.setColor('#ff4444');
        });
      } else {
        resetAllData();
        playSfx('lose');
        resetBtn.text.setText(t('Data reset. Reloading...'));
        resetBtn.text.setColor('#ffffff');
        this.time.delayedCall(1000, () => {
          window.location.reload();
        });
      }
    }, { variant: 'danger' });

    // --- Back to Title ---
    createButton(this, 80, gameHeight - 28, 120, 36, t('BACK'), () => {
      playSfx('click'); fadeToScene(this, 'Title');
    });

    this.input.keyboard?.on('keydown-ESC', () => fadeToScene(this, 'Title'));
    this.input.keyboard?.on('keydown-R', () => fadeToScene(this, 'Title'));

    applyHiDpiToScene(this);
    showDebugBadge(this, isDebugEnabled());
    runVisualChecks(this);
    setupLayoutDebug(this);
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

    const btn = createButton(this, VALUE_X, y, 160, 36, initialValue, () => {
      const next = onCycle();
      btn.text.setText(next);
      playSfx('click');
    });
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
