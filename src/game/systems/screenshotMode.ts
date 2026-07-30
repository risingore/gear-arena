/**
 * Dev-only URL-driven capture mode for itch.io embed background art.
 *
 * Driven by `?screenshot=C` on the dev server. Inert in prod builds —
 * the `import.meta.env.DEV` guard short-circuits to `null`, so every
 * call site collapses to a dead branch.
 *   - Mode C: YUKIME-Ω face-off with the synergy halo forced to its top
 *             tier (white + gold + orange storm) and the full HUD
 *             intact, frozen 2s after intro for the embed-bg capture.
 *
 * Consumed by Preloader (state seeding + direct route to Battle) and
 * Battle (freeze timing + halo override).
 */
export type ScreenshotMode = 'C' | null;

export const getScreenshotMode = (): ScreenshotMode => {
  if (!import.meta.env.DEV) return null;
  if (typeof window === 'undefined') return null;
  const v = new URLSearchParams(window.location.search).get('screenshot');
  return v === 'C' ? 'C' : null;
};
