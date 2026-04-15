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

export const TEXT_DPR =
  typeof window !== 'undefined' ? Math.min(window.devicePixelRatio || 1, 3) : 1;

/**
 * Walk the scene's display list and set the resolution of every Text
 * object to the device pixel ratio. Safe to call repeatedly — already-
 * patched objects simply receive the same value again.
 */
export function applyHiDpiToScene(scene: {
  children: { list: readonly { type?: string; setResolution?: (r: number) => void }[] };
}): void {
  if (TEXT_DPR <= 1) return;
  for (const child of scene.children.list) {
    if (child.type === 'Text' && child.setResolution) {
      child.setResolution(TEXT_DPR);
    }
  }
}
