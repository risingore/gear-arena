/**
 * High-DPI text utility.
 *
 * Call `applyHiDpiToScene(scene)` at the end of every scene's `create()`
 * to bump the resolution of all Text objects to the device pixel ratio.
 * For dynamically spawned text (damage popups, log lines) chain
 * `.setResolution(TEXT_DPR)` after creation.
 *
 * This approach avoids monkey-patching Phaser internals, which breaks
 * under Rollup / Vite tree-shaking.
 */

// Minimum 2x rasterization — matches the canvas backing store in main.ts
// (RENDER_DPR) so glyphs don't look softer than the surrounding Graphics.
export const TEXT_DPR =
  typeof window !== 'undefined'
    ? Math.max(2, Math.min(window.devicePixelRatio || 1, 3))
    : 2;

/**
 * Walk the scene's display list and set the resolution of every Text
 * object to the device pixel ratio. Safe to call repeatedly — already-
 * patched objects simply receive the same value again.
 */
export function applyHiDpiToScene(scene: {
  children: { list: readonly { type?: string; setResolution?: (r: number) => void }[] };
}): void {
  for (const child of scene.children.list) {
    if (child.type === 'Text' && child.setResolution) {
      child.setResolution(TEXT_DPR);
    }
  }
}

/**
 * Show a red "DEBUG" label in the top-left corner when debug mode is on.
 * Call this at the end of every scene's create() — it no-ops when debug
 * is off, so there is no cost in production.
 */
export function showDebugBadge(scene: Phaser.Scene, debugEnabled: boolean): void {
  if (!debugEnabled) return;
  scene.add
    .text(8, 40, 'DEBUG', {
      fontFamily: 'system-ui, sans-serif',
      fontSize: '14px',
      color: '#ff3333',
      fontStyle: 'bold'
    })
    .setOrigin(0, 0)
    .setAlpha(0.6)
    .setDepth(9999);
}
