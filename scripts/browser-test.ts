/**
 * Headless browser visual test — captures screenshots of all scenes.
 * Usage: bun run scripts/browser-test.ts
 */
import { chromium } from 'playwright';
import { mkdirSync } from 'fs';

const BASE_URL = 'http://localhost:8080';
const DIR = '/tmp/gear-arena-screenshots';
mkdirSync(DIR, { recursive: true });

async function run() {
  console.log('Launching browser...');
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });

  const logs: string[] = [];
  const errs: string[] = [];
  page.on('console', m => { if (m.text().includes('[VisualDebugger]')) logs.push(m.text()); });
  page.on('pageerror', e => errs.push(e.message));

  try { await page.goto(BASE_URL, { waitUntil: 'networkidle', timeout: 10000 }); }
  catch { console.error('Dev server not running. Start with: bun dev'); await browser.close(); process.exit(1); }

  await page.waitForSelector('canvas', { timeout: 10000 });
  await page.waitForTimeout(2000);

  // Enable debug
  await page.evaluate(() => localStorage.setItem('gear-arena-debug', '{"enabled":true}'));
  await page.reload({ waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);

  const c = (await page.$('canvas'))!;
  const click = async (x: number, y: number, wait = 1200) => { await c.click({ position: { x, y } }); await page.waitForTimeout(wait); };

  // 1. Title
  console.log('[1] Title'); await page.waitForTimeout(1000);
  await page.screenshot({ path: `${DIR}/01_title.png` });

  // 2. Collection
  console.log('[2] Collection');
  await click(640, 454); await page.screenshot({ path: `${DIR}/02_coll_machines.png` });
  await click(540, 86); await page.screenshot({ path: `${DIR}/03_coll_parts.png` });
  await click(700, 86); await page.screenshot({ path: `${DIR}/04_coll_enemies.png` });
  await click(860, 86); await page.screenshot({ path: `${DIR}/05_coll_titles.png` });
  await click(80, 692);

  // 3. Settings
  console.log('[3] Settings');
  await click(640, 497); await page.screenshot({ path: `${DIR}/06_settings.png` });
  await click(80, 692);

  // 4. Select
  console.log('[4] Select');
  await click(640, 403, 1500); await page.screenshot({ path: `${DIR}/07_select.png` });

  // 5. Build
  console.log('[5] Build');
  await click(240, 620, 1500); await page.screenshot({ path: `${DIR}/08_build.png` });

  // Report
  console.log('\n=== REPORT ===');
  const issues = logs.filter(l => l.includes('issue'));
  console.log(`VisualDebugger: ${logs.length} logs, ${issues.length} issues`);
  issues.forEach(i => console.log('  ⚠️ ' + i));
  if (errs.length) { console.log(`Page errors: ${errs.length}`); errs.forEach(e => console.log('  ❌ ' + e)); }
  if (!issues.length && !errs.length) console.log('✅ All clear');
  console.log(`Screenshots: ${DIR}/`);

  await browser.close();
  process.exit(issues.length + errs.length > 0 ? 1 : 0);
}

run().catch(e => { console.error('Crashed:', e.message); process.exit(1); });
