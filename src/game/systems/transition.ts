/**
 * Scene transition helpers.
 *
 * `fadeToScene(scene, 'Build')` runs a 180 ms cross-fade and then starts the
 * target scene. Each scene's `create()` should call `fadeInCurrent(scene)` to
 * fade in on entry.
 */

import type { Scene } from 'phaser';

const FADE_MS = 180;

export const fadeInCurrent = (scene: Scene): void => {
  scene.cameras.main.fadeIn(FADE_MS, 0, 0, 0);
};

export const fadeToScene = (scene: Scene, nextKey: string): void => {
  scene.cameras.main.fadeOut(FADE_MS, 0, 0, 0);
  scene.cameras.main.once('camerafadeoutcomplete', () => {
    scene.scene.start(nextKey);
  });
};
