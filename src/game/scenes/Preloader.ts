import { Scene } from 'phaser';
import gameOptions from '../helper/gameOptions';

/**
 * Preloader — loads the bulk of the game's assets while showing a progress bar.
 */
export class Preloader extends Scene {
  constructor() {
    super('Preloader');
  }

  init(): void {
    const { gameWidth, gameHeight, colors, textStyles } = gameOptions;

    this.add
      .text(gameWidth / 2, gameHeight * 0.4, gameOptions.gameTitle, textStyles.title)
      .setOrigin(0.5);

    this.add
      .text(gameWidth / 2, gameHeight * 0.55, 'Loading...', textStyles.body)
      .setOrigin(0.5);

    // Progress bar geometry relative to game size (no magic numbers).
    const barWidth = gameWidth * 0.4;
    const barHeight = 12;
    const barX = gameWidth / 2 - barWidth / 2;
    const barY = gameHeight * 0.65;

    this.add
      .rectangle(barX, barY, barWidth, barHeight, colors.muted)
      .setOrigin(0, 0.5);

    const fill = this.add
      .rectangle(barX, barY, 0, barHeight, colors.accent)
      .setOrigin(0, 0.5);

    this.load.on('progress', (progress: number) => {
      fill.width = barWidth * progress;
    });
  }

  preload(): void {
    // BGM tracks are loaded optionally. If the file is not present yet, Phaser
    // logs a 404 and the key stays unregistered; systems/music.ts silently
    // skips missing keys so gameplay continues without BGM.
    //
    // Each key is given a [mp3, ogg] fallback list so the same code path
    // works with either format. MP3 is preferred because generative music
    // tools export MP3 directly and no transcoding step is needed.
    this.load.audio('bgm_title',   ['assets/audio/bgm_title.mp3',   'assets/audio/bgm_title.ogg']);
    this.load.audio('bgm_build',   ['assets/audio/bgm_build.mp3',   'assets/audio/bgm_build.ogg']);
    this.load.audio('bgm_battle',  ['assets/audio/bgm_battle.mp3',  'assets/audio/bgm_battle.ogg']);
    this.load.audio('bgm_victory', ['assets/audio/bgm_victory.mp3', 'assets/audio/bgm_victory.ogg']);

    // Swallow load errors so missing BGM files do not block scene transitions.
    this.load.on('loaderror', () => {
      // no-op: individual keys simply stay unregistered
    });
  }

  create(): void {
    this.scene.start('Title');
  }
}
