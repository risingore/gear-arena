import { Scene } from 'phaser';

import gameOptions from '../helper/gameOptions';
import { PALETTE } from '../systems/palette';
import { playSfx } from '../systems/audio';
import { fadeInCurrent, fadeToScene } from '../systems/transition';
import { t } from '../systems/i18n';
import { setLocale, getLocale, type Locale } from '../systems/i18n';
import { loadSettings, updateSetting } from '../systems/settings';
import { resetAllData } from '../systems/savedata';
import { showDebugBadge } from '../helper/hiDpiText';
import { isDebugEnabled, toggleDebug } from '../systems/debug';
import { setMusicMuted } from '../systems/music';
import { setSfxMuted } from '../systems/audio';
import { mountSettingsOverlay } from '../overlays/settingsOverlay';

export class Settings extends Scene {
  private unmountOverlay: (() => void) | null = null;

  constructor() {
    super('Settings');
  }

  create(): void {
    const { gameWidth, gameHeight } = gameOptions;
    this.cameras.main.setBackgroundColor(PALETTE.bg);
    fadeInCurrent(this);

    const volumeLabel = (v: number): string => {
      if (v <= 0) return 'OFF';
      return `${Math.round(v * 100)}%`;
    };
    const cycleVolume = (current: number): number => {
      const steps = [0, 0.25, 0.5, 0.75, 1.0];
      const idx = steps.findIndex((v) => Math.abs(v - current) < 0.05);
      return steps[(idx + 1) % steps.length]!;
    };

    const initial = loadSettings();

    this.unmountOverlay = mountSettingsOverlay({
      title: t('SETTINGS'),
      rows: [
        {
          label: t('BGM Volume'),
          value: volumeLabel(initial.bgmVolume),
          onCycle: () => {
            const s = loadSettings();
            const next = cycleVolume(s.bgmVolume);
            updateSetting('bgmVolume', next);
            setMusicMuted(next === 0);
            playSfx('click');
            return volumeLabel(next);
          },
        },
        {
          label: t('SFX Volume'),
          value: volumeLabel(initial.sfxVolume),
          onCycle: () => {
            const s = loadSettings();
            const next = cycleVolume(s.sfxVolume);
            updateSetting('sfxVolume', next);
            setSfxMuted(next === 0);
            playSfx('click');
            return volumeLabel(next);
          },
        },
        {
          label: t('Language'),
          value: getLocale().toUpperCase(),
          onCycle: () => {
            const next: Locale = getLocale() === 'en' ? 'ja' : 'en';
            setLocale(next);
            updateSetting('locale', next);
            playSfx('click');
            return next.toUpperCase();
          },
        },
        {
          label: t('Fullscreen'),
          value: initial.fullscreen ? 'ON' : 'OFF',
          onCycle: () => {
            const s = loadSettings();
            const next = !s.fullscreen;
            updateSetting('fullscreen', next);
            if (next) this.scale.startFullscreen();
            else this.scale.stopFullscreen();
            playSfx('click');
            return next ? 'ON' : 'OFF';
          },
        },
        {
          label: t('Battle Speed'),
          value: `x${initial.defaultBattleSpeed}`,
          onCycle: () => {
            const s = loadSettings();
            const seq = [1, 2, 4, 6];
            const idx = seq.indexOf(s.defaultBattleSpeed);
            const next = seq[(idx + 1) % seq.length]!;
            updateSetting('defaultBattleSpeed', next);
            playSfx('click');
            return `x${next}`;
          },
        },
      ],
      debugRow: {
        label: t('Debug Mode'),
        value: isDebugEnabled() ? 'ON' : 'OFF',
        onCycle: () => {
          const on = toggleDebug();
          playSfx('click');
          return on ? 'ON' : 'OFF';
        },
      },
      recommendedResolution: `${gameWidth} × ${gameHeight}`,
      resetLabel: t('RESET ALL DATA'),
      resetConfirmLabel: t('Click again to confirm'),
      onReset: () => {
        resetAllData();
        playSfx('lose');
        window.setTimeout(() => window.location.reload(), 800);
      },
      backLabel: t('BACK'),
      onBack: () => {
        playSfx('click');
        fadeToScene(this, 'Title');
      },
    });

    this.events.once('shutdown', () => {
      this.unmountOverlay?.();
      this.unmountOverlay = null;
    });
    this.events.once('destroy', () => {
      this.unmountOverlay?.();
      this.unmountOverlay = null;
    });

    this.input.keyboard?.on('keydown-ESC', () => fadeToScene(this, 'Title'));
    this.input.keyboard?.on('keydown-R', () => fadeToScene(this, 'Title'));

    showDebugBadge(this, isDebugEnabled());
  }
}
