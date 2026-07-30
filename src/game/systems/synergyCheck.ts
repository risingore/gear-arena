/**
 * Shared synergy evaluation — returns names of active synergies for a
 * given equipped loadout. Used by Battle HUD (live display) and Build
 * screen (preview + tooltip).
 *
 * The Battle scene had this logic inlined as a private method; factoring
 * it here lets Build show the same information during loadout.
 */
import { PARTS, SYNERGIES, PLACEMENT_SYNERGIES } from '@/data';
import type { PartCategory, PlacementSynergyDef, RobotData } from '@/data';
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

/**
 * Returns placement synergies that are currently satisfied by the loadout.
 *
 * Semantics:
 *   - `slotPattern.slotTypes` restricts which slot types count.
 *   - `requiredCategory` (default `'any'`) filters equipped parts.
 *   - `minCount` ? matching >= minCount : "all matching slots filled"
 *     (i.e. every slot of one of the listed types in this robot is occupied
 *     by a matching category).
 */
export function getActivePlacementSynergies(
  equipped: Readonly<Record<string, EquippedEntry>>,
  robot: RobotData,
): PlacementSynergyDef[] {
  const active: PlacementSynergyDef[] = [];
  for (const syn of PLACEMENT_SYNERGIES) {
    const slotTypes = syn.slotPattern.slotTypes;
    const req = syn.slotPattern.requiredCategory ?? 'any';

    const relevantSlots = robot.slots.filter((s) => slotTypes.includes(s.slotType));
    if (relevantSlots.length === 0) continue;

    let matchCount = 0;
    for (const slot of relevantSlots) {
      const entry = equipped[slot.id];
      if (!entry?.key) continue;
      const part = PARTS[entry.key];
      if (!part) continue;
      if (req !== 'any' && part.category !== req) continue;
      matchCount += 1;
    }

    const triggered =
      syn.slotPattern.minCount !== undefined
        ? matchCount >= syn.slotPattern.minCount
        : matchCount === relevantSlots.length;

    if (triggered) active.push(syn);
  }
  return active;
}

export interface PlacementSynergyBundle {
  readonly active: readonly PlacementSynergyDef[];
  readonly hpBonus: number;
  readonly drBonus: number;
  readonly chargeSpeedMult: number;
  readonly ultDamageMult: number;
  readonly ultStrikeBonus: number;
  readonly hitChancePerSec: number;
}

/**
 * Convenience: aggregate numeric effects from all active placement
 * synergies into one bundle ready to plug into stats + combat layers.
 */
export function computePlacementSynergyEffects(
  equipped: Readonly<Record<string, EquippedEntry>>,
  robot: RobotData,
): PlacementSynergyBundle {
  const active = getActivePlacementSynergies(equipped, robot);
  let hpBonus = 0;
  let drBonus = 0;
  let chargeSpeedMult = 0;
  let ultDamageMult = 0;
  let ultStrikeBonus = 0;
  let hitChancePerSec = 0;
  for (const s of active) {
    switch (s.effect.kind) {
      case 'hp_bonus':          hpBonus += s.effect.value; break;
      case 'dr_bonus':          drBonus += s.effect.value; break;
      case 'charge_speed':      chargeSpeedMult += s.effect.value; break;
      case 'ult_damage_pct':    ultDamageMult += s.effect.value; break;
      case 'ult_strike_bonus':  ultStrikeBonus += s.effect.value; break;
      case 'hit_chance_bonus':  hitChancePerSec += s.effect.value; break;
    }
  }
  return { active, hpBonus, drBonus, chargeSpeedMult, ultDamageMult, ultStrikeBonus, hitChancePerSec };
}
