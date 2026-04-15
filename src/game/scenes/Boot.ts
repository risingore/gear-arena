import { Scene } from 'phaser';

/**
 * Boot — the very first scene.
 *
 * GEAR ARENA boots straight into the Title scene without any loading
 * screen. Audio assets are streamed in lazily on the title screen so the
 * player can interact with the game from the very first frame.
 */
export class Boot extends Scene {
  constructor() {
    super('Boot');
  }

  preload(): void {
    // Intentionally empty. No assets are loaded here.
  }

  create(): void {
    this.scene.start('Title');
  }
}
