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

const BASE_URL = process.env.GIF_BASE_URL ?? 'http://localhost:8080';
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

  // Record start: Title → Easy mode
  // (Title was changed to Easy/Hard split: data-role used to be "play",
  // it is now "play-easy" / "play-hard". Use Easy so a fresh save can
  // boot the run without the Hard-locked gate.)
  console.log('Recording: Title → Select → Build → Battle → Ultimate...');
  await page.evaluate(() => {
    const el = document.querySelector('.soul-strike-title-overlay [data-role="play-easy"]') as HTMLElement | null;
    el?.click();
  });
  await page.waitForTimeout(1200);

  await page.evaluate(() => {
    const el = document.querySelector('.soul-strike-select-overlay [data-role="embark"]') as HTMLElement | null;
    el?.click();
  });
  await page.waitForTimeout(1800);

  // Build is click-only now (D&D / SELL / 1-5 key purchase removed).
  // Try clicking the first three shop cards; selectors target the DOM
  // overlay shop cards if present, fall back gracefully if not.
  for (let i = 0; i < 3; i += 1) {
    await page.evaluate((idx) => {
      const cards = document.querySelectorAll('.soul-strike-build-overlay [data-role="shop-card"]');
      const card = cards[idx] as HTMLElement | undefined;
      card?.click();
    }, i);
    await page.waitForTimeout(300);
  }
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

  // Convert to GIF (15 seconds, 12 fps, 640px wide for size)
  // -ss 3.0 trims the leading 3s of black screen that Playwright records
  // before the page actually paints (browser boot + ESM load + Phaser init
  // + page.reload + networkidle wait). 1.5s alone left a noticeable dark
  // intro; bumping to 3.0s lands the first visible frame on the Title.
  // -t 15 (was 10) covers Title → Select → Build → Battle → first ULT
  // cut-in so the gif climaxes on a SOUL STRIKE moment instead of cutting
  // away just before the player fires their ultimate.
  console.log('Converting to GIF via ffmpeg...');
  const palette = join(VIDEO_DIR, 'palette.png');
  execSync(
    `ffmpeg -y -ss 3.0 -t 15 -i "${webm}" -vf "fps=12,scale=640:-1:flags=lanczos,palettegen" "${palette}"`,
    { stdio: 'inherit' },
  );
  execSync(
    `ffmpeg -y -ss 3.0 -t 15 -i "${webm}" -i "${palette}" -filter_complex "fps=12,scale=640:-1:flags=lanczos[x];[x][1:v]paletteuse" "${OUT_PATH}"`,
    { stdio: 'inherit' },
  );

  const stat = execSync(`du -h "${OUT_PATH}"`).toString().trim();
  console.log(`\nDone: ${stat}`);

  // Save the trimmed webm too (same -ss skip), so X / itch.io previews
  // both start on the Title screen, not on a black frame.
  const webmOut = join(OUT_DIR, 'intro.webm');
  execSync(
    `ffmpeg -y -ss 3.0 -i "${webm}" -c:v libvpx -b:v 1M -auto-alt-ref 0 "${webmOut}"`,
    { stdio: 'inherit' },
  );
  rmSync(webm, { force: true });
  console.log(`Also saved: ${webmOut}`);
}

run().catch((e) => { console.error('Crashed:', e); process.exit(1); });
