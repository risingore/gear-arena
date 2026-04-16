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
  findSkillDef,
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
  /** Number of Kinetic Shield charges (first N hits are blocked). */
  readonly shieldCharges: number;
  /** Evasion chance (0-0.3 cap). */
  readonly evasionChance: number;
}

const HP_FLOOR = 1;
const DR_PCT_CAP = 0.8;
const EVASION_CAP = 0.3;
/** HP ratio at which Overdrive triggers (balance knob). */
const OVERDRIVE_HP_RATIO = 0.3;
/** Repair Kit interval (seconds). */
const REPAIR_INTERVAL_SEC = 5;

const clamp = (value: number, min: number, max: number): number =>
  Math.max(min, Math.min(max, value));

export const computeLoadoutStats = (
  robot: RobotData,
  equipped: Readonly<Record<string, PartKey>>,
  acquiredSkills: readonly string[] = []
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
  let shieldCount = 0;
  let weaponCount = 0;
  let armorCount = 0;
  let specialCount = 0;
  let engineCount = 0;

  const weaponParts: { slotId: string; key: PartKey; part: Extract<PartData, { category: 'weapon' }> }[] = [];

  for (const slotId of Object.keys(equipped)) {
    const key = equipped[slotId];
    if (!key) continue;
    const part = PARTS[key];
    if (!part) continue;

    switch (part.category) {
      case 'weapon':
        weaponParts.push({ slotId, key, part });
        weaponCount += 1;
        break;
      case 'armor':
        bonusHp += part.bonusHp;
        flatReduction += part.damageReduction;
        pctReduction += part.damageReductionPct;
        if (key === 'armor_shield') shieldCount += 1;
        armorCount += 1;
        break;
      case 'engine':
        bonusHp += part.bonusHp;
        bonusDamage += part.bonusDamage;
        pctReduction += part.bonusDamageReductionPct;
        engineCount += 1;
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
        specialCount += 1;
        break;
    }
  }

  // Evaluate all synergies generically.
  let synergyDamagePct = 0;
  let magnitudeMult = 1;
  const hasAllCategories = weaponCount > 0 && armorCount > 0 && engineCount > 0 && gearCount > 0 && specialCount > 0;
  for (const synKey of Object.keys(SYNERGIES) as (keyof typeof SYNERGIES)[]) {
    const syn = SYNERGIES[synKey];
    let triggered = false;
    switch (syn.trigger.kind) {
      case 'gear_count':     triggered = gearCount >= syn.trigger.threshold; break;
      case 'weapon_count':   triggered = weaponCount >= syn.trigger.threshold; break;
      case 'armor_count':    triggered = armorCount >= syn.trigger.threshold; break;
      case 'special_count':  triggered = specialCount >= syn.trigger.threshold; break;
      case 'all_categories': triggered = hasAllCategories; break;
      case 'category_pair': {
        let hasA = false;
        let hasB = false;
        for (const p of equippedParts) {
          if (p.category === syn.trigger.a) hasA = true;
          if (p.category === syn.trigger.b) hasB = true;
        }
        triggered = hasA && hasB;
        break;
      }
    }
    if (!triggered) continue;
    switch (syn.effect.kind) {
      case 'cooldown_mult':   cooldownMult *= syn.effect.multiplier; break;
      case 'hp_bonus':        bonusHp += syn.effect.amount; break;
      case 'damage_pct':      synergyDamagePct += syn.effect.multiplier; break;
      case 'magnitude_mult':  magnitudeMult *= syn.effect.multiplier; break;
    }
  }

  // Apply magnitude multiplier from synergies (e.g. Special Amp).
  overdriveMagnitude *= magnitudeMult;
  repairMagnitude *= magnitudeMult;
  gearSynergyMagnitude *= magnitudeMult;

  // Apply permanent skill bonuses.
  let skillBonusHp = 0;
  let skillBonusDamage = 0;
  let skillCooldownMult = 1;
  let skillDrPct = 0;
  let skillRepairAmount = 0;
  let skillOverdriveBoost = 0;
  for (const skillId of acquiredSkills) {
    const skill = findSkillDef(skillId);
    if (!skill) continue;
    switch (skill.effectKind) {
      case 'bonus_hp': skillBonusHp += skill.magnitude; break;
      case 'bonus_damage': skillBonusDamage += skill.magnitude; break;
      case 'cooldown_mult': skillCooldownMult *= skill.magnitude; break;
      case 'damage_reduction_pct': skillDrPct += skill.magnitude; break;
      case 'repair': skillRepairAmount += skill.magnitude; break;
      case 'overdrive_boost': skillOverdriveBoost += skill.magnitude; break;
    }
  }

  bonusHp += skillBonusHp;
  bonusDamage += skillBonusDamage;
  cooldownMult *= skillCooldownMult;
  pctReduction += skillDrPct;
  repairMagnitude += skillRepairAmount;
  overdriveMagnitude += skillOverdriveBoost;

  const maxHp = Math.max(HP_FLOOR, robot.baseHp + bonusHp - hpPenalty);
  const damageReductionPct = clamp(pctReduction, 0, DR_PCT_CAP);

  const weapons: WeaponInstance[] = weaponParts.map(({ slotId, key, part }) => {
    const baseDmg = part.damage + bonusDamage + gearSynergyMagnitude * gearCount;
    const effectiveDamage = Math.round(baseDmg * (1 + synergyDamagePct));
    const effectiveCooldown = (part.cooldownSec * cooldownMult) / robot.baseAttackSpeedMultiplier;
    return {
      slotId,
      partKey: key,
      name: part.name,
      damage: effectiveDamage,
      cooldownSec: Math.max(0.2, effectiveCooldown)
    };
  });

  // Bare-fist fallback: if no weapons equipped, the robot still punches for 1 damage.
  if (weapons.length === 0) {
    weapons.push({
      slotId: '__fist',
      partKey: 'weapon_blade' as PartKey,
      name: 'Fist',
      damage: 1,
      cooldownSec: Math.max(0.2, 2.0 / robot.baseAttackSpeedMultiplier)
    });
  }

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
    equippedGearCount: gearCount,
    shieldCharges: shieldCount,
    evasionChance: clamp(robot.baseEvasion ?? 0, 0, EVASION_CAP)
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
