/**
 * Layout debug overlay — press L in debug mode to toggle.
 *
 * Shows bounding boxes, coordinates, and element names for all
 * visible text and rectangle objects in the current scene.
 * Click any element to log its position to the console.
 */

import type { Scene, GameObjects } from 'phaser';
import gameOptions from '../helper/gameOptions';
import { isDebugEnabled } from './debug';

let active = false;
let overlayObjects: GameObjects.GameObject[] = [];

export function setupLayoutDebug(scene: Scene): void {
  if (!isDebugEnabled()) return;

  scene.input.keyboard?.on('keydown-L', () => {
    active = !active;
    if (active) {
      showOverlay(scene);
    } else {
      clearOverlay();
    }
  });
}

function clearOverlay(): void {
  for (const obj of overlayObjects) obj.destroy();
  overlayObjects = [];
}

function showOverlay(scene: Scene): void {
  clearOverlay();
  const { textStyles } = gameOptions;
  const children = scene.children.list as GameObjects.GameObject[];

  for (const child of children) {
    const go = child as any;
    if (!go || typeof go.x !== 'number' || !go.visible) continue;

    if (go.type === 'Text') {
      const t = go as GameObjects.Text;
      const b = t.getBounds();
      // Bounding box
      const rect = scene.add
        .rectangle(b.x + b.width / 2, b.y + b.height / 2, b.width, b.height, 0x00ff00, 0)
        .setStrokeStyle(1, 0x00ff00)
        .setDepth(999);
      overlayObjects.push(rect);

      // Coordinate label
      const coordText = `${Math.round(t.x)},${Math.round(t.y)}`;
      const label = scene.add
        .text(b.x, b.y - 10, coordText, { ...textStyles.small, fontSize: '10px', color: '#00ff00' })
        .setDepth(1000);
      overlayObjects.push(label);

      // Click to log
      rect.setInteractive();
      rect.on('pointerdown', () => {
        const txt = (t.text || '').substring(0, 40);
        console.log(`[Layout] Text "${txt}" x=${Math.round(t.x)} y=${Math.round(t.y)} origin=(${t.originX},${t.originY}) depth=${t.depth}`);
      });
    } else if (go.type === 'Rectangle') {
      const r = go as GameObjects.Rectangle;
      const cx = r.x;
      const cy = r.y;
      const label = scene.add
        .text(cx, cy - r.displayHeight / 2 - 10,
          `${Math.round(cx)},${Math.round(cy)} ${Math.round(r.displayWidth)}x${Math.round(r.displayHeight)}`,
          { ...textStyles.small, fontSize: '10px', color: '#ffff00' })
        .setOrigin(0.5)
        .setDepth(1000);
      overlayObjects.push(label);
    }
  }

  console.log(`[Layout] ${overlayObjects.length / 2} elements displayed. Click to log coordinates. Press L to hide.`);
}
