import { Scene } from 'phaser';

import { PALETTE } from '../systems/palette';
import { playSfx } from '../systems/audio';
import { fadeInCurrent, fadeToScene } from '../systems/transition';
import { t } from '../systems/i18n';
import { showDebugBadge } from '../helper/hiDpiText';
import { isDebugEnabled } from '../systems/debug';
import { mountCreditsOverlay } from '../overlays/creditsOverlay';

/**
 * Credits scene.
 *
 * Shown from the Title screen (and optionally at the end of the ED
 * sequence). Renders the canonical credits data via a DOM overlay
 * matching the Title / Settings / Collection visual language.
 */
export class Credits extends Scene {
  private unmountOverlay: (() => void) | null = null;

  constructor() {
    super('Credits');
  }

  create(): void {
    this.cameras.main.setBackgroundColor(PALETTE.bg);
    fadeInCurrent(this);

    this.unmountOverlay = mountCreditsOverlay({
      title: t('CREDITS'),
      licenseLine: t('Code: MIT  ·  Assets: CC BY-NC 4.0'),
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
    this.input.keyboard?.on('keydown-SPACE', () => fadeToScene(this, 'Title'));

    showDebugBadge(this, isDebugEnabled());
  }
}
