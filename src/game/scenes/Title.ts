import { Scene } from 'phaser';

import { getRunState, resetRunState, setRunState, type EndingMode } from '../systems/runState';
import { PALETTE } from '../systems/palette';
import { playSfx } from '../systems/audio';
import { fadeInCurrent, fadeToScene } from '../systems/transition';
import { loadSaveData } from '../systems/savedata';
import { getPlayerTitle } from '../systems/achievements';
import { t } from '../systems/i18n';
import { playMusic, MUSIC_KEYS } from '../systems/music';
import { mountTitleOverlay } from '../overlays/titleOverlay';

/**
 * Title scene.
 *
 * The visible UI is rendered as an HTML overlay (see `overlays/titleOverlay.ts`)
 * to get browser-native text + SVG rendering, which far outclasses what
 * Phaser's Canvas renderer can produce for a dense, type-heavy title screen.
 * The Phaser scene itself only:
 *   - resets run state
 *   - starts Title BGM
 *   - owns the canvas fade-in / fade-out transitions between scenes
 *   - routes menu clicks and the SPACE key to the next Phaser scene
 */
export class Title extends Scene {
  private unmountOverlay: (() => void) | null = null;

  constructor() {
    super('Title');
  }

  create(): void {
    resetRunState(this);
    this.cameras.main.setBackgroundColor(PALETTE.bg);
    fadeInCurrent(this);
    playMusic(this, MUSIC_KEYS.title);

    const save = loadSaveData();
    const playerTitle = getPlayerTitle(save);

    const startRun = (mode: EndingMode): void => {
      playSfx('click');
      const state = getRunState(this);
      state.endingMode = mode;
      setRunState(this, state);
      fadeToScene(this, 'Select');
    };

    this.unmountOverlay = mountTitleOverlay({
      onPlayEasy: () => startRun('easy'),
      onPlayHard: () => startRun('hard'),
      hardLocked: !save.easyCleared,
      lockedHint: t('Clear Easy to unlock Hard'),
      onCollection: () => {
        playSfx('click');
        fadeToScene(this, 'Collection');
      },
      onSettings: () => {
        playSfx('click');
        fadeToScene(this, 'Settings');
      },
      onCredits: () => {
        playSfx('click');
        fadeToScene(this, 'Credits');
      },
      onSanctum: save.battlesCompleted > 0 ? () => {
        playSfx('click');
        fadeToScene(this, 'Sanctum');
      } : undefined,
      onStory: save.hardCleared ? () => {
        playSfx('click');
        fadeToScene(this, 'Story');
      } : undefined,
      saveData: {
        bestRound: save.bestRound,
        victories: save.totalClears,
        scrap: save.scrap,
        playerTitle: playerTitle || undefined,
      },
      easyLabel: t('EASY'),
      hardLabel: t('HARD'),
      collectionLabel: t('COLLECTION'),
      settingsLabel: t('SETTINGS'),
      creditsLabel: t('CREDITS'),
      sanctumLabel: t('SANCTUM'),
      storyLabel: t('STORY'),
    });

    this.events.once('shutdown', () => {
      this.unmountOverlay?.();
      this.unmountOverlay = null;
    });
    this.events.once('destroy', () => {
      this.unmountOverlay?.();
      this.unmountOverlay = null;
    });

    // SPACE always starts an Easy run — the locked-Hard path requires an
    // explicit click on the (also locked) HARD button to make the gating
    // discoverable. Once Easy is cleared, SPACE keeps defaulting to Easy
    // so the keyboard shortcut never silently changes meaning.
    this.input.keyboard?.once('keydown-SPACE', () => startRun('easy'));
  }
}
