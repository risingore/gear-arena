/**
 * Shared synergy evaluation — returns names of active synergies for a
 * given equipped loadout. Used by Battle HUD (live display) and Build
 * screen (preview + tooltip).
 *
 * The Battle scene had this logic inlined as a private method; factoring
 * it here lets Build show the same information during loadout.
 */
import { PARTS, SYNERGIES } from '@/data';
import type { PartCategory } from '@/data';
import type { EquippedEntry } from './runState';

export interface SynergyStatus {
  readonly id: string;
  readonly name: string;
  readonly description: string;
  readonly active: boolean;
}

export function getSynergyStatuses(
  equipped: Readonly<Record<string, EquippedEntry>>,
): SynergyStatus[] {
  const counts: Record<PartCategory, number> = {
    module: 0, implant: 0, charger: 0, booster: 0, soul: 0,
  };
  const categories = new Set<PartCategory>();
  for (const entry of Object.values(equipped)) {
    if (!entry?.key) continue;
    const part = PARTS[entry.key];
    if (!part) continue;
    counts[part.category] += 1;
    categories.add(part.category);
  }
  const hasAll = categories.size >= 5;

  const result: SynergyStatus[] = [];
  for (const synKey of Object.keys(SYNERGIES) as (keyof typeof SYNERGIES)[]) {
    const syn = SYNERGIES[synKey];
    let triggered = false;
    switch (syn.trigger.kind) {
      case 'booster_count': triggered = counts.booster >= syn.trigger.threshold; break;
      case 'module_count':  triggered = counts.module  >= syn.trigger.threshold; break;
      case 'implant_count': triggered = counts.implant >= syn.trigger.threshold; break;
      case 'soul_count':    triggered = counts.soul    >= syn.trigger.threshold; break;
      case 'all_categories': triggered = hasAll; break;
      case 'category_pair': {
        let a = false, b = false;
        for (const entry of Object.values(equipped)) {
          if (!entry?.key) continue;
          const p = PARTS[entry.key];
          if (!p) continue;
          if (p.category === syn.trigger.a) a = true;
          if (p.category === syn.trigger.b) b = true;
        }
        triggered = a && b;
        break;
      }
    }
    result.push({
      id: syn.id,
      name: syn.name,
      description: syn.description,
      active: triggered,
    });
  }
  return result;
}

export function getActiveSynergyNames(
  equipped: Readonly<Record<string, EquippedEntry>>,
): string[] {
  return getSynergyStatuses(equipped).filter((s) => s.active).map((s) => s.name);
}
