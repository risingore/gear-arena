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
    // --- Robot battle sprites ---
    this.load.image('battle_indra',  'assets/images/battle_indra.png');
    // ULT-pose variant used by the SOUL STRIKE cut-in. Convention:
    // `<battleAssetKey>_ult` — cut-in code falls back to battle key if missing.
    this.load.image('battle_indra_ult', 'assets/images/battle_indra_ult.png');
    // this.load.image('battle_goliath', 'assets/images/battle_goliath.png');
    // this.load.image('battle_striker', 'assets/images/battle_striker.png');
    // this.load.image('battle_oracle',  'assets/images/battle_oracle.png');

    // --- Robot blueprints (Build scene background) ---
    this.load.image('blueprint_indra', 'assets/images/blueprint_indra.png');

    // --- BGM tracks (mp3 with ogg fallback) ---
    this.load.audio('bgm_title',   ['assets/audio/bgm_title.mp3',   'assets/audio/bgm_title.ogg']);
    this.load.audio('bgm_build',   ['assets/audio/bgm_build.mp3',   'assets/audio/bgm_build.ogg']);
    this.load.audio('bgm_battle',  ['assets/audio/bgm_battle.mp3',  'assets/audio/bgm_battle.ogg']);
    this.load.audio('bgm_bossbattle', ['assets/audio/bgm_bossbattle.mp3', 'assets/audio/bgm_bossbattle.ogg']);
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
