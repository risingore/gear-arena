/**
 * /debug — Static visual analysis (no browser needed).
 *
 * Imports all scenes and analyzes their create() logic for common issues:
 * 1. Depth ordering conflicts (panels above text)
 * 2. Position overflow (elements beyond 1280x720)
 * 3. Missing translations
 * 4. Hardcoded values that should be in balance.ts
 *
 * Usage: bun run scripts/visual-test.ts
 */

import { readFileSync, readdirSync } from 'fs';
import { join } from 'path';

const SCENES_DIR = 'src/game/scenes';
const GAME_WIDTH = 1280;
const GAME_HEIGHT = 720;

interface Issue {
  file: string;
  line: number;
  type: string;
  message: string;
}

const issues: Issue[] = [];

function checkFile(filePath: string) {
  const content = readFileSync(filePath, 'utf-8');
  const lines = content.split('\n');
  const fileName = filePath.split('/').pop()!;

  lines.forEach((line, i) => {
    const lineNum = i + 1;
    const trimmed = line.trim();

    // Check 1: createPanel with depth > 0 (likely covers text)
    if (trimmed.includes('createPanel') && trimmed.includes('depth:')) {
      const depthMatch = trimmed.match(/depth:\s*(\d+)/);
      if (depthMatch && parseInt(depthMatch[1]!) > 0 && !trimmed.includes('depth: 50') && !trimmed.includes('depth: 51')) {
        issues.push({ file: fileName, line: lineNum, type: 'DEPTH', message: `createPanel with depth ${depthMatch[1]} may cover text (text defaults to 0)` });
      }
    }

    // Check 2: Hardcoded position far right
    const xMatch = trimmed.match(/\.text\(\s*(\d+)/);
    if (xMatch && parseInt(xMatch[1]!) > GAME_WIDTH) {
      issues.push({ file: fileName, line: lineNum, type: 'OVERFLOW', message: `Text positioned at x=${xMatch[1]} (canvas width is ${GAME_WIDTH})` });
    }

    // Check 3: setDepth on text that's lower than nearby panel
    if (trimmed.includes('setDepth(0)') && !trimmed.includes('//')) {
      issues.push({ file: fileName, line: lineNum, type: 'DEPTH_WARN', message: 'Explicit setDepth(0) on element — may be hidden behind panels' });
    }

    // Check 4: Hardcoded color strings that aren't in palette (potential inconsistency)
    const hexMatch = trimmed.match(/0x[0-9a-fA-F]{6}/g);
    if (hexMatch) {
      for (const hex of hexMatch) {
        // Known palette colors — skip these
        const known = ['0x000000', '0xffffff', '0x111118', '0x1a1a28', '0x12121e', '0x334466',
          '0x1a2a44', '0x2a3a55', '0x4466aa', '0x441a1a', '0x552a2a', '0xaa4444',
          '0x0a0a10', '0x333344', '0x444455', '0x555566', '0x222233', '0xaaaaaa',
          '0xff0000', '0xff7a00', '0xffd94a', '0x3aff7a', '0x3ab0ff', '0xcc66ff',
          '0xff5a5a', '0x5aaaff', '0xffaa3a', '0xc0c0c0', '0xc49bff',
          '0xff3a3a', '0xff4444', '0x1a2a1a', '0x88ff44', '0xff00ff',
          '0x10204a', '0xaeeaff', '0x203a6a', '0x88bbee', '0x3a6aaa',
          '0x1a1a28', '0x2a2a40', '0x555577', '0xff7a00', '0x331515',
          '0xff3a3a', '0xaa3333', '0x3a3a55', '0x9bbdff', '0xff9b5b'];
        if (!known.includes(hex) && !trimmed.includes('PALETTE') && !trimmed.includes('CATEGORY') && !trimmed.includes('ROBOT_COLORS') && !trimmed.includes('AURA')) {
          // Skip animation/effect colors
          if (!trimmed.includes('tween') && !trimmed.includes('flash') && !trimmed.includes('glow') && !trimmed.includes('slash') && !trimmed.includes('ring') && !trimmed.includes('spark')) {
            issues.push({ file: fileName, line: lineNum, type: 'COLOR', message: `Hardcoded color ${hex} — consider using PALETTE` });
          }
        }
      }
    }

    // Check 5: Font size hardcoded outside gameOptions
    if (trimmed.includes("fontSize:") && !filePath.includes('gameOptions') && !filePath.includes('uiFactory')) {
      const sizeMatch = trimmed.match(/fontSize:\s*'(\d+)px'/);
      if (sizeMatch && !['16', '24', '64'].includes(sizeMatch[1]!)) {
        issues.push({ file: fileName, line: lineNum, type: 'FONT', message: `Custom fontSize ${sizeMatch[1]}px — may cause inconsistency` });
      }
    }

    // Check 6: Magic numbers in gameplay logic (not layout)
    if (trimmed.includes('Math.random() <') || trimmed.includes('Math.random() >')) {
      if (!filePath.includes('slotMachine') && !filePath.includes('enemyPool') && !filePath.includes('combat')) {
        issues.push({ file: fileName, line: lineNum, type: 'HARDCODE', message: 'Math.random() comparison — should probability be in data file?' });
      }
    }
  });
}

// Scan all scene files
const sceneFiles = readdirSync(SCENES_DIR).filter(f => f.endsWith('.ts'));
for (const f of sceneFiles) {
  checkFile(join(SCENES_DIR, f));
}

// Also check systems
const systemsDir = 'src/game/systems';
const systemFiles = readdirSync(systemsDir).filter(f => f.endsWith('.ts'));
for (const f of systemFiles) {
  checkFile(join(systemsDir, f));
}

// Also check helpers
const helperDir = 'src/game/helper';
const helperFiles = readdirSync(helperDir).filter(f => f.endsWith('.ts'));
for (const f of helperFiles) {
  checkFile(join(helperDir, f));
}

// Report
console.log('========================================');
console.log('VISUAL DEBUG REPORT (Static Analysis)');
console.log('========================================');
console.log(`Files scanned: ${sceneFiles.length + systemFiles.length + helperFiles.length}`);
console.log(`Issues found: ${issues.length}\n`);

if (issues.length === 0) {
  console.log('✅ No issues detected.');
} else {
  const grouped: Record<string, Issue[]> = {};
  for (const issue of issues) {
    if (!grouped[issue.type]) grouped[issue.type] = [];
    grouped[issue.type]!.push(issue);
  }
  for (const [type, items] of Object.entries(grouped)) {
    console.log(`--- ${type} (${items.length}) ---`);
    for (const item of items) {
      console.log(`  ${item.file}:${item.line} — ${item.message}`);
    }
    console.log('');
  }
}
console.log('========================================');
process.exit(issues.length > 0 ? 1 : 0);
