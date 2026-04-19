/**
 * Kima's HiDPI forensic debugger.
 * Captures full render state so Kima can reason about rendering quality
 * without asking Heika for screenshots.
 *
 * Usage: bun run scripts/debug-hidpi.ts [--hidpi]
 * Requires: bun dev running on localhost:8080
 */
import { chromium } from 'playwright';
import { mkdirSync } from 'fs';

const BASE_URL = 'http://localhost:8080';
const DIR = '/tmp/soul-strike-hidpi';
mkdirSync(DIR, { recursive: true });

async function run(): Promise<void> {
  const hidpiMode = process.argv.includes('--hidpi');
  console.log(`Mode: ${hidpiMode ? 'APPLY HIDPI' : 'RAW'}`);
  console.log('Launching browser...');
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({
    viewport: { width: 1600, height: 900 },
    deviceScaleFactor: 2,
  });

  try {
    await page.goto(BASE_URL, { waitUntil: 'networkidle', timeout: 10000 });
  } catch {
    console.error('Dev server not running.');
    await browser.close();
    process.exit(1);
  }

  await page.waitForSelector('canvas', { timeout: 10000 });

  // Wait until the Title scene is actually active (Boot → Preloader → Title)
  await page.waitForFunction(() => {
    const g = (window as any).__PHASER_GAME__;
    if (!g) return false;
    const title = g.scene.scenes.find((s: any) => s.scene.key === 'Title');
    return !!(title && title.scene.isActive());
  }, { timeout: 15000 });
  await page.waitForTimeout(500);

  if (hidpiMode) {
    // Apply HiDPI tweaks from the browser side to see what the Phaser API does
    await page.evaluate(() => {
      const g = (window as any).__PHASER_GAME__;
      if (!g) throw new Error('no Phaser game');
      const dpr = Math.max(2, Math.min(window.devicePixelRatio || 1, 3));
      const newW = 1280 * dpr;
      const newH = 720 * dpr;

      // The right order:
      //   1. setGameSize tells ScaleManager the new logical size (which
      //      also resizes canvas.width/height internally).
      //   2. cameras stretch to the new size but keep scene coords at 1280x720
      //      via zoom=dpr.
      g.scale.setGameSize(newW, newH);
      const applyCam = (s: any): void => {
        if (s.cameras?.main) {
          const cam = s.cameras.main;
          cam.setSize(newW, newH);
          cam.setZoom(dpr);
          cam.setScroll(0, 0);
        }
      };
      g.scene.scenes.forEach(applyCam);
      g.events.on('start', applyCam);
      g.scene.scenes.forEach((s: any) => {
        if (s.events) s.events.on('create', () => applyCam(s));
      });
      (window as any).__HIDPI_STATE__ = { dpr, newW, newH };
    });
    await page.waitForTimeout(1500);
  }

  // Dump full state
  const state = await page.evaluate(() => {
    const canvas = document.querySelector('canvas') as HTMLCanvasElement | null;
    const g = (window as any).__PHASER_GAME__;
    const activeScene = g?.scene.scenes.find((s: any) => s.scene.isActive());
    const cam = activeScene?.cameras.main;
    return {
      dpr: window.devicePixelRatio,
      innerSize: { w: window.innerWidth, h: window.innerHeight },
      canvas: canvas ? {
        attrW: canvas.width,
        attrH: canvas.height,
        cssW: canvas.clientWidth,
        cssH: canvas.clientHeight,
        styleW: canvas.style.width,
        styleH: canvas.style.height,
      } : null,
      game: g ? {
        configWidth: (g.config as any).width,
        configHeight: (g.config as any).height,
        scaleParentSize: g.scale ? { w: g.scale.width, h: g.scale.height } : null,
        scaleDisplaySize: g.scale ? { w: g.scale.displaySize.width, h: g.scale.displaySize.height } : null,
        scaleGameSize: g.scale ? { w: g.scale.gameSize.width, h: g.scale.gameSize.height } : null,
      } : null,
      renderer: g?.renderer ? {
        width: (g.renderer as any).width,
        height: (g.renderer as any).height,
        type: g.renderer.type,
      } : null,
      camera: cam ? {
        x: cam.x, y: cam.y,
        width: cam.width, height: cam.height,
        zoom: cam.zoom,
        scrollX: cam.scrollX, scrollY: cam.scrollY,
        centerX: cam.centerX, centerY: cam.centerY,
      } : null,
      activeScene: activeScene?.scene.key,
    };
  });

  console.log('=== Full Render State ===');
  console.log(JSON.stringify(state, null, 2));

  await page.screenshot({ path: `${DIR}/title-${hidpiMode ? 'hidpi' : 'raw'}.png` });
  await browser.close();
  console.log(`Screenshot: ${DIR}/title-${hidpiMode ? 'hidpi' : 'raw'}.png`);
}

run().catch(e => { console.error(e); process.exit(1); });
