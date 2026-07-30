import { Scene } from 'phaser';

import { PALETTE } from '../systems/palette';
import { playSfx } from '../systems/audio';
import { fadeInCurrent, fadeToScene } from '../systems/transition';
import { t } from '../systems/i18n';
import { showDebugBadge } from '../helper/hiDpiText';
import { isDebugEnabled } from '../systems/debug';
import { mountStoryOverlay } from '../overlays/storyOverlay';

/** Title-screen archive of the joined Easy + Hard epilogue, gated by `hardCleared`. */
export class Story extends Scene {
  private unmountOverlay: (() => void) | null = null;

  constructor() {
    super('Story');
  }

  create(): void {
    this.cameras.main.setBackgroundColor(PALETTE.bg);
    fadeInCurrent(this);

    const goBack = (): void => {
      playSfx('click');
      fadeToScene(this, 'Title');
    };

    this.unmountOverlay = mountStoryOverlay({
      title: t('STORY'),
      easyHeading: t('I — THE FALLING'),
      hardHeading: t('II — THE FIRST FIST'),
      backLabel: t('BACK'),
      onBack: goBack,
    });

    const cleanup = (): void => {
      this.unmountOverlay?.();
      this.unmountOverlay = null;
    };
    this.events.once('shutdown', cleanup);
    this.events.once('destroy', cleanup);

    this.input.keyboard?.on('keydown-ESC', goBack);
    this.input.keyboard?.on('keydown-R', goBack);

    showDebugBadge(this, isDebugEnabled());
  }
}
