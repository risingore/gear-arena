/**
 * Loadout aggregation.
 *
 * Takes a robot plus its equipped parts and returns the derived stats the
 * combat layer needs. Every magic number in this file is either a cap,
 * a floor, or an explicit ratio; the underlying balance values come from
 * `src/data/*.ts`.
 */

import {
  PARTS,
  SYNERGIES,
  type PartKey,
  type PartData,
  type RobotData
} from '@/data';

export interface WeaponInstance {
  readonly slotId: string;
  readonly partKey: PartKey;
  readonly name: string;
  readonly damage: number;
  readonly cooldownSec: number;
}

export interface LoadoutStats {
  readonly maxHp: number;
  readonly damageReductionFlat: number;
  readonly damageReductionPct: number;
  readonly weapons: readonly WeaponInstance[];
  readonly attackSpeedMultiplier: number;
  readonly cooldownMultiplier: number;
  readonly overdriveThresholdHp: number;
  readonly overdriveMultiplier: number;
  readonly repairIntervalSec: number;
  readonly repairAmount: number;
  readonly equippedGearCount: number;
}

const HP_FLOOR = 1;
const DR_PCT_CAP = 0.8;
/** HP ratio at which Overdrive triggers (balance knob). */
const OVERDRIVE_HP_RATIO = 0.3;
/** Repair Kit interval (seconds). */
const REPAIR_INTERVAL_SEC = 5;

const clamp = (value: number, min: number, max: number): number =>
  Math.max(min, Math.min(max, value));

export const computeLoadoutStats = (
  robot: RobotData,
  equipped: Readonly<Record<string, PartKey>>
): LoadoutStats => {
  const equippedParts: PartData[] = [];
  for (const slotId of Object.keys(equipped)) {
    const key = equipped[slotId];
    if (!key) continue;
    const part = PARTS[key];
    if (part) equippedParts.push(part);
  }

  let bonusHp = 0;
  let hpPenalty = 0;
  let flatReduction = 0;
  let pctReduction = robot.baseDamageReductionPct;
  let bonusDamage = 0;
  let cooldownMult = 1;
  let overdriveMagnitude = 0;
  let repairMagnitude = 0;
  let gearSynergyMagnitude = 0;
  let gearCount = 0;

  const weaponParts: { slotId: string; key: PartKey; part: Extract<PartData, { category: 'weapon' }> }[] = [];

  for (const slotId of Object.keys(equipped)) {
    const key = equipped[slotId];
    if (!key) continue;
    const part = PARTS[key];
    if (!part) continue;

    switch (part.category) {
      case 'weapon':
        weaponParts.push({ slotId, key, part });
        break;
      case 'armor':
        bonusHp += part.bonusHp;
        flatReduction += part.damageReduction;
        pctReduction += part.damageReductionPct;
        break;
      case 'engine':
        bonusHp += part.bonusHp;
        bonusDamage += part.bonusDamage;
        pctReduction += part.bonusDamageReductionPct;
        break;
      case 'gear':
        cooldownMult *= part.cooldownMultiplier;
        hpPenalty += part.hpPenalty;
        gearCount += 1;
        break;
      case 'special':
        if (part.effectKind === 'overdrive') overdriveMagnitude = Math.max(overdriveMagnitude, part.magnitude);
        else if (part.effectKind === 'repair') repairMagnitude = Math.max(repairMagnitude, part.magnitude);
        else if (part.effectKind === 'synergy_gear') gearSynergyMagnitude = Math.max(gearSynergyMagnitude, part.magnitude);
        break;
    }
  }

  // Gear Sync synergy: when gears >= threshold, apply the extra cooldown multiplier.
  const gearSyncSyn = SYNERGIES.syn_gear_sync;
  if (gearSyncSyn.trigger.kind === 'gear_count' && gearCount >= gearSyncSyn.trigger.threshold) {
    if (gearSyncSyn.effect.kind === 'cooldown_mult') {
      cooldownMult *= gearSyncSyn.effect.multiplier;
    }
  }

  const maxHp = Math.max(HP_FLOOR, robot.baseHp + bonusHp - hpPenalty);
  const damageReductionPct = clamp(pctReduction, 0, DR_PCT_CAP);

  const weapons: WeaponInstance[] = weaponParts.map(({ slotId, key, part }) => {
    const effectiveDamage = part.damage + bonusDamage + gearSynergyMagnitude * gearCount;
    const effectiveCooldown = (part.cooldownSec * cooldownMult) / robot.baseAttackSpeedMultiplier;
    return {
      slotId,
      partKey: key,
      name: part.name,
      damage: effectiveDamage,
      cooldownSec: Math.max(0.2, effectiveCooldown)
    };
  });

  return {
    maxHp,
    damageReductionFlat: flatReduction,
    damageReductionPct,
    weapons,
    attackSpeedMultiplier: robot.baseAttackSpeedMultiplier,
    cooldownMultiplier: cooldownMult,
    overdriveThresholdHp: Math.floor(maxHp * OVERDRIVE_HP_RATIO),
    overdriveMultiplier: overdriveMagnitude,
    repairIntervalSec: REPAIR_INTERVAL_SEC,
    repairAmount: repairMagnitude,
    equippedGearCount: gearCount
  };
};

/** Apply flat reduction first, then percentage reduction, with a 1 damage floor. */
export const applyDefense = (
  rawDamage: number,
  flat: number,
  pct: number
): number => {
  const afterFlat = Math.max(0, rawDamage - flat);
  const afterPct = afterFlat * (1 - pct);
  return Math.max(1, Math.round(afterPct));
};
