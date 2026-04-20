/**
 * 10-second intro GIF generator for itch.io.
 *
 * Records a scripted play sequence (Build → Ready → Battle → ULTIMATE
 * → cut-in → victory) as a Playwright .webm, then converts to
 * docs/screenshots/intro.gif via ffmpeg.
 *
 * Usage: bun run scripts/gif.ts
 * Requires: ffmpeg on PATH, dev server on localhost:8080.
 */
import { chromium } from 'playwright';
import { execSync } from 'child_process';
import { mkdirSync, readdirSync, renameSync, rmSync } from 'fs';
import { join } from 'path';

const BASE_URL = 'http://localhost:8080';
const OUT_DIR = 'docs/screenshots';
const VIDEO_DIR = '/tmp/soul-strike-gif';
mkdirSync(OUT_DIR, { recursive: true });
rmSync(VIDEO_DIR, { recursive: true, force: true });
mkdirSync(VIDEO_DIR, { recursive: true });

const OUT_PATH = join(OUT_DIR, 'intro.gif');

async function run(): Promise<void> {
  console.log('Launching browser with video capture...');
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1280, height: 720 },
    recordVideo: { dir: VIDEO_DIR, size: { width: 1280, height: 720 } },
  });
  const page = await context.newPage();

  try {
    await page.goto(BASE_URL, { waitUntil: 'networkidle', timeout: 10000 });
  } catch {
    console.error('Dev server not running. Start with: bun dev');
    await context.close();
    await browser.close();
    process.exit(1);
  }

  await page.waitForSelector('canvas', { timeout: 10000 });
  // Debug OFF for clean video
  await page.evaluate(() => localStorage.removeItem('soul-strike-debug'));
  await page.reload({ waitUntil: 'networkidle' });
  await page.waitForTimeout(1500);

  // Record start: Title
  console.log('Recording: Title → Select → Build → Battle → Ultimate...');
  await page.evaluate(() => {
    const el = document.querySelector('.soul-strike-title-overlay [data-role="play"]') as HTMLElement | null;
    el?.click();
  });
  await page.waitForTimeout(1200);

  await page.evaluate(() => {
    const el = document.querySelector('.soul-strike-select-overlay [data-role="embark"]') as HTMLElement | null;
    el?.click();
  });
  await page.waitForTimeout(1500);

  // Buy 3 parts + ready
  await page.keyboard.press('1'); await page.waitForTimeout(250);
  await page.keyboard.press('2'); await page.waitForTimeout(250);
  await page.keyboard.press('3'); await page.waitForTimeout(400);
  await page.keyboard.press(' '); // READY → Battle
  await page.waitForTimeout(1500);
  await page.keyboard.press('s'); // speed up

  // Keep tapping space to fire ultimate when ready
  for (let i = 0; i < 20; i += 1) {
    await page.keyboard.press(' ');
    await page.waitForTimeout(400);
  }

  await page.waitForTimeout(1200);
  await context.close();
  await browser.close();

  // Find the recorded webm
  const files = readdirSync(VIDEO_DIR).filter((f) => f.endsWith('.webm'));
  if (files.length === 0) {
    console.error('No video captured.');
    process.exit(1);
  }
  const webm = join(VIDEO_DIR, files[0]!);
  console.log(`Captured: ${webm}`);

  // Convert to GIF (10 seconds, 12 fps, 640px wide for size)
  console.log('Converting to GIF via ffmpeg...');
  // Palette-first two-pass for better GIF quality
  const palette = join(VIDEO_DIR, 'palette.png');
  execSync(
    `ffmpeg -y -t 10 -i "${webm}" -vf "fps=12,scale=640:-1:flags=lanczos,palettegen" "${palette}"`,
    { stdio: 'inherit' },
  );
  execSync(
    `ffmpeg -y -t 10 -i "${webm}" -i "${palette}" -filter_complex "fps=12,scale=640:-1:flags=lanczos[x];[x][1:v]paletteuse" "${OUT_PATH}"`,
    { stdio: 'inherit' },
  );

  const stat = execSync(`du -h "${OUT_PATH}"`).toString().trim();
  console.log(`\nDone: ${stat}`);

  // Move video into docs too (optional, webm is smaller & higher quality)
  const webmOut = join(OUT_DIR, 'intro.webm');
  renameSync(webm, webmOut);
  console.log(`Also saved: ${webmOut}`);
}

run().catch((e) => { console.error('Crashed:', e); process.exit(1); });
