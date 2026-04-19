import { Scene } from 'phaser';

import { resetRunState } from '../systems/runState';
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

    this.unmountOverlay = mountTitleOverlay({
      onPlay: () => {
        playSfx('click');
        fadeToScene(this, 'Select');
      },
      onCollection: () => {
        playSfx('click');
        fadeToScene(this, 'Collection');
      },
      onSettings: () => {
        playSfx('click');
        fadeToScene(this, 'Settings');
      },
      saveData: {
        bestRound: save.bestRound,
        victories: save.totalClears,
        scrap: save.scrap,
        playerTitle: playerTitle || undefined,
      },
      primaryLabel: t('PLAY'),
      collectionLabel: t('COLLECTION'),
      settingsLabel: t('SETTINGS'),
    });

    this.events.once('shutdown', () => {
      this.unmountOverlay?.();
      this.unmountOverlay = null;
    });
    this.events.once('destroy', () => {
      this.unmountOverlay?.();
      this.unmountOverlay = null;
    });

    this.input.keyboard?.once('keydown-SPACE', () => {
      playSfx('click');
      fadeToScene(this, 'Select');
    });
  }
}
