import { Scene } from 'phaser';
import { getScreenshotMode } from '../systems/screenshotMode';
import { createInitialRunState, setRunState } from '../systems/runState';
import { mountPreloaderOverlay, type PreloaderOverlayHandle } from '../overlays/preloaderOverlay';
import { queueMusic, MUSIC_KEYS } from '../systems/music';
import { t } from '../systems/i18n';

/**
 * Preloader — asset boot with a Title-matching loading screen.
 *
 * Queues the battle/enemy/boss textures, robot blueprints and the Title
 * BGM (other tracks stream in per-scene — see systems/music.ts), then
 * transitions to Title. A DOM loading overlay (see
 * `overlays/preloaderOverlay.ts`) is shown for the duration, driven by the
 * Phaser loader's `progress` event; on a warm cache where loading finishes
 * in a frame it still dwells briefly (LOADING_DWELL_MS) so it cross-fades
 * cleanly into the Title overlay instead of flashing. Missing audio files
 * are swallowed (404 logged, key left unregistered) so the game keeps
 * running silently.
 */
const LOADING_DWELL_MS = 700;

export class Preloader extends Scene {
  private overlay: PreloaderOverlayHandle | null = null;
  private shownAt = 0;

  constructor() {
    super('Preloader');
  }

  preload(): void {
    // Loading screen — skipped in dev screenshot mode (no loader chrome
    // wanted in the captured embed art; that path also bails before Title).
    if (!getScreenshotMode()) {
      this.shownAt = performance.now();
      this.overlay = mountPreloaderOverlay({ label: t('LOADING') });
      this.load.on('progress', (value: number) => this.overlay?.setProgress(value));
    }

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
    // Optional ULT-motion sheet — Battle.playPlayerUltimateSpriteMotion
    // animates a `<battleAssetKey>_ult_sheet` texture when present (>1
    // frames), else uses the still cut-in below. INDRA's strip isn't drawn
    // yet, so there's no load line: loading a known-404 every boot just
    // spams the console. To enable, drop the strip in assets/sprites/ and
    // add a matching this.load.spritesheet() here.
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

    // --- BGM ---
    // Only the Title track ships in the boot payload; the rest (~16 MB)
    // stream in from each scene's preload() via queueMusic(). See
    // systems/music.ts for the track table and the per-scene wiring.
    queueMusic(this, MUSIC_KEYS.title);

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

    // Dev-only screenshot capture for itch.io embed background art —
    // seeds a YUKIME-Ω face-off and skips Title/Story/Select/Build.
    // Mode C also forces the synergy halo to its top tier (handled in
    // Battle.create). `previewOnly` keeps save data untouched.
    const mode = getScreenshotMode();
    if (mode) {
      const fake = createInitialRunState();
      fake.robotKey = 'robot_knight';
      fake.previewOnly = true;
      fake.currentRound = 1;
      fake.generatedRounds = [{
        index: 1,
        enemy: {
          name: 'YUKIME-Ω',
          hp: 9999,
          damage: 0,
          cooldownSec: 99,
          damageReductionPct: 0,
          assetKey: 'boss_yuki_onna',
        },
        enemyId: 'boss_yuki_onna',
        goldReward: 0,
        isBoss: true,
        isSuperBoss: false,
      }];
      setRunState(this, fake);
      this.scene.start('Battle');
      return;
    }

    // Snap the bar to full, then hold the loading screen until it has been
    // up for at least LOADING_DWELL_MS so a warm-cache boot doesn't flash.
    // unmount() fades the overlay out (240 ms) while the Title overlay
    // fades in — a clean cross-fade, same as every scene-to-scene handoff.
    this.overlay?.setProgress(1);
    const goToTitle = (): void => {
      this.overlay?.unmount();
      this.overlay = null;
      this.scene.start('Title');
    };
    const remaining = LOADING_DWELL_MS - (performance.now() - this.shownAt);
    if (remaining > 0) {
      this.time.delayedCall(remaining, goToTitle);
    } else {
      goToTitle();
    }
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
