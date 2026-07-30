/**
 * SOUL STRIKE — Full UI + functional debug patrol.
 *
 * Phase A: Visual — walks every scene, captures screenshots for review.
 * Phase B: Functional — verifies game state changes (gold, equip, battle outcome).
 *
 * Usage: bun run scripts/browser-test.ts
 * Requires: bun dev running on localhost:8080
 */
import { chromium } from 'playwright';
import { mkdirSync, rmSync } from 'fs';

const BASE_URL = 'http://localhost:8080';
const DIR = '/tmp/soul-strike-screenshots';
mkdirSync(DIR, { recursive: true });

async function run(): Promise<void> {
  console.log('Launching browser...');
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });

  const debugLogs: string[] = [];
  const errors: string[] = [];
  const funcResults: { name: string; pass: boolean; detail: string }[] = [];
  const DETAIL_RE = /^\s*\[[a-z_]+\]/i;
  let inVisualDebuggerBlock = false;
  page.on('console', m => {
    const txt = m.text();
    if (txt.includes('[VisualDebugger]')) {
      debugLogs.push(txt);
      inVisualDebuggerBlock = txt.includes('issue(s) found');
      return;
    }
    if (inVisualDebuggerBlock && DETAIL_RE.test(txt)) {
      debugLogs.push('[VisualDebugger-detail] ' + txt.trim());
    } else {
      inVisualDebuggerBlock = false;
    }
  });
  page.on('pageerror', e => {
    const stack = e.stack ?? '(no stack)';
    errors.push(`${e.message}\n${stack}`);
  });

  try {
    await page.goto(BASE_URL, { waitUntil: 'networkidle', timeout: 10000 });
  } catch {
    console.error('Dev server not running. Start with: bun dev');
    await browser.close();
    process.exit(1);
  }

  await page.waitForSelector('canvas', { timeout: 10000 });
  await page.waitForTimeout(2000);

  // Enable debug mode
  await page.evaluate(() => {
    localStorage.setItem('soul-strike-debug', '{"enabled":true}');
  });
  await page.reload({ waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);

  const c = (await page.$('canvas'))!;
  let step = 0;

  const snap = async (name: string, wait = 800): Promise<void> => {
    await page.waitForTimeout(wait);
    step += 1;
    const filename = `${DIR}/${String(step).padStart(2, '0')}_${name}.png`;
    await page.screenshot({ path: filename });
    console.log(`  [${step}] ${name}`);
  };

  const click = async (x: number, y: number, wait = 600): Promise<void> => {
    await c.click({ position: { x, y } });
    await page.waitForTimeout(wait);
  };

  /**
   * Click a DOM overlay element. Title / Settings / GameOver / ED are DOM
   * overlays that sit on top of the Phaser canvas — canvas.click cannot
   * reach their buttons because the overlay root has pointer-events:auto.
   */
  const clickDom = async (selector: string, wait = 600): Promise<void> => {
    // Dispatch click directly via the DOM — Playwright's actionability
    // checks mis-flag CSS-transformed overlays as "intercepted by another
    // element" on the re-mount code path, so we bypass the check entirely.
    const result = await page.evaluate((sel: string) => {
      const els = document.querySelectorAll(sel);
      const el = els[0] as HTMLElement | undefined;
      if (!el) return { found: 0 };
      el.click();
      return { found: els.length, tag: el.tagName, text: el.textContent?.slice(0, 30) ?? '' };
    }, selector);
    if ((result as { found: number }).found === 0) {
      console.log(`  [clickDom] selector not found: ${selector}`);
    }
    await page.waitForTimeout(wait);
  };

  const press = async (key: string, wait = 600): Promise<void> => {
    await page.keyboard.press(key);
    await page.waitForTimeout(wait);
  };

  /** Read game state from Phaser registry */
  const getState = async (): Promise<any> => {
    return page.evaluate(() => {
      const game = (window as any).__PHASER_GAME__;
      if (!game) return null;
      const scene = game.scene.scenes.find((s: any) => s.scene.isActive);
      if (!scene) return null;
      try {
        return JSON.parse(JSON.stringify(scene.registry.get('runState') ?? null));
      } catch {
        return null;
      }
    });
  };

  /** Get the currently visible scene key */
  const getActiveScene = async (): Promise<string> => {
    return page.evaluate(() => {
      const game = (window as any).__PHASER_GAME__;
      if (!game || !game.scene) return 'unknown';
      // These scenes may linger active but are not the "current" scene
      const skip = new Set(['Boot', 'Preloader', 'Settings', 'Collection']);
      const scenes = game.scene.scenes as any[];
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
  };

  /** Record a functional test result */
  const assert = (name: string, condition: boolean, detail: string): void => {
    funcResults.push({ name, pass: condition, detail });
    const icon = condition ? '✓' : '✗';
    console.log(`    ${icon} ${name}: ${detail}`);
  };

  // =========================================================================
  // PHASE 1: FUNCTIONAL + VISUAL (combined single pass)
  // =========================================================================
  console.log('\n╔══════════════════════════════════════╗');
  console.log('║   FUNCTIONAL + VISUAL DEBUG PATROL    ║');
  console.log('╚══════════════════════════════════════╝');

  // --- Title ---
  console.log('\n--- Title ---');
  await snap('title', 1000);

  // --- Collection tabs ---
  console.log('\n--- Collection ---');
  await clickDom('.soul-strike-title-overlay [data-role="collection"]');
  await snap('collection_cyborgs');
  await click(540, 86); await snap('collection_parts');
  await click(700, 86); await snap('collection_enemies');
  await click(860, 86); await snap('collection_titles');
  await click(80, 692); await page.waitForTimeout(500);

  // --- Settings ---
  console.log('\n--- Settings ---');
  await clickDom('.soul-strike-title-overlay [data-role="settings"]');
  await snap('settings');
  await clickDom('.soul-strike-settings-overlay [data-role="back"]');

  // --- Select (all 4 characters) ---
  console.log('\n--- Select ---');
  await clickDom('.soul-strike-title-overlay [data-role="play"]', 1000);
  await snap('select_char1');
  await press('ArrowRight'); await snap('select_char2');
  await press('ArrowRight'); await snap('select_char3');
  await press('ArrowRight'); await snap('select_char4');
  await press('ArrowLeft'); await press('ArrowLeft'); await press('ArrowLeft');
  await page.waitForTimeout(300);

  // --- Test 1: Select → Build transition ---
  console.log('\n--- Test: Select → Build ---');
  await clickDom('.soul-strike-select-overlay [data-role="embark"]', 1500); // EMBARK
  await snap('build_initial');
  const scene1 = await getActiveScene();
  assert('Scene is Build', scene1 === 'Build', `active=${scene1}`);

  const state1 = await getState();
  assert('Robot selected', state1?.robotKey === 'robot_knight', `robotKey=${state1?.robotKey}`);
  assert('Starting gold > 0', state1?.gold > 0, `gold=${state1?.gold}`);
  assert('Round is 1', state1?.currentRound === 1, `round=${state1?.currentRound}`);
  assert('Shop has items', state1?.shopOffer?.length > 0, `shopOffer.length=${state1?.shopOffer?.length}`);
  const goldBefore = state1?.gold;

  // --- Test 2: Buy a part (use keyboard shortcut 1) ---
  console.log('\n--- Test: Buy part ---');
  await press('1', 600); // buy first shop item via keyboard
  await snap('build_after_buy');
  const state2 = await getState();
  const equipped2 = Object.keys(state2?.equipped ?? {}).length;
  assert('Part equipped', equipped2 > 0, `equipped=${equipped2}`);
  assert('Gold decreased', state2?.gold < goldBefore,
    `gold=${state2?.gold} (was ${goldBefore})`);

  // --- Test 3: Reroll ---
  console.log('\n--- Test: Reroll ---');
  const shopBefore = JSON.stringify(state2?.shopOffer);
  await click(1040, 500, 600); // REROLL button
  const state3 = await getState();
  const shopAfter = JSON.stringify(state3?.shopOffer);
  assert('Shop changed after reroll', shopBefore !== shopAfter,
    `before=${shopBefore?.substring(0, 40)}...`);
  assert('Gold decreased from reroll', state3?.gold < state2?.gold,
    `gold=${state3?.gold} (was ${state2?.gold})`);
  await snap('build_after_reroll');

  // --- Test 4: Battle start ---
  console.log('\n--- Test: Battle ---');
  await click(1040, 556, 2000); // READY
  await snap('battle_start', 1500);
  const scene4 = await getActiveScene();
  assert('Scene is Battle', scene4 === 'Battle', `active=${scene4}`);

  // --- Test 5: Battle runs + SOUL STRIKE + wait for finish ---
  console.log('\n--- Test: Combat + SOUL STRIKE ---');
  await press('s'); // speed up
  await page.waitForTimeout(2000);
  await snap('battle_midcombat');

  // Keep pressing Space periodically to fire SOUL STRIKE when ready,
  // and wait for battle to end (scene leaves Battle)
  for (let i = 0; i < 30; i++) {
    await press('Space', 500);
    const s = await getActiveScene();
    if (s !== 'Battle') break;
    await page.waitForTimeout(1500);
  }
  await snap('battle_finished');

  // --- Test 7: Verify scene left Battle ---
  const sceneAfterBattle = await getActiveScene();
  assert('Left Battle scene',
    sceneAfterBattle !== 'Battle',
    `active=${sceneAfterBattle}`);

  // --- Test 8: Result → next round ---
  console.log('\n--- Test: Result → Continue ---');
  await snap('result');
  // Press Space to continue past result
  await press('Space', 2000);
  // May need another Space if skill selection appeared
  await press('Space', 2000);
  await page.waitForTimeout(1500);
  await snap('after_continue');
  const scene9 = await getActiveScene();
  assert('Reached Build or GameOver or Title',
    scene9 === 'Build' || scene9 === 'GameOver' || scene9 === 'Title',
    `active=${scene9}`);
  if (scene9 === 'Build') {
    const state9 = await getState();
    assert('Round advanced', state9?.currentRound === 2, `round=${state9?.currentRound}`);
  }

  // --- Test 10: Restart ---
  console.log('\n--- Test: Restart (R key) ---');
  await c.click({ position: { x: 200, y: 200 } });
  await page.waitForTimeout(200);
  await press('r', 1500);
  await snap('restart_title');
  const scene10 = await getActiveScene();
  assert('Back at Title', scene10 === 'Title', `active=${scene10}`);

  // =========================================================================
  // BOSS ROUND TEST — force R1 to be a boss to test skill selection UI
  // =========================================================================
  console.log('\n╔══════════════════════════════════════╗');
  console.log('║   BOSS ROUND + SKILL SELECTION TEST   ║');
  console.log('╚══════════════════════════════════════╝');

  // Start a new run
  console.log('\n--- Boss test: Start run ---');
  // Force Title → Select via Phaser scene manager. The DOM click on
  // Title[data-role=play] is unreliable on the re-mount path (the
  // overlay's click handler race-conditions with fadeToScene during
  // rapid shutdown→create cycles), so we drive the scene swap directly.
  await page.evaluate(() => {
    const g = (window as any).__PHASER_GAME__;
    if (!g) return;
    // Nuke any lingering Title overlay DOM so canvas clicks work.
    document.querySelectorAll('.soul-strike-title-overlay').forEach((el) => el.remove());
    for (const s of g.scene.scenes) {
      if (s.scene.isActive && s.scene.key !== 'Select') g.scene.stop(s.scene.key);
    }
    g.scene.start('Select');
  });
  await page.waitForTimeout(1500);
  await clickDom('.soul-strike-select-overlay [data-role="embark"]', 1500); // Select → Build

  // Force round 1 to be a boss round
  await page.evaluate(() => {
    const game = (window as any).__PHASER_GAME__;
    if (!game) return;
    const scene = game.scene.scenes.find((s: any) => s.scene.key === 'Build');
    if (!scene) return;
    const state = scene.registry.get('runState');
    if (state?.generatedRounds?.[0]) {
      state.generatedRounds[0].isBoss = true;
    }
  });

  // Buy multiple parts for combat
  await press('1', 400);
  await press('2', 400);
  await press('3', 400);
  await press('4', 400);
  await press('5', 400);

  // Enter battle
  await click(1040, 556, 2000); // READY
  await press('s'); // speed up

  // Wait for battle to finish
  for (let i = 0; i < 30; i++) {
    await press('Space', 500);
    const s = await getActiveScene();
    if (s !== 'Battle') break;
    await page.waitForTimeout(1500);
  }
  await page.waitForTimeout(1000);
  await snap('boss_result_with_skills');

  // Check skill selection UI
  const bossScene = await getActiveScene();
  console.log(`  Scene after boss: ${bossScene}`);

  // Result is now a DOM overlay — check via DOM selectors.
  const hasSkillUI = await page.evaluate(() => {
    return !!document.querySelector('.soul-strike-result-overlay .skill-cards');
  });
  assert('Skill selection UI shown on boss round', hasSkillUI, `hasSkillUI=${hasSkillUI}`);

  // Take screenshot of skill selection
  await snap('boss_skill_selection');

  // Select first skill card via DOM
  await clickDom('.soul-strike-result-overlay [data-skill="0"]', 1000);
  await snap('boss_after_skill_select');

  // NEXT ROUND primary button in Result overlay after skill pick
  const hasNextRound = await page.evaluate(() => {
    const btn = document.querySelector('.soul-strike-result-overlay [data-role="primary"]');
    return !!btn && (btn.textContent ?? '').toUpperCase().includes('NEXT');
  });
  assert('NEXT ROUND button shown after skill pick', hasNextRound, `hasNextRound=${hasNextRound}`);

  // Clean up - force back to title (R is unreliable after Build re-entry)
  await page.evaluate(() => {
    const g = (window as any).__PHASER_GAME__;
    if (!g) return;
    for (const s of g.scene.scenes) {
      if (s.scene.isActive && s.scene.key !== 'Title') g.scene.stop(s.scene.key);
    }
    g.scene.start('Title');
  });
  await page.waitForTimeout(1500);

  // =========================================================================
  // REPORT
  // =========================================================================
  console.log('\n╔══════════════════════════════════════╗');
  console.log('║          FULL DEBUG REPORT            ║');
  console.log('╚══════════════════════════════════════╝');

  // Visual
  const issues = debugLogs.filter(l => l.includes('issue(s) found'));
  const oks = debugLogs.filter(l => l.includes('OK'));
  console.log(`\n📐 Visual: ${oks.length} scenes OK, ${issues.length} with issues`);
  if (issues.length > 0) {
    for (const i of debugLogs) {
      if (i.includes('issue') || i.includes('depth') || i.includes('overflow') || i.includes('offscreen')) {
        console.log('  ⚠️  ' + i);
      }
    }
  }

  // Functional
  const passed = funcResults.filter(r => r.pass).length;
  const failed = funcResults.filter(r => !r.pass).length;
  console.log(`\n🔧 Functional: ${passed} passed, ${failed} failed`);
  if (failed > 0) {
    for (const r of funcResults.filter(f => !f.pass)) {
      console.log(`  ✗ ${r.name}: ${r.detail}`);
    }
  }

  // Errors
  const realErrors = errors.filter(e => !e.includes('audio') && !e.includes('decode'));
  const audioErrors = errors.filter(e => e.includes('audio') || e.includes('decode'));
  if (realErrors.length > 0) {
    console.log(`\n❌ Page errors: ${realErrors.length}`);
    for (const e of realErrors) console.log('  ❌ ' + e);
  }
  if (audioErrors.length > 0) {
    console.log(`\n🔇 Audio errors: ${audioErrors.length} (BGM assets missing)`);
  }

  // Summary
  const allClear = issues.length === 0 && failed === 0 && realErrors.length === 0;
  if (allClear) {
    console.log('\n✅ ALL CHECKS PASSED');
  } else {
    console.log('\n⚠️  ISSUES FOUND — review above');
  }

  console.log(`\n📸 ${step} screenshots saved to: ${DIR}/`);
  console.log('   Run: rm -rf ' + DIR + '  to clean up after review.');
  console.log('════════════════════════════════════════\n');

  await browser.close();
  process.exit(allClear ? 0 : 1);
}

run().catch(e => { console.error('Crashed:', e.message); process.exit(1); });
