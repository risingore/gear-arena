/**
 * Automated playthrough recorder.
 * Walks Boot -> Title -> Select -> Build -> Battle -> Result, snapshotting
 * each scene. Produces PNGs suitable for itch.io screenshot bundles and
 * for regression review.
 *
 * Usage:
 *   bun dev  (in another terminal)
 *   bun run scripts/playthrough.ts
 *
 * Output: /tmp/soul-strike-playthrough/*.png
 */
import { chromium, type Page } from 'playwright';
import { mkdirSync } from 'fs';

const BASE_URL = 'http://localhost:8080';
const DIR = '/tmp/soul-strike-playthrough';
mkdirSync(DIR, { recursive: true });

async function waitForScene(page: Page, key: string, timeoutMs = 15000): Promise<void> {
  await page.waitForFunction(
    (expectedKey: string) => {
      const g = (window as any).__PHASER_GAME__;
      if (!g) return false;
      return g.scene.scenes.some((s: any) => s.scene.key === expectedKey && s.scene.isActive());
    },
    key,
    { timeout: timeoutMs }
  );
  await page.waitForTimeout(900);
}

async function snap(page: Page, step: string): Promise<void> {
  const filename = `${DIR}/${step}.png`;
  await page.screenshot({ path: filename });
  console.log(`  snap: ${filename}`);
}

async function run(): Promise<void> {
  console.log('Launching browser (viewport 1280x720, DPR 2)...');
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({
    viewport: { width: 1280, height: 720 },
    deviceScaleFactor: 2,
  });

  try {
    await page.goto(BASE_URL, { waitUntil: 'networkidle', timeout: 15000 });
  } catch {
    console.error('Dev server not running. Start with: bun dev');
    await browser.close();
    process.exit(1);
  }

  await page.waitForSelector('canvas', { timeout: 15000 });

  // 1. Title
  await waitForScene(page, 'Title');
  await snap(page, '01_title');

  // 2. Navigate to Select via PLAY button (top-level overlay button)
  await page.click('.soul-strike-title-overlay [data-role="play"]');
  await waitForScene(page, 'Select');
  await snap(page, '02_select');

  // 3. Confirm selection (keyboard Enter) to reach Build
  await page.keyboard.press('Enter');
  await waitForScene(page, 'Build');
  await snap(page, '03_build');

  // 4. Press SPACE to go to Battle
  await page.keyboard.press('Space');
  await waitForScene(page, 'Battle');
  await page.waitForTimeout(1200);
  await snap(page, '04_battle_early');

  // 5. Cycle battle speed to x6 (S key)
  await page.keyboard.press('s');
  await page.keyboard.press('s');
  await page.keyboard.press('s');
  await page.waitForTimeout(4000);
  await snap(page, '05_battle_mid');

  // 6. Settings screen from Title keyboard shortcut — revisit Title first
  await page.keyboard.press('r');
  await waitForScene(page, 'Title');
  await page.click('.soul-strike-title-overlay [data-role="settings"]');
  await waitForScene(page, 'Settings');
  await snap(page, '06_settings');

  // 7. Collection
  await page.keyboard.press('r');
  await waitForScene(page, 'Title');
  await page.click('.soul-strike-title-overlay [data-role="collection"]');
  await waitForScene(page, 'Collection');
  await snap(page, '07_collection');

  await browser.close();
  console.log(`\nPlaythrough screenshots saved to ${DIR}/`);
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
