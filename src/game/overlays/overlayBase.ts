/**
 * Shared overlay plumbing.
 *
 * Every DOM overlay in this project (Title / Settings / GameOver / ED /
 * Mandala / Select / Result) implements the same four patterns:
 *
 *   1. Inject a <style> block once per load.
 *   2. Remove any prior overlay with the same class so a rapid
 *      scene-loop cannot leave two roots intercepting clicks during
 *      the 240 ms fade-out.
 *   3. Mount the root, fade it in on the next RAF tick, and track the
 *      Phaser canvas bounding box via `ResizeObserver + window resize`
 *      to keep the 1280×720 stage pixel-perfect on any DPR / aspect.
 *   4. Fade out + detach on unmount, with a 240 ms grace period for
 *      the CSS transition to visually complete.
 *
 * Extracting these keeps the overlay files focused on their unique
 * markup + behavior. New overlays should use `ensureStyle` +
 * `fitStageToCanvas` + `wrapUnmount` rather than reimplementing them.
 */

/**
 * Escape HTML entities for safe interpolation into innerHTML strings.
 */
export function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c] ?? c));
}

/**
 * Inject a <style> tag once. Subsequent calls are no-ops.
 */
export function ensureStyle(id: string, css: string): void {
  if (document.getElementById(id)) return;
  const style = document.createElement('style');
  style.id = id;
  style.textContent = css;
  document.head.appendChild(style);
}

/**
 * Remove every element matching the root class. Call at the top of
 * every mount function before appending the new root.
 */
export function clearPriorRoots(rootClass: string): void {
  document.querySelectorAll(`.${rootClass}`).forEach((el) => el.remove());
}

/**
 * Keep `stage` visually centered on the Phaser canvas, scaled so the
 * 1280×720 design space fills as much of the canvas as possible.
 * Returns a disposer that removes the listeners and ResizeObserver.
 *
 * The stage element is expected to have:
 *   position: absolute;
 *   transform-origin: center center;
 * so the transform below can set its center + scale directly.
 */
export function fitStageToCanvas(stage: HTMLElement): () => void {
  const canvas = document.querySelector(
    '#game-container canvas',
  ) as HTMLCanvasElement | null;

  const fit = (): void => {
    const rect = canvas?.getBoundingClientRect();
    const w = rect && rect.width > 0 ? rect.width : window.innerWidth;
    const h = rect && rect.height > 0 ? rect.height : window.innerHeight;
    const cx = rect ? rect.left + w / 2 : window.innerWidth / 2;
    const cy = rect ? rect.top + h / 2 : window.innerHeight / 2;
    const s = Math.min(w / 1280, h / 720);
    stage.style.left = `${cx}px`;
    stage.style.top = `${cy}px`;
    stage.style.transform = `translate(-50%, -50%) scale(${s})`;
  };

  window.addEventListener('resize', fit);
  let ro: ResizeObserver | null = null;
  if (canvas && typeof ResizeObserver !== 'undefined') {
    ro = new ResizeObserver(() => fit());
    ro.observe(canvas);
  }
  fit();

  return (): void => {
    window.removeEventListener('resize', fit);
    if (ro) ro.disconnect();
  };
}

/**
 * Wrap an unmount callback so the root fades out via CSS (remove the
 * `.visible` class) and is detached from the DOM after `delayMs`,
 * which should match the overlay's opacity transition duration.
 */
export function wrapUnmount(
  root: HTMLElement,
  disposeListeners: () => void,
  delayMs = 240,
): () => void {
  return (): void => {
    root.classList.remove('visible');
    disposeListeners();
    window.setTimeout(() => {
      if (root.parentNode) root.parentNode.removeChild(root);
    }, delayMs);
  };
}
