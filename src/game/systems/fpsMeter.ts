/**
 * Lightweight FPS meter overlay.
 *
 * Shows a small live FPS counter in the top-right corner when debug mode
 * is on. Zero dependencies, sampled over 1s rolling window for stability.
 * Attach once from a scene by calling `attachFpsMeter(scene)`.
 */
import type { Scene } from 'phaser';
import { isDebugEnabled } from './debug';

const ROLLING_WINDOW_MS = 1000;

export function attachFpsMeter(scene: Scene): void {
  if (!isDebugEnabled()) return;

  const frameTimestamps: number[] = [];
  const label = scene.add
    .text(1270, 10, '-- FPS', {
      fontFamily: '"Rajdhani", system-ui, sans-serif',
      fontSize: '12px',
      color: '#3aff7a',
      fontStyle: '500',
    })
    .setOrigin(1, 0)
    .setDepth(10000)
    .setAlpha(0.75);

  const onUpdate = (): void => {
    if (!label.active) return;
    const now = performance.now();
    frameTimestamps.push(now);
    while (frameTimestamps.length > 0 && frameTimestamps[0]! < now - ROLLING_WINDOW_MS) {
      frameTimestamps.shift();
    }
    const fps = frameTimestamps.length;
    const color = fps >= 55 ? '#3aff7a' : fps >= 30 ? '#ffd94a' : '#ff4444';
    label.setText(`${fps} FPS`);
    label.setColor(color);
  };
  scene.events.on('update', onUpdate);

  scene.events.once('shutdown', () => {
    scene.events.off('update', onUpdate);
    if (label.active) label.destroy();
  });
}
