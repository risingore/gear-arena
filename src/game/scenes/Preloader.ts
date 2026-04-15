import { Scene } from 'phaser';

/**
 * Preloader — short-circuit asset boot.
 *
 * Loads optional BGM tracks and immediately transitions to Title. If a file
 * is missing the loader logs a 404 and the corresponding key stays
 * unregistered; systems/music.ts silently skips missing keys, so the game
 * keeps running without audio. The whole scene is invisible — there is no
 * progress bar — because in the BGM-less state it completes within a frame.
 */
export class Preloader extends Scene {
  constructor() {
    super('Preloader');
  }

  preload(): void {
    // Each key has an [mp3, ogg] fallback list so generative tools that
    // export only MP3 work without any transcoding step.
    this.load.audio('bgm_title',   ['assets/audio/bgm_title.mp3',   'assets/audio/bgm_title.ogg']);
    this.load.audio('bgm_build',   ['assets/audio/bgm_build.mp3',   'assets/audio/bgm_build.ogg']);
    this.load.audio('bgm_battle',  ['assets/audio/bgm_battle.mp3',  'assets/audio/bgm_battle.ogg']);
    this.load.audio('bgm_victory', ['assets/audio/bgm_victory.mp3', 'assets/audio/bgm_victory.ogg']);

    // Swallow individual load errors so missing audio files never block the
    // transition into Title.
    this.load.on('loaderror', () => {
      // no-op: missing keys stay unregistered
    });
  }

  create(): void {
    this.scene.start('Title');
  }
}
