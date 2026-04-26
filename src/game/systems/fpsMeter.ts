/**
 * FPS meter overlay (DISABLED per Heika request 2026-04-26).
 *
 * The on-screen counter is intentionally a no-op now. Call sites
 * (Battle.ts / Build.ts) keep invoking attachFpsMeter so the debug-mode
 * toggle still works structurally, but nothing renders. Restore by
 * reverting this file from git history if FPS visibility is needed again.
 */
import type { Scene } from 'phaser';

export function attachFpsMeter(_scene: Scene): void {
  // no-op
}
