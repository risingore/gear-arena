/**
 * Validates i18n coverage.
 *
 * Scans src/ for literal strings passed to t(...) or bl(...) and
 * checks whether each appears as a key in src/game/i18n/ja.ts.
 * Reports missing translations so they can be added before Jam
 * submission (Japanese-language markets).
 *
 * Usage: bun run scripts/check-i18n.ts
 */
import { readFileSync, readdirSync, statSync } from 'fs';
import { join } from 'path';
import { ja } from '../src/game/i18n/ja';

const ROOT = 'src';
const translated = new Set(Object.keys(ja));
const found = new Set<string>();

function walk(dir: string): void {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    const s = statSync(p);
    if (s.isDirectory()) walk(p);
    else if (/\.(ts|tsx)$/.test(name)) scan(p);
  }
}

function scan(path: string): void {
  const src = readFileSync(path, 'utf8');
  // Match t('...') or t("...") or bl('...') or bl("...")
  const re = /\b(?:t|bl)\(\s*(['"])((?:\\.|(?!\1).)+)\1/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(src)) !== null) {
    const raw = m[2]!;
    // Decode common escapes
    const key = raw.replace(/\\(['"\\])/g, '$1');
    found.add(key);
  }
}

walk(ROOT);

const missing = [...found].filter((k) => !translated.has(k)).sort();
const unused = [...translated].filter((k) => !found.has(k)).sort();

console.log(`Scanned keys:   ${found.size}`);
console.log(`Translated:     ${translated.size}`);
console.log(`Missing in ja:  ${missing.length}`);
console.log(`Unused entries: ${unused.length}`);

if (missing.length > 0) {
  console.log('\n=== Missing translations ===');
  for (const k of missing) console.log('  ' + JSON.stringify(k));
}
if (unused.length > 0 && unused.length < 40) {
  console.log('\n=== Unused translation keys ===');
  for (const k of unused) console.log('  ' + JSON.stringify(k));
}

process.exit(missing.length > 0 ? 1 : 0);
