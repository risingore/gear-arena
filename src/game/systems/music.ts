/**
 * BGM playback + crossfade controller.
 *
 * Design:
 *   - BGM assets are loaded in the Preloader scene but registered as
 *     OPTIONAL: if the file is missing (404), Phaser's loader skips it
 *     gracefully and the scene still boots. The build keeps running
 *     when individual tracks are unavailable.
 *   - Only one track plays at a time per Phaser Game instance. Switching
 *     tracks cross-fades over a short duration.
 *   - Volume defaults sit well below 1.0 because SFX and BGM share the
 *     master audio output.
 *
 * Usage:
 *   import { playMusic, stopMusic } from '@/game/systems/music';
 *   playMusic(this, 'bgm_battle');
 */

import type { Scene } from 'phaser';

const DEFAULT_VOLUME = 0.35;
const CROSSFADE_MS = 600;

type TweenableSound = Phaser.Sound.BaseSound & { volume: number; rate: number };

let currentKey: string | null = null;
let currentSound: TweenableSound | null = null;
let muted = false;
/**
 * Sounds whose fade-out is in progress. Tracked in a module-level set
 * so the next `playMusic()` call can force-stop them — a rapid scene
 * transition (e.g. SPACE-spamming through Result → Build → Battle)
 * shuts down the tween manager that owns the fade-out before its
 * `onComplete` fires, leaving the old track playing forever and
 * overlapping with the new BGM.
 */
const fadingSounds = new Set<TweenableSound>();

/**
 * Keys registered here MUST match the asset keys loaded in Preloader.preload().
 * If the corresponding file is not present on disk, Phaser logs a load error
 * and the key stays unregistered — playMusic() then no-ops for that key.
 */
export const MUSIC_KEYS = {
  title: 'bgm_title',
  build: 'bgm_build',
  battle: 'bgm_battle',
  boss: 'bgm_bossbattle',
  victory: 'bgm_victory',
  easyVictory: 'bgm_easy_victory'
} as const;

export type MusicKey = (typeof MUSIC_KEYS)[keyof typeof MUSIC_KEYS];

const hasAsset = (scene: Scene, key: string): boolean => {
  try {
    return scene.cache.audio?.has(key) === true;
  } catch {
    return false;
  }
};

export const playMusic = (scene: Scene, key: MusicKey, loop = true): void => {
  if (!hasAsset(scene, key)) {
    // Asset not loaded yet (file missing or still in generation). Skip silently.
    return;
  }
  if (currentKey === key && currentSound && currentSound.isPlaying) return;

  // Force-stop any sound whose previous fade-out tween may have been
  // killed mid-flight when its owning scene shut down. Without this,
  // SPACE-spamming through scene transitions leaks the old BGM, since
  // `onComplete: prev.stop()` never fires when the scene that scheduled
  // the tween is gone.
  for (const s of fadingSounds) {
    try { s.stop(); s.destroy(); } catch { /* ignore */ }
  }
  fadingSounds.clear();

  const next = scene.sound.add(key, { loop, volume: 0 }) as TweenableSound;
  try {
    next.play();
  } catch {
    return;
  }

  // Snap to 0 while muted so unmute-via-setMusicMuted can raise it later.
  const targetVolume = muted ? 0 : DEFAULT_VOLUME;
  scene.tweens.killTweensOf(next);
  scene.tweens.add({
    targets: next,
    volume: targetVolume,
    duration: CROSSFADE_MS,
    ease: 'Linear'
  });

  const prev = currentSound;
  if (prev) {
    fadingSounds.add(prev);
    scene.tweens.killTweensOf(prev);
    scene.tweens.add({
      targets: prev,
      volume: 0,
      duration: CROSSFADE_MS,
      ease: 'Linear',
      onComplete: () => {
        try {
          prev.stop();
          prev.destroy();
        } catch {
          // ignore
        }
        fadingSounds.delete(prev);
      }
    });
  }

  currentKey = key;
  currentSound = next;
};

export const stopMusic = (): void => {
  if (currentSound) {
    try {
      currentSound.stop();
      currentSound.destroy();
    } catch {
      // ignore
    }
  }
  currentSound = null;
  currentKey = null;
};

export const setMusicMuted = (flag: boolean): void => {
  muted = flag;
  if (currentSound) {
    currentSound.volume = flag ? 0 : DEFAULT_VOLUME;
  }
};

export const setMusicPlaybackRate = (rate: number): void => {
  if (!currentSound) return;
  try {
    currentSound.rate = rate;
  } catch {
    // ignore — not all backends support rate
  }
};
