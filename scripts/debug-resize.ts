/**
 * Kima's resize behavior debugger.
 * Takes screenshots at multiple viewport sizes to see how the overlay + canvas behave.
 */
import { chromium } from 'playwright';
import { mkdirSync } from 'fs';

const BASE_URL = 'http://localhost:8080';
const DIR = '/tmp/soul-strike-resize';
mkdirSync(DIR, { recursive: true });

const sizes: Array<{ w: number; h: number; label: string }> = [
  { w: 1920, h: 1080, label: 'fullhd' },
  { w: 1280, h: 720, label: 'native' },
  { w: 1280, h: 620, label: 'browser1280x720' }, // real Chrome window 1280x720 minus UI
  { w: 1024, h: 576, label: 'small16x9' },
  { w: 800, h: 600, label: 'classic' },
  { w: 600, h: 900, label: 'tall' },
  { w: 1600, h: 600, label: 'wide' },
  // Mobile portrait — Phaser FIT mode shrinks the 1280×720 design to a
  // tiny strip; canvas-internal hit boxes still work but DOM overlays
  // become hard to tap. Captured here so Heika can eyeball whether the
  // play / sanctum buttons are still finger-sized at these widths.
  { w: 390, h: 844, label: 'iphone14_portrait' },
  { w: 360, h: 800, label: 'android_portrait' },
];

async function run(): Promise<void> {
  const browser = await chromium.launch({ headless: true });

  for (const size of sizes) {
    const page = await browser.newPage({
      viewport: { width: size.w, height: size.h },
      deviceScaleFactor: 2,
    });
    await page.goto(BASE_URL, { waitUntil: 'networkidle', timeout: 10000 });
    await page.waitForSelector('canvas', { timeout: 10000 });
    await page.waitForFunction(() => {
      const g = (window as any).__PHASER_GAME__;
      if (!g) return false;
      const title = g.scene.scenes.find((s: any) => s.scene.key === 'Title');
      return !!(title && title.scene.isActive());
    }, { timeout: 15000 });
    await page.waitForTimeout(1200);

    const metrics = await page.evaluate(() => {
      const canvas = document.querySelector('canvas') as HTMLCanvasElement | null;
      const overlay = document.querySelector('.soul-strike-title-overlay') as HTMLElement | null;
      const stage = overlay?.querySelector('.stage') as HTMLElement | null;
      const soulEl = stage?.querySelector('.soul') as HTMLElement | null;
      const getOpacity = (el: Element | null | undefined): string => {
        if (!el) return 'n/a';
        const cs = getComputedStyle(el);
        return `${cs.opacity}`;
      };
      return {
        window: { w: window.innerWidth, h: window.innerHeight },
        canvas: canvas ? {
          cssW: canvas.clientWidth, cssH: canvas.clientHeight,
          attrW: canvas.width, attrH: canvas.height,
          offL: canvas.offsetLeft, offT: canvas.offsetTop,
        } : null,
        overlay: overlay ? {
          cssW: overlay.clientWidth, cssH: overlay.clientHeight,
          classes: overlay.className,
          opacity: getOpacity(overlay),
        } : null,
        stage: stage ? {
          transform: stage.style.transform,
          leftStyle: stage.style.left,
          topStyle: stage.style.top,
          opacity: getOpacity(stage),
          boundingL: stage.getBoundingClientRect().left,
          boundingT: stage.getBoundingClientRect().top,
          boundingW: stage.getBoundingClientRect().width,
          boundingH: stage.getBoundingClientRect().height,
        } : null,
        soul: soulEl ? {
          opacity: getOpacity(soulEl),
          text: soulEl.textContent,
          bounding: soulEl.getBoundingClientRect(),
        } : null,
      };
    });

    console.log(`\n=== ${size.label} (${size.w}x${size.h}) ===`);
    console.log(JSON.stringify(metrics, null, 2));

    await page.screenshot({ path: `${DIR}/${size.label}.png` });
    await page.close();
  }

  await browser.close();
  console.log(`\nScreenshots saved to ${DIR}/`);
}

run().catch(e => { console.error(e); process.exit(1); });
