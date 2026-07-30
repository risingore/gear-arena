/**
 * SOUL STRIKE button capture.
 *
 * Force-fills ult gauge, enters freeze state, captures the mandala button.
 */
import { chromium, type Page } from 'playwright';
import { mkdirSync } from 'fs';

const BASE_URL = 'http://localhost:8080';
const DIR = 'docs/screenshots';
mkdirSync(DIR, { recursive: true });

async function sceneKey(page: Page): Promise<string> {
  return page.evaluate(() => {
    const g = (window as any).__PHASER_GAME__;
    if (!g) return 'unknown';
    const skip = new Set(['Boot', 'Preloader', 'Settings', 'Collection']);
    const scenes = g.scene.scenes as any[];
    for (const s of scenes) {
      const key = s.scene?.key;
      if (!key || skip.has(key)) continue;
      if (s.scene?.settings?.status === 5) return key;
    }
    return 'unknown';
  });
}

async function run(): Promise<void> {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({
    viewport: { width: 1280, height: 720 },
    deviceScaleFactor: 2,
  });

  await page.addInitScript(() => {
    localStorage.removeItem('soul-strike-debug');
  });
  await page.goto(BASE_URL, { waitUntil: 'networkidle' });
  await page.waitForSelector('canvas');
  await page.waitForSelector('.soul-strike-title-overlay.visible [data-role="play"]');
  await page.waitForTimeout(400);

  const clickDom = async (selector: string) => {
    await page.waitForSelector(selector, { timeout: 5000 });
    await page.evaluate((s) => {
      const el = document.querySelector(s) as HTMLElement | null;
      if (el) el.click();
    }, selector);
  };

  await clickDom('.soul-strike-title-overlay [data-role="play"]');
  await page.waitForTimeout(2000);
  await clickDom('.soul-strike-select-overlay [data-role="embark"]');
  await page.waitForTimeout(2500);
  await page.keyboard.press('1');
  await page.waitForTimeout(300);
  await page.keyboard.press(' ');
  await page.waitForTimeout(2500);

  if ((await sceneKey(page)) !== 'Battle') {
    console.error('Not in Battle:', await sceneKey(page));
    await browser.close();
    process.exit(1);
  }

  // Force ult freeze state + invoke showUltimateButton directly
  await page.evaluate(() => {
    const g = (window as any).__PHASER_GAME__;
    const s = g?.scene?.scenes?.find((x: any) => x.scene?.key === 'Battle');
    if (!s || !s.player || !s.player.ultimate) return;
    s.player.ultimateGauge = s.player.ultimate.gaugeFillRatio;
    s.player.ultimateUsed = false;
    s.ultReady = true;
    if (typeof s.showUltimateButton === 'function') s.showUltimateButton();
  });
  await page.waitForTimeout(500);

  await page.screenshot({ path: `${DIR}/soulbtn-default.png` });
  console.log('captured soulbtn-default');

  // Simulate aura state
  await page.evaluate(() => {
    const g = (window as any).__PHASER_GAME__;
    const s = g?.scene?.scenes?.find((x: any) => x.scene?.key === 'Battle');
    if (!s) return;
    if (s.slotState) s.slotState.aura = 'red';
    if (s.soulStrikeBtn?.setAura) s.soulStrikeBtn.setAura('#ff4444');
  });
  await page.waitForTimeout(400);
  await page.screenshot({ path: `${DIR}/soulbtn-aura-red.png` });
  console.log('captured soulbtn-aura-red');

  await browser.close();
  console.log(`\nSOUL STRIKE button shots saved to ${DIR}/soulbtn-*.png`);
}

run().catch((e) => {
  console.error('Crashed:', e?.message ?? e);
  process.exit(1);
});
