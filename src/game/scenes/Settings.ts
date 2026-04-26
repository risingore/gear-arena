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
      // Debug rows are stripped from production builds (Vite sets
       // import.meta.env.DEV to false during `bun run build`). The RESET
       // ALL DATA button below stays in both dev and prod. Restore by
       // reverting this guard if you need debug commands in the zip.
      debugRows: import.meta.env.DEV ? [
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
          label: t('Ending (Easy)'),
          value: t('PLAY'),
          onCycle: () => {
            playSfx('click');
            this.jumpToEnding('easy');
            return t('PLAY');
          },
        },
        {
          label: t('Ending (Hard)'),
          value: t('PLAY'),
          onCycle: () => {
            playSfx('click');
            this.jumpToEnding('hard');
            return t('PLAY');
          },
        },
        {
          label: t('Cut-in: INDRA'),
          value: t('PLAY'),
          onCycle: () => {
            playSfx('click');
            this.jumpToCutInPreview('player');
            return t('PLAY');
          },
        },
        {
          label: t('Cut-in: NEKOMATA-Ψ'),
          value: t('PLAY'),
          onCycle: () => {
            playSfx('click');
            this.jumpToCutInPreview('enemy', 'midboss_bakeneko');
            return t('PLAY');
          },
        },
        {
          label: t('Cut-in: MUJINA-Σ'),
          value: t('PLAY'),
          onCycle: () => {
            playSfx('click');
            this.jumpToCutInPreview('enemy', 'midboss_nopperabo');
            return t('PLAY');
          },
        },
        {
          label: t('Cut-in: TSUKUMO-Δ'),
          value: t('PLAY'),
          onCycle: () => {
            playSfx('click');
            this.jumpToCutInPreview('enemy', 'midboss_karakasa');
            return t('PLAY');
          },
        },
        {
          label: t('Cut-in: YUKIME-Ω'),
          value: t('PLAY'),
          onCycle: () => {
            playSfx('click');
            this.jumpToCutInPreview('enemy', 'boss_yuki_onna');
            return t('PLAY');
          },
        },
      ] : [],
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

  /**
   * Jump directly to the victory + ending sequence with a minimal fake
   * run state, so the chosen ending flavor (`easy` / `hard`) plays end
   * to end without requiring a full completed playthrough.
   */
  private jumpToEnding(mode: 'easy' | 'hard'): void {
    const fake = createInitialRunState();
    fake.robotKey = 'robot_knight';
    fake.battleOutcome = 'victory';
    fake.gold = 300;
    fake.lastDefeatedEnemyId = 'boss_yuki_onna';
    fake.endingMode = mode;
    // Preview mode — Result must not write any save mutations, otherwise
    // pressing this debug button would unlock HARD (or pump scrap, or
    // mark enemies as defeated) without an actual playthrough.
    fake.previewOnly = true;
    const finalRound: GeneratedRound = {
      index: 5,
      enemy: {
        name: 'Yuki Onna',
        hp: 1,
        damage: 1,
        cooldownSec: 1,
        damageReductionPct: 0,
        assetKey: 'boss_yuki_onna',
      },
      enemyId: 'boss_yuki_onna',
      goldReward: 0,
      isBoss: true,
      isSuperBoss: false,
    };
    fake.generatedRounds = [finalRound];
    setRunState(this, fake);
    fadeToScene(this, 'Result');
  }

  /**
   * Jump directly to Battle in cut-in preview mode. Battle freezes its
   * combat tick and only plays the requested ULT cut-in before returning
   * to Settings, so we can review every cut-in without playing through.
   *
   * For enemy cut-ins, the player still spawns as INDRA at round 1 — the
   * boss is forced into the round so its portrait + ULT name resolve
   * correctly. previewOnly = true blocks all save mutations.
   */
  private jumpToCutInPreview(kind: 'player' | 'enemy', enemyId?: string): void {
    const fake = createInitialRunState();
    fake.robotKey = 'robot_knight';
    fake.previewOnly = true;
    fake.previewCutIn = { kind, enemyId };
    // Battle.create() bails to Title when generatedRounds[0] is missing,
    // so we ALWAYS provide a fake round even for player previews. The
    // round's enemy is just a dummy that never actually fights — high HP
    // + huge cooldown keeps combat frozen while the preview-cut-in path
    // fires the requested ULT once and then fades back to Settings.
    const fakeId = (kind === 'enemy' && enemyId) ? enemyId : 'enemy_mob1';
    const round: GeneratedRound = {
      index: 1,
      enemy: {
        name: fakeId,
        hp: 9999,
        damage: 0,
        cooldownSec: 99,
        damageReductionPct: 0,
        assetKey: fakeId,
      },
      enemyId: fakeId,
      goldReward: 0,
      isBoss: kind === 'enemy',
      isSuperBoss: false,
    };
    fake.generatedRounds = [round];
    setRunState(this, fake);
    fadeToScene(this, 'Battle');
  }
}
