/**
 * BGM playback + crossfade controller.
 *
 * Design:
 *   - Only the Title track ships in the boot payload. Every other track
 *     streams in from the consuming scene's preload() via queueMusic() —
 *     ~16 MB of BGM would otherwise bloat the cold-start download. Tracks
 *     are OPTIONAL: a missing file (404) is skipped by the loader and the
 *     key stays unregistered, so playMusic() simply no-ops for it.
 *   - Only one track plays at a time per Phaser Game instance. Switching
 *     tracks cross-fades over a short duration.
 *   - Volume defaults sit well below 1.0 because SFX and BGM share the
 *     master audio output.
 *
 * Usage — queueMusic() from a preload() (the consuming scene's, or an
 * earlier one to spread the download; cached tracks are skipped), then
 * playMusic() from create():
 *   import { playMusic, queueMusic, MUSIC_KEYS } from '@/game/systems/music';
 *   // Select.preload + Build.preload queue MUSIC_KEYS.build / .battle ...
 *   create() { playMusic(this, MUSIC_KEYS.battle); }
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
 * Asset cache keys for every BGM track. `queueMusic()` (and, for the
 * Title track, Preloader) registers the matching files; a missing file
 * leaves the key unregistered and playMusic() no-ops for it.
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

/**
 * Source files per track (mp3 with ogg fallback). Canonical: Preloader
 * and every scene's preload() pull paths from here, never inline.
 */
const MUSIC_TRACKS: Record<MusicKey, readonly [string, string]> = {
  [MUSIC_KEYS.title]:       ['assets/audio/bgm_title.mp3',        'assets/audio/bgm_title.ogg'],
  [MUSIC_KEYS.build]:       ['assets/audio/bgm_build.mp3',        'assets/audio/bgm_build.ogg'],
  [MUSIC_KEYS.battle]:      ['assets/audio/bgm_battle.mp3',       'assets/audio/bgm_battle.ogg'],
  [MUSIC_KEYS.boss]:        ['assets/audio/bgm_bossbattle.mp3',   'assets/audio/bgm_bossbattle.ogg'],
  [MUSIC_KEYS.victory]:     ['assets/audio/bgm_victory.mp3',      'assets/audio/bgm_victory.ogg'],
  [MUSIC_KEYS.easyVictory]: ['assets/audio/bgm_easy_victory.mp3', 'assets/audio/bgm_easy_victory.ogg']
};

const hasAsset = (scene: Scene, key: string): boolean => {
  try {
    return scene.cache.audio?.has(key) === true;
  } catch {
    return false;
  }
};

/**
 * Queue the given BGM tracks on a scene's loader, skipping any already in
 * the audio cache. Call from a scene's preload() so the track is in place
 * before its create() calls playMusic(); the loader swallows missing
 * files (the key just stays unregistered). Re-entry is cheap — a track
 * loaded by an earlier scene is detected via the cache and skipped.
 */
export const queueMusic = (scene: Scene, ...keys: MusicKey[]): void => {
  for (const key of new Set(keys)) {
    if (hasAsset(scene, key)) continue;
    scene.load.audio(key, [...MUSIC_TRACKS[key]]);
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
