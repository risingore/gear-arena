/**
 * Automated INDRA playthrough with runStats collection.
 *
 * Runs N simulated 5-round runs headlessly, buying shop items via
 * keyboard shortcut 1-5 and speeding battles to x6, then dumps
 * runStats from Phaser Registry at end-of-run. Aggregates across
 * runs to surface balance signals (clear rate, average DMG, gold
 * surplus) for Day 8 tuning.
 *
 * Usage: bun run scripts/auto-play.ts [runs=5]
 */
import { chromium, type Page } from 'playwright';

const BASE_URL = 'http://localhost:8080';
const RUNS = Number(process.argv[2] ?? 5);

interface RunResult {
  readonly index: number;
  readonly outcome: string;
  readonly roundReached: number;
  readonly totalRounds: number;
  readonly finalGold: number;
  readonly runStats: unknown;
}

async function getActiveScene(page: Page): Promise<string> {
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

async function getRunState(page: Page): Promise<any> {
  return page.evaluate(() => {
    const g = (window as any).__PHASER_GAME__;
    if (!g) return null;
    const scene = g.scene.scenes.find((s: any) => s.scene.isActive);
    if (!scene) return null;
    try {
      return JSON.parse(JSON.stringify(scene.registry.get('runState') ?? null));
    } catch {
      return null;
    }
  });
}

async function playOnce(page: Page, idx: number): Promise<RunResult> {
  // Reset to Title
  await page.evaluate(() => {
    const g = (window as any).__PHASER_GAME__;
    for (const s of g.scene.scenes) {
      if (s.scene.isActive && s.scene.key !== 'Title') g.scene.stop(s.scene.key);
    }
    g.scene.start('Title');
  });
  await page.waitForTimeout(1000);

  // Title → Select (PLAY)
  await page.evaluate(() => {
    const el = document.querySelector('.soul-strike-title-overlay [data-role="play"]') as HTMLElement | null;
    el?.click();
  });
  await page.waitForTimeout(1200);

  // Select → Build (EMBARK on INDRA)
  await page.evaluate(() => {
    const el = document.querySelector('.soul-strike-select-overlay [data-role="embark"]') as HTMLElement | null;
    el?.click();
  });
  await page.waitForTimeout(1500);

  // 5 rounds
  for (let round = 0; round < 5; round += 1) {
    // Buy 5 shop items via keyboard
    for (const k of ['1', '2', '3', '4', '5']) {
      await page.keyboard.press(k);
      await page.waitForTimeout(200);
    }
    // Ready → Battle
    await page.keyboard.press(' ');
    await page.waitForTimeout(1500);

    // Speed up
    await page.keyboard.press('s');

    // Wait for Battle to end
    let left = false;
    for (let i = 0; i < 40; i += 1) {
      await page.keyboard.press(' ');
      await page.waitForTimeout(400);
      const s = await getActiveScene(page);
      if (s !== 'Battle') { left = true; break; }
    }
    if (!left) break;
    await page.waitForTimeout(1200);

    // Result → Build (or GameOver / Title)
    const scene = await getActiveScene(page);
    if (scene === 'Result') {
      await page.evaluate(() => {
        const el = document.querySelector('.soul-strike-result-overlay [data-role="primary"]') as HTMLElement | null;
        el?.click();
      });
      await page.waitForTimeout(1500);
    } else if (scene !== 'Build') {
      break;
    }
  }

  const finalScene = await getActiveScene(page);
  const state = await getRunState(page);
  return {
    index: idx,
    outcome: state?.battleOutcome ?? 'unknown',
    roundReached: state?.currentRound ?? -1,
    totalRounds: state?.generatedRounds?.length ?? 0,
    finalGold: state?.gold ?? 0,
    runStats: state?.runStats ?? null,
  };
}

async function run(): Promise<void> {
  console.log(`Launching browser, running ${RUNS} INDRA simulated playthroughs...`);
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });

  try {
    await page.goto(BASE_URL, { waitUntil: 'networkidle', timeout: 10000 });
  } catch {
    console.error('Dev server not running. Start with: bun dev');
    await browser.close();
    process.exit(1);
  }

  await page.waitForSelector('canvas', { timeout: 10000 });
  await page.evaluate(() => localStorage.setItem('soul-strike-debug', '{"enabled":true}'));
  await page.reload({ waitUntil: 'networkidle' });
  await page.waitForTimeout(1500);

  const results: RunResult[] = [];
  for (let i = 0; i < RUNS; i += 1) {
    console.log(`\n--- Run ${i + 1}/${RUNS} ---`);
    const r = await playOnce(page, i);
    console.log(`  outcome=${r.outcome}, round=${r.roundReached}/${r.totalRounds}, gold=${r.finalGold}`);
    results.push(r);
  }

  await browser.close();

  // Aggregate
  const victories = results.filter((r) => r.outcome === 'victory').length;
  const defeats = results.filter((r) => r.outcome === 'lose').length;
  const avgRound = results.reduce((s, r) => s + r.roundReached, 0) / results.length;
  const avgGold = results.reduce((s, r) => s + r.finalGold, 0) / results.length;

  console.log('\n=== Aggregate ===');
  console.log(`Victories: ${victories}/${results.length}`);
  console.log(`Defeats:   ${defeats}/${results.length}`);
  console.log(`Avg round reached: ${avgRound.toFixed(2)}`);
  console.log(`Avg final gold:    ${avgGold.toFixed(0)}`);

  console.log('\n=== Raw ===');
  console.log(JSON.stringify(results, null, 2));
}

run().catch((e) => { console.error('Crashed:', e); process.exit(1); });
