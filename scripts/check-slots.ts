/**
 * Validates that every blueprint slot in src/data/robots.ts lies
 * within the drawable blueprint area (192x240 virtual space minus
 * the slot radius). Catches layout regressions before they hit the
 * Build screen.
 *
 * Usage: bun run scripts/check-slots.ts
 */
import { ROBOTS } from '../src/data/robots';

const VIRTUAL_W = 192;
const VIRTUAL_H = 240;
const SLOT_RADIUS_VIRTUAL = 12.63; // 19px / blueprintScale (1.504)

const issues: string[] = [];

for (const [key, robot] of Object.entries(ROBOTS)) {
  const slots = robot.slots ?? [];
  for (const slot of slots) {
    const minX = SLOT_RADIUS_VIRTUAL;
    const maxX = VIRTUAL_W - SLOT_RADIUS_VIRTUAL;
    const minY = SLOT_RADIUS_VIRTUAL;
    const maxY = VIRTUAL_H - SLOT_RADIUS_VIRTUAL;
    if (slot.x < minX || slot.x > maxX) {
      issues.push(`${key} / ${slot.id} : x=${slot.x} out of [${minX.toFixed(1)}, ${maxX.toFixed(1)}]`);
    }
    if (slot.y < minY || slot.y > maxY) {
      issues.push(`${key} / ${slot.id} : y=${slot.y} out of [${minY.toFixed(1)}, ${maxY.toFixed(1)}]`);
    }
  }

  // Check for overlapping slots (< 2 * radius distance)
  for (let i = 0; i < slots.length; i++) {
    for (let j = i + 1; j < slots.length; j++) {
      const a = slots[i]!;
      const b = slots[j]!;
      const dx = a.x - b.x;
      const dy = a.y - b.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < 2 * SLOT_RADIUS_VIRTUAL) {
        issues.push(
          `${key} : ${a.id} <-> ${b.id} overlap (dist=${dist.toFixed(2)}, min=${(2 * SLOT_RADIUS_VIRTUAL).toFixed(2)})`,
        );
      }
    }
  }

  console.log(`${key}: ${slots.length} slots checked`);
}

if (issues.length > 0) {
  console.log(`\n${issues.length} issue(s):`);
  for (const issue of issues) console.log('  ⚠️  ' + issue);
  process.exit(1);
} else {
  console.log('\nAll slots fit within drawable blueprint area (192x240 minus radius).');
}
