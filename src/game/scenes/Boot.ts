import { Scene } from 'phaser';

/**
 * Boot — the very first scene.
 *
 * Responsibilities:
 * - Configure Phaser (scale mode quirks, input defaults, etc).
 * - Load only the handful of assets needed by the Preloader scene itself
 *   (so the loading screen can render the moment the game starts).
 *
 * Do NOT load the bulk of the game assets here. Those go in Preloader.
 */
export class Boot extends Scene {
  constructor() {
    super('Boot');
  }

  preload(): void {
    // Intentionally minimal. Add Preloader-required assets (logo, bar bg)
    // here if you introduce them.
  }

  create(): void {
    this.scene.start('Preloader');
  }
}
