/**
 * Ultimate cut-in capture (ad-hoc).
 *
 * Captures 5 frames of the new 900ms cut-in at t=60 / 200 / 380 / 620 / 860 ms
 * to docs/screenshots/ult-*.png. Requires `bun dev` on :8080.
 *
 * Usage: bun run scripts/shots-ult.ts
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
    // Phaser 4: settings.status === 5 is RUNNING. isActive is unreliable here.
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
  await page.goto(BASE_URL, { waitUntil: 'networkidle', timeout: 10000 });
  await page.waitForSelector('canvas', { timeout: 10000 });
  await page.waitForSelector('.soul-strike-title-overlay.visible [data-role="play"]', { timeout: 10000 });
  await page.waitForTimeout(400);

  // Title → Select → Build (bypass Playwright actionability; dispatch DOM click)
  const clickDom = async (selector: string) => {
    await page.waitForSelector(selector, { timeout: 5000 });
    await page.evaluate((s) => {
      const el = document.querySelector(s) as HTMLElement | null;
      if (!el) throw new Error(`not found: ${s}`);
      el.click();
    }, selector);
  };

  console.log('before play click, scene:', await sceneKey(page));
  await clickDom('.soul-strike-title-overlay [data-role="play"]');
  await page.waitForTimeout(2500);
  console.log('after play click, scene:', await sceneKey(page));
  await clickDom('.soul-strike-select-overlay [data-role="embark"]');
  await page.waitForTimeout(3000);
  console.log('after embark, scene:', await sceneKey(page));

  // Build: buy 3, ready
  await page.keyboard.press('1');
  await page.waitForTimeout(300);
  await page.keyboard.press('2');
  await page.waitForTimeout(300);
  await page.keyboard.press('3');
  await page.waitForTimeout(300);
  await page.keyboard.press(' ');
  await page.waitForTimeout(2500);

  if ((await sceneKey(page)) !== 'Battle') {
    console.error('Not in Battle, got:', await sceneKey(page));
    await browser.close();
    process.exit(1);
  }

  // Force-fill the ultimate gauge and invoke triggerPlayerUltimate directly.
  // Keyboard input can be flaky in headless; direct method call is deterministic.
  const invoked = await page.evaluate(() => {
    const g = (window as any).__PHASER_GAME__;
    const s = g?.scene?.scenes?.find((x: any) => x.scene?.key === 'Battle');
    if (!s || !s.player || !s.player.ultimate) return { ok: false, reason: 'no-battle-or-player' };
    s.player.ultimateGauge = s.player.ultimate.gaugeFillRatio;
    s.player.ultimateUsed = false;
    s.ultReady = true;
    s.ultFiring = false;
    s.frozen = true;
    if (typeof s.triggerPlayerUltimate === 'function') {
      s.triggerPlayerUltimate();
      return { ok: true, reason: 'called' };
    }
    return { ok: false, reason: 'no-method' };
  });
  console.log('ult invoke:', JSON.stringify(invoked));
  if (!(invoked as any).ok) {
    await browser.close();
    process.exit(1);
  }
  const t0 = Date.now();
  const stamps = [60, 220, 400, 620, 860];
  for (const ms of stamps) {
    const wait = ms - (Date.now() - t0);
    if (wait > 0) await page.waitForTimeout(wait);
    const tag = `ult-${String(ms).padStart(4, '0')}ms`;
    await page.screenshot({ path: `${DIR}/${tag}.png` });
    console.log(`captured ${tag}`);
  }

  await browser.close();
  console.log(`\nUlt cut-in shots saved to ${DIR}/ult-*.png`);
}

run().catch((e) => {
  console.error('Crashed:', e?.message ?? e);
  process.exit(1);
});
