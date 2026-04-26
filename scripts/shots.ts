/**
 * Jam submission screenshot generator.
 *
 * Produces 6 polished 1280×720 PNGs (Title / Select / Build / Battle /
 * Result / Sanctum) in docs/screenshots/ for the itch.io page.
 *
 * Runs with debug mode OFF so no red DEBUG badge leaks into the shots.
 * Requires `bun dev` on localhost:8080.
 *
 * Usage: bun run scripts/shots.ts
 */
import { chromium, type Page } from 'playwright';
import { mkdirSync } from 'fs';

const BASE_URL = 'http://localhost:8080';
const DIR = 'docs/screenshots';
mkdirSync(DIR, { recursive: true });

async function getActiveSceneKey(page: Page): Promise<string> {
  return page.evaluate(() => {
    const g = (window as any).__PHASER_GAME__;
    if (!g) return 'unknown';
    const skip = new Set(['Boot', 'Preloader', 'Settings', 'Collection']);
    const scenes = g.scene.scenes as any[];
    let best = 'unknown';
    let bestCount = -1;
    for (const s of scenes) {
      const key = s.scene?.key;
      if (!key || skip.has(key)) continue;
      if (!s.scene.isActive) continue;
      const count = s.children?.list?.length ?? 0;
      if (count > bestCount) { bestCount = count; best = key; }
    }
    return best;
  });
}

async function run(): Promise<void> {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({
    viewport: { width: 1280, height: 720 },
    deviceScaleFactor: 2,
  });

  try {
    await page.goto(BASE_URL, { waitUntil: 'networkidle', timeout: 10000 });
  } catch {
    console.error('Dev server not running. Start with: bun dev');
    await browser.close();
    process.exit(1);
  }

  await page.waitForSelector('canvas', { timeout: 10000 });
  // Debug mode OFF so no red badge appears.
  await page.evaluate(() => localStorage.removeItem('soul-strike-debug'));
  await page.reload({ waitUntil: 'networkidle' });
  await page.waitForTimeout(1800);

  console.log('=== 01_title ===');
  await page.screenshot({ path: `${DIR}/01_title.png` });

  console.log('=== 02_select ===');
  await page.click('.soul-strike-title-overlay [data-role="play"]');
  await page.waitForTimeout(1500);
  await page.screenshot({ path: `${DIR}/02_select.png` });

  console.log('=== 03_build ===');
  await page.click('.soul-strike-select-overlay [data-role="embark"]');
  await page.waitForTimeout(2000);
  await page.screenshot({ path: `${DIR}/03_build.png` });

  console.log('=== 04_battle ===');
  // Buy first shop item + ready via keyboard shortcuts (no canvas magic numbers).
  await page.keyboard.press('1');
  await page.waitForTimeout(400);
  await page.keyboard.press('2');
  await page.waitForTimeout(400);
  await page.keyboard.press('3');
  await page.waitForTimeout(400);
  await page.keyboard.press(' '); // Space = READY
  await page.waitForTimeout(2500);
  await page.screenshot({ path: `${DIR}/04_battle.png` });

  console.log('=== 05_result ===');
  // Speed up, press SPACE periodically for ultimate, wait for Result.
  await page.keyboard.press('s');
  for (let i = 0; i < 40; i++) {
    await page.keyboard.press(' ');
    await page.waitForTimeout(400);
    const scene = await getActiveSceneKey(page);
    if (scene === 'Result') break;
  }
  await page.waitForTimeout(1500);
  await page.screenshot({ path: `${DIR}/05_result.png` });

  console.log('=== 06_sanctum ===');
  // SANCTUM is unlocked by `save.battlesCompleted > 0` and the cards
  // need scrap to read meaningfully. Inject both into localStorage and
  // reload back to Title so the SANCTUM button renders.
  await page.evaluate(() => {
    const KEY = 'soul-strike-save-v2';
    const raw = localStorage.getItem(KEY);
    const data = raw ? JSON.parse(raw) : {};
    data.battlesCompleted = Math.max(1, data.battlesCompleted || 0);
    data.scrap = Math.max(80, data.scrap || 0);
    localStorage.setItem(KEY, JSON.stringify(data));
  });
  await page.reload({ waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);
  // Title overlay's fade-in may still be in progress; force-click bypasses
  // the visibility / actionability heuristics that were tripping the
  // 30 s timeout when the overlay fades intercepted hit-tests.
  await page.click('.soul-strike-title-overlay [data-role="sanctum"]', {
    force: true,
    timeout: 5000,
  });
  await page.waitForTimeout(1800);
  await page.screenshot({ path: `${DIR}/06_sanctum.png` });

  await browser.close();
  console.log(`\nShots saved to ${DIR}/`);
}

run().catch((e) => {
  console.error('Crashed:', e.message);
  process.exit(1);
});
