import { startGame } from './game/main';

// Instant start — no DOMContentLoaded wait. The script is loaded as a module
// at the bottom of <body> in index.html, so the DOM is already parsed when
// this runs.
startGame('game-container');

// Service worker — production builds only. `public/sw.js` is cache-first, so
// on the dev server it serves stale JS/HTML/sprites across reloads; in dev we
// instead tear down any registration + caches a previous dev session left.
if ('serviceWorker' in navigator) {
  if (import.meta.env.PROD) {
    navigator.serviceWorker.register('./sw.js').catch(() => {});
  } else {
    navigator.serviceWorker.getRegistrations()
      .then((regs) => regs.forEach((r) => r.unregister()))
      .catch(() => {});
    if ('caches' in window) {
      caches.keys().then((keys) => keys.forEach((k) => caches.delete(k))).catch(() => {});
    }
  }
}
