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

    // --- Mid-boss / big-boss battle sprites (transparent, INDRA-style) ---
    // Battle scene loads them by `assetKey` (matches enemies.ts entries).
    // Originals in assets/images/{m_enemy,l_enemy}/ are kept and re-loaded
    // below as `<assetKey>_ult` for the boss ULT cut-in (the "beautiful
    // photo" form, mirroring INDRA's battle / battle_ult split).
    this.load.image('midboss_bakeneko',  'assets/sprites/boss_bakeneko_battle.png');
    this.load.image('midboss_nopperabo', 'assets/sprites/boss_nopperabo_battle.png');
    this.load.image('midboss_karakasa',  'assets/sprites/boss_karakasa_battle.png');
    this.load.image('boss_yuki_onna',    'assets/sprites/boss_yuki_onna_battle.png');

    // --- Boss ULT cut-in art (full-color originals from m_enemy / l_enemy) ---
    this.load.image('midboss_bakeneko_ult',  'assets/images/m_enemy/neko.png');
    this.load.image('midboss_nopperabo_ult', 'assets/images/m_enemy/noppe.png');
    this.load.image('midboss_karakasa_ult',  'assets/images/m_enemy/kasa.png');
    this.load.image('boss_yuki_onna_ult',    'assets/images/l_enemy/yukionnna.png');

    // --- BGM tracks (mp3 with ogg fallback) ---
    this.load.audio('bgm_title',   ['assets/audio/bgm_title.mp3',   'assets/audio/bgm_title.ogg']);
    this.load.audio('bgm_build',   ['assets/audio/bgm_build.mp3',   'assets/audio/bgm_build.ogg']);
    this.load.audio('bgm_battle',  ['assets/audio/bgm_battle.mp3',  'assets/audio/bgm_battle.ogg']);
    this.load.audio('bgm_bossbattle', ['assets/audio/bgm_bossbattle.mp3', 'assets/audio/bgm_bossbattle.ogg']);
    this.load.audio('bgm_victory', ['assets/audio/bgm_victory.mp3', 'assets/audio/bgm_victory.ogg']);
    // Easy-mode victory BGM — shorter cliffhanger track for the 25.8s Easy ED
    // (Hard's bgm_victory is tuned for the 95s credits roll and would only
    // play its intro before the player returns to Title). Optional asset:
    // missing keys stay unregistered and Result.ts falls back gracefully.
    this.load.audio('bgm_easy_victory', ['assets/audio/bgm_easy_victory.mp3', 'assets/audio/bgm_easy_victory.ogg']);

    // Swallow individual load errors so missing audio files never block the
    // transition into Title.
    this.load.on('loaderror', () => {
      // no-op: missing keys stay unregistered
    });
  }

  create(): void {
    // Boss ULT cut-in originals are JPEG (no alpha channel) — they paint
    // a full background that reads as a hard rectangular border against
    // the dark cut-in overlay. Strip the dark background to alpha 0 so
    // the boss silhouette floats on the cut-in instead of sitting in a
    // visible JPEG box. Tuned for the current art set: backgrounds are
    // near-black (luminance < 30) while boss bodies have rim-lights /
    // accent colours bright enough to stay above the upper threshold.
    [
      'midboss_bakeneko_ult',
      'midboss_nopperabo_ult',
      'midboss_karakasa_ult',
      'boss_yuki_onna_ult',
    ].forEach((key) => keyOutDarkBackground(this, key));

    this.scene.start('Title');
  }
}

/** Replace `key`'s texture with a copy whose dark pixels are alpha 0
 *  (opaque to fully transparent across an 18-50 luminance ramp). The
 *  ramp width preserves rim-lit edges so the boss silhouette doesn't
 *  read as a hard cut-out. No-op when the texture isn't loaded.
 */
function keyOutDarkBackground(scene: Scene, key: string): void {
  if (!scene.textures.exists(key)) return;
  const tex = scene.textures.get(key);
  const src = tex.getSourceImage(0) as HTMLImageElement | HTMLCanvasElement;
  const w = src.width;
  const h = src.height;
  if (!w || !h) return;
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  ctx.drawImage(src as CanvasImageSource, 0, 0);
  let imgData: ImageData;
  try {
    imgData = ctx.getImageData(0, 0, w, h);
  } catch {
    // Cross-origin tainted canvas — bail and keep the JPEG as-is.
    return;
  }
  const data = imgData.data;
  const LOW = 18;
  const HIGH = 50;
  const SPAN = HIGH - LOW;
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i]!;
    const g = data[i + 1]!;
    const b = data[i + 2]!;
    const lum = 0.299 * r + 0.587 * g + 0.114 * b;
    if (lum <= LOW) {
      data[i + 3] = 0;
    } else if (lum < HIGH) {
      data[i + 3] = Math.round(255 * (lum - LOW) / SPAN);
    }
  }
  ctx.putImageData(imgData, 0, 0);
  scene.textures.remove(key);
  scene.textures.addCanvas(key, canvas);
}
