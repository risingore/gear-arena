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
    // INDRA: idle sheet — 1024×1024 single-frame square portrait (the
    // Battle scene shows frame 0). The sheet API is kept (vs raw image)
    // so we can drop in a multi-frame strip later without touching
    // call sites in Battle.ts.
    const INDRA_IDLE_FRAME_W = 1024;
    const INDRA_IDLE_FRAME_H = 1024;
    this.load.spritesheet('battle_indra', 'assets/sprites/indra_battle_idle.png', {
      frameWidth: INDRA_IDLE_FRAME_W,
      frameHeight: INDRA_IDLE_FRAME_H,
    });
    // Optional ULT-motion sheet — Key = `<battleAssetKey>_ult_sheet`
    // (see Battle.playPlayerUltimateSpriteMotion). When the file is
    // missing the loader's swallowed loaderror leaves the key
    // unregistered and the cut-in code falls back to the still cut-in
    // image below. Frame dims match the existing wide ult artwork.
    const INDRA_ULT_FRAME_W = 1360;
    const INDRA_ULT_FRAME_H = 768;
    this.load.spritesheet('battle_indra_ult_sheet', 'assets/sprites/indra_battle_ultimate.png', {
      frameWidth: INDRA_ULT_FRAME_W,
      frameHeight: INDRA_ULT_FRAME_H,
    });
    // ULT-pose variant used by the SOUL STRIKE cut-in. Convention:
    // `<battleAssetKey>_ult` — cut-in code falls back to battle key if missing.
    this.load.image('battle_indra_ult', 'assets/images/battle_indra_ult.png');

    // --- Robot blueprints (Build scene background) ---
    this.load.image('blueprint_indra', 'assets/images/blueprint_indra.png');

    // --- Normal enemy sprites (Ep0 jam scope, mob12 intentionally absent) ---
    [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 13, 14].forEach((n) => {
      this.load.image(`enemy_mob${n}`, `assets/sprites/enemy_mob${n}.png`);
    });

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
