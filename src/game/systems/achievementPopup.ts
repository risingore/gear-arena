/**
 * Achievement popup toast.
 *
 * Call `showAchievementPopup(scene, title)` right after save-data has been
 * updated. Slides in from top-right, holds for 2.8s, then slides out.
 * Uses Phaser text (not DOM overlay) so it can be spawned from any scene
 * without extra CSS setup.
 */
import type { Scene } from 'phaser';

const POPUP_WIDTH = 320;
const POPUP_HEIGHT = 58;
const POPUP_RIGHT_MARGIN = 16;
const POPUP_TOP_MARGIN = 58;
const HOLD_MS = 2800;

export function showAchievementPopup(
  scene: Scene,
  achievementName: string,
  description?: string,
): void {
  const targetX = scene.scale.width - POPUP_WIDTH / 2 - POPUP_RIGHT_MARGIN;
  const targetY = POPUP_TOP_MARGIN + POPUP_HEIGHT / 2;
  const offscreenX = scene.scale.width + POPUP_WIDTH;

  const bg = scene.add
    .rectangle(offscreenX, targetY, POPUP_WIDTH, POPUP_HEIGHT, 0x0e1020, 0.92)
    .setStrokeStyle(2, 0xffd94a, 1)
    .setDepth(9500);

  const title = scene.add
    .text(offscreenX - POPUP_WIDTH / 2 + 14, targetY - 14, 'ACHIEVEMENT', {
      fontFamily: '"Rajdhani", system-ui, sans-serif',
      fontSize: '10px',
      color: '#ffd94a',
      fontStyle: '600',
    })
    .setOrigin(0, 0.5)
    .setDepth(9501);

  const name = scene.add
    .text(offscreenX - POPUP_WIDTH / 2 + 14, targetY + 4, achievementName, {
      fontFamily: '"Bebas Neue", system-ui, sans-serif',
      fontSize: '18px',
      color: '#ffffff',
    })
    .setOrigin(0, 0.5)
    .setDepth(9501);

  const desc = description
    ? scene.add
        .text(offscreenX - POPUP_WIDTH / 2 + 14, targetY + 20, description, {
          fontFamily: '"Rajdhani", system-ui, sans-serif',
          fontSize: '11px',
          color: '#aeeaff',
        })
        .setOrigin(0, 0.5)
        .setDepth(9501)
    : null;

  const allParts = [bg, title, name];
  if (desc) allParts.push(desc);

  // Slide in
  scene.tweens.add({
    targets: allParts,
    x: (obj: Phaser.GameObjects.GameObject) => {
      if (obj === bg) return targetX;
      return targetX - POPUP_WIDTH / 2 + 14;
    },
    duration: 360,
    ease: 'Cubic.easeOut',
  });

  // Hold, slide out, destroy
  scene.time.delayedCall(HOLD_MS, () => {
    scene.tweens.add({
      targets: allParts,
      x: (obj: Phaser.GameObjects.GameObject) => {
        if (obj === bg) return offscreenX;
        return offscreenX - POPUP_WIDTH / 2 + 14;
      },
      alpha: 0,
      duration: 300,
      ease: 'Cubic.easeIn',
      onComplete: () => {
        bg.destroy();
        title.destroy();
        name.destroy();
        desc?.destroy();
      },
    });
  });
}
