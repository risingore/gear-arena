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
import {
  isDebugEnabled,
  toggleDebug,
  isBossModeEnabled,
  toggleBossMode,
  isOneShotModeEnabled,
  toggleOneShotMode,
} from '../systems/debug';
import { setMusicMuted } from '../systems/music';
import { setSfxMuted } from '../systems/audio';
import { mountSettingsOverlay } from '../overlays/settingsOverlay';
import { createInitialRunState, setRunState } from '../systems/runState';
import type { GeneratedRound } from '../systems/enemyPool';

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
          label: t('Fullscreen'),
          value: document.fullscreenElement ? 'ON' : 'OFF',
          onCycle: () => {
            playSfx('click');
            const already = document.fullscreenElement !== null;
            if (already) {
              document.exitFullscreen().catch(() => {});
            } else {
              document.documentElement.requestFullscreen().catch(() => {});
            }
            // Button label is refreshed by the fullscreenchange listener
            // below, so whatever we return now will be overwritten on the
            // next frame. Return the intended new state for an instant
            // optimistic UI update.
            return already ? 'OFF' : 'ON';
          },
        },
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
          label: t('Background Audio'),
          value: initial.backgroundAudio ? 'ON' : 'OFF',
          onCycle: () => {
            const s = loadSettings();
            const next = !s.backgroundAudio;
            updateSetting('backgroundAudio', next);
            window.__APPLY_BG_AUDIO__?.(next);
            playSfx('click');
            return next ? 'ON' : 'OFF';
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
          label: t('Battle Speed'),
          value: `x${initial.defaultBattleSpeed}`,
          onCycle: () => {
            const s = loadSettings();
            const seq = [1, 1.5, 2];
            const idx = seq.indexOf(s.defaultBattleSpeed);
            const next = seq[(idx + 1) % seq.length]!;
            updateSetting('defaultBattleSpeed', next);
            playSfx('click');
            return `x${next}`;
          },
        },
      ],
      debugRows: [
        {
          label: t('Debug Mode'),
          value: isDebugEnabled() ? 'ON' : 'OFF',
          onCycle: () => {
            const on = toggleDebug();
            playSfx('click');
            return on ? 'ON' : 'OFF';
          },
        },
        {
          label: t('Boss Mode'),
          value: isBossModeEnabled() ? 'ON' : 'OFF',
          onCycle: () => {
            const on = toggleBossMode();
            playSfx('click');
            return on ? 'ON' : 'OFF';
          },
        },
        {
          label: t('One-Shot'),
          value: isOneShotModeEnabled() ? 'ON' : 'OFF',
          onCycle: () => {
            const on = toggleOneShotMode();
            playSfx('click');
            return on ? 'ON' : 'OFF';
          },
        },
        {
          label: t('Ending'),
          value: t('PLAY'),
          onCycle: () => {
            playSfx('click');
            // Jump directly to the victory + ending sequence. Sets up a
            // minimal victory run state so Result.renderVictory can run
            // without requiring a full completed playthrough.
            const fake = createInitialRunState();
            fake.robotKey = 'robot_knight';
            fake.battleOutcome = 'victory';
            fake.gold = 300;
            fake.lastDefeatedEnemyId = 'boss_leviathan';
            const finalRound: GeneratedRound = {
              index: 5,
              enemy: {
                name: 'Shuten Doji',
                hp: 1,
                damage: 1,
                cooldownSec: 1,
                damageReductionPct: 0,
                assetKey: 'boss_leviathan',
              },
              enemyId: 'boss_leviathan',
              goldReward: 0,
              isBoss: true,
              isSuperBoss: false,
            };
            fake.generatedRounds = [finalRound];
            setRunState(this, fake);
            fadeToScene(this, 'Result');
            return t('PLAY');
          },
        },
      ],
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

    // Keep the Fullscreen toggle label in sync when the user exits via
    // ESC / F key / browser chrome — document.fullscreenElement is the
    // source of truth.
    const refreshFullscreenLabel = (): void => {
      const btn = document.querySelector<HTMLElement>(
        '.soul-strike-settings-overlay [data-role="cycle"][data-idx="0"]',
      );
      if (btn) btn.textContent = document.fullscreenElement ? 'ON' : 'OFF';
    };
    document.addEventListener('fullscreenchange', refreshFullscreenLabel);

    this.events.once('shutdown', () => {
      this.unmountOverlay?.();
      this.unmountOverlay = null;
      document.removeEventListener('fullscreenchange', refreshFullscreenLabel);
    });
    this.events.once('destroy', () => {
      this.unmountOverlay?.();
      this.unmountOverlay = null;
      document.removeEventListener('fullscreenchange', refreshFullscreenLabel);
    });

    this.input.keyboard?.on('keydown-ESC', () => fadeToScene(this, 'Title'));
    this.input.keyboard?.on('keydown-R', () => fadeToScene(this, 'Title'));

    showDebugBadge(this, isDebugEnabled());
  }
}
