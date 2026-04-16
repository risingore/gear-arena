/**
 * BGM playback + crossfade controller.
 *
 * Design:
 *   - BGM assets are loaded in the Preloader scene but registered as OPTIONAL:
 *     if the file is missing (404), Phaser's loader skips it gracefully and
 *     the scene still boots. This keeps the Jam build alive while Heika is
 *     still generating tracks via Suno.
 *   - Only one track plays at a time per Phaser Game instance. Switching
 *     tracks cross-fades over a short duration.
 *   - Volume is controllable (future mute toggle), defaults sit well below
 *     1.0 because SFX and BGM share the master audio output.
 *
 * Usage:
 *   import { playMusic, stopMusic } from '@/game/systems/music';
 *   playMusic(this, 'bgm_battle');
 */

import type { Scene } from 'phaser';

const DEFAULT_VOLUME = 0.35;
const CROSSFADE_MS = 600;

let currentKey: string | null = null;
let currentSound: Phaser.Sound.BaseSound | null = null;
let muted = false;

/**
 * Keys registered here MUST match the asset keys loaded in Preloader.preload().
 * If the corresponding file is not present on disk, Phaser logs a load error
 * and the key stays unregistered — playMusic() then no-ops for that key.
 */
export const MUSIC_KEYS = {
  title: 'bgm_title',
  build: 'bgm_build',
  battle: 'bgm_battle',
  victory: 'bgm_victory'
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
  if (muted) return;
  if (!hasAsset(scene, key)) {
    // Asset not loaded yet (file missing or still in generation). Skip silently.
    return;
  }
  if (currentKey === key && currentSound && currentSound.isPlaying) return;

  const next = scene.sound.add(key, { loop, volume: 0 });
  try {
    next.play();
  } catch {
    return;
  }

  const nextAsWithVolume = next as unknown as { volume: number };
  scene.tweens.add({
    targets: nextAsWithVolume,
    volume: DEFAULT_VOLUME,
    duration: CROSSFADE_MS,
    ease: 'Linear'
  });

  const prev = currentSound;
  if (prev) {
    const prevAsWithVolume = prev as unknown as { volume: number };
    scene.tweens.add({
      targets: prevAsWithVolume,
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
  if (flag) stopMusic();
};

/** Adjust the playback rate of the current BGM track (1.0 = normal). */
export const setMusicPlaybackRate = (rate: number): void => {
  if (!currentSound) return;
  try {
    (currentSound as unknown as { rate: number }).rate = rate;
  } catch {
    // ignore — not all backends support rate
  }
};
