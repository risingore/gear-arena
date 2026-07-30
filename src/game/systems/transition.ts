/**
 * Scene transition helpers.
 *
 * `fadeToScene(scene, 'Build')` triggers a 180 ms fade-out followed by a
 * deterministic scene start. Each scene's `create()` should call
 * `fadeInCurrent(scene)` to fade in on entry.
 *
 * Implementation note: we drive the actual scene swap from a delayedCall
 * instead of listening for `camerafadeoutcomplete`, because in Phaser 4 the
 * camera-event listener has occasionally failed to fire — leaving the
 * player stuck on the previous scene with no way to advance. A delayedCall
 * is bulletproof: it fires regardless of camera-event quirks.
 */

import type { Scene } from 'phaser';

const FADE_MS = 180;
/** Tiny extra slack so the fade visibly completes before the swap. */
const SWAP_DELAY_MS = FADE_MS + 30;

export const fadeInCurrent = (scene: Scene): void => {
  scene.cameras.main.fadeIn(FADE_MS, 0, 0, 0);
};

export const fadeToScene = (scene: Scene, nextKey: string): void => {
  scene.cameras.main.fadeOut(FADE_MS, 0, 0, 0);
  scene.time.delayedCall(SWAP_DELAY_MS, () => {
    scene.scene.start(nextKey);
  });
};
