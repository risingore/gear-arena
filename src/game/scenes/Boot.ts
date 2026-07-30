import { Scene } from 'phaser';

/**
 * Boot — the very first scene.
 *
 * Configures Phaser and hands off to Preloader. Preloader queues the
 * optional BGM tracks and immediately transitions to Title, so even with
 * no audio files present the player reaches the title screen within a
 * single frame.
 */
export class Boot extends Scene {
  constructor() {
    super('Boot');
  }

  preload(): void {
    // Intentionally empty. No assets are loaded here.
  }

  create(): void {
    this.scene.start('Preloader');
  }
}
