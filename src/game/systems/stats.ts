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
import { BALANCE } from '@/data/balance';

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
  /** Ultimate: total strike count (1 per weapon equipped, min 1). */
  readonly ultimateStrikes: number;
  /** Ultimate: damage per strike (base weapon dmg + gear multiplier). */
  readonly ultimateDamagePerStrike: number;
  /** Ultimate: total burst damage (strikes × per-strike). */
  readonly ultimateTotalDamage: number;
  /** Ultimate: gauge fill speed multiplier from engines (higher = faster). */
  readonly ultimateChargeRate: number;
  /** Ultimate: fraction of damage healed back (0 = no lifesteal). */
  readonly ultimateLifesteal: number;
  /** Ultimate: if true, ignores enemy DR. */
  readonly ultimateArmorBreak: boolean;
}


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
  let boosterCount = 0;
  let shieldCount = 0;
  let moduleCount = 0;
  let implantCount = 0;
  let soulCount = 0;
  let chargerCount = 0;

  const moduleParts: { slotId: string; key: PartKey; part: Extract<PartData, { category: 'module' }> }[] = [];

  for (const slotId of Object.keys(equipped)) {
    const key = equipped[slotId];
    if (!key) continue;
    const part = PARTS[key];
    if (!part) continue;

    switch (part.category) {
      case 'module':
        moduleParts.push({ slotId, key, part });
        moduleCount += 1;
        break;
      case 'implant':
        bonusHp += part.bonusHp;
        flatReduction += part.damageReduction;
        pctReduction += part.damageReductionPct;
        if (key === 'armor_shield') shieldCount += 1;
        implantCount += 1;
        break;
      case 'charger':
        bonusHp += part.bonusHp;
        bonusDamage += part.bonusDamage;
        pctReduction += part.bonusDamageReductionPct;
        chargerCount += 1;
        break;
      case 'booster':
        cooldownMult *= part.cooldownMultiplier;
        hpPenalty += part.hpPenalty;
        boosterCount += 1;
        break;
      case 'soul':
        if (part.effectKind === 'overdrive') overdriveMagnitude = Math.max(overdriveMagnitude, part.magnitude);
        else if (part.effectKind === 'repair') repairMagnitude = Math.max(repairMagnitude, part.magnitude);
        else if (part.effectKind === 'synergy_booster') gearSynergyMagnitude = Math.max(gearSynergyMagnitude, part.magnitude);
        soulCount += 1;
        break;
    }
  }

  // Evaluate all synergies generically.
  let synergyDamagePct = 0;
  let magnitudeMult = 1;
  const hasAllCategories = moduleCount > 0 && implantCount > 0 && chargerCount > 0 && boosterCount > 0 && soulCount > 0;
  for (const synKey of Object.keys(SYNERGIES) as (keyof typeof SYNERGIES)[]) {
    const syn = SYNERGIES[synKey];
    let triggered = false;
    switch (syn.trigger.kind) {
      case 'booster_count':  triggered = boosterCount >= syn.trigger.threshold; break;
      case 'module_count':   triggered = moduleCount >= syn.trigger.threshold; break;
      case 'implant_count':  triggered = implantCount >= syn.trigger.threshold; break;
      case 'soul_count':     triggered = soulCount >= syn.trigger.threshold; break;
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

  // Apply permanent skill bonuses (mostly ultimate-focused).
  let skillBonusHp = 0;
  let skillUltDamagePct = 0;
  let skillUltExtraStrikes = 0;
  let skillUltChargeBonus = 0;
  let skillUltLifesteal = 0;
  let skillUltArmorBreak = false;
  for (const skillId of acquiredSkills) {
    const skill = findSkillDef(skillId);
    if (!skill) continue;
    switch (skill.effectKind) {
      case 'bonus_hp': skillBonusHp += skill.magnitude; break;
      case 'ult_damage': skillUltDamagePct += skill.magnitude; break;
      case 'ult_strikes': skillUltExtraStrikes += skill.magnitude; break;
      case 'ult_charge': skillUltChargeBonus += skill.magnitude; break;
      case 'ult_lifesteal': skillUltLifesteal += skill.magnitude; break;
      case 'ult_armor_break': skillUltArmorBreak = true; break;
    }
  }

  bonusHp += skillBonusHp;

  const maxHp = Math.max(BALANCE.hpFloor, robot.baseHp + bonusHp - hpPenalty);
  const damageReductionPct = clamp(pctReduction, 0, BALANCE.damageReductionCap);

  const weapons: WeaponInstance[] = moduleParts.map(({ slotId, key, part }) => {
    const baseDmg = part.damage + bonusDamage + gearSynergyMagnitude * boosterCount;
    const effectiveDamage = Math.round(baseDmg * (1 + synergyDamagePct));
    const effectiveCooldown = (part.cooldownSec * cooldownMult) / robot.baseAttackSpeedMultiplier;
    return {
      slotId,
      partKey: key,
      name: part.name,
      damage: effectiveDamage,
      cooldownSec: Math.max(BALANCE.minCooldownSec, effectiveCooldown)
    };
  });

  // Bare-fist fallback: if no weapons equipped, the robot still punches for 1 damage.
  if (weapons.length === 0) {
    weapons.push({
      slotId: '__fist',
      partKey: 'weapon_blade' as PartKey,
      name: 'Fist',
      damage: 1,
      cooldownSec: Math.max(BALANCE.minCooldownSec, BALANCE.fistBaseCooldown / robot.baseAttackSpeedMultiplier)
    });
  }

  // Ultimate calculation: every equipped part contributes to the big hit.
  // Weapons = strikes. Gears = damage mult. Engines = charge speed. Skills = bonuses.
  const ultStrikes = Math.max(1, moduleCount) + skillUltExtraStrikes;
  const gearMult = 1 + boosterCount * BALANCE.gearUltimateMult;
  const baseDmgPerStrike = weapons.reduce((sum, w) => sum + w.damage, 0) / Math.max(1, weapons.length);
  const ultDmgPerStrike = Math.round(baseDmgPerStrike * gearMult * BALANCE.ultimateBaseMult * (1 + skillUltDamagePct));
  const ultChargeRate = 1 + chargerCount * BALANCE.engineChargeRate + skillUltChargeBonus;

  return {
    maxHp,
    damageReductionFlat: flatReduction,
    damageReductionPct,
    weapons,
    attackSpeedMultiplier: robot.baseAttackSpeedMultiplier,
    cooldownMultiplier: cooldownMult,
    overdriveThresholdHp: Math.floor(maxHp * BALANCE.overdriveTriggerRatio),
    overdriveMultiplier: overdriveMagnitude,
    repairIntervalSec: BALANCE.repairIntervalSec,
    repairAmount: repairMagnitude,
    equippedGearCount: boosterCount,
    shieldCharges: shieldCount,
    evasionChance: clamp(robot.baseEvasion ?? 0, 0, BALANCE.evasionCap),
    ultimateStrikes: ultStrikes,
    ultimateDamagePerStrike: ultDmgPerStrike,
    ultimateTotalDamage: ultStrikes * ultDmgPerStrike,
    ultimateChargeRate: ultChargeRate,
    ultimateLifesteal: skillUltLifesteal,
    ultimateArmorBreak: skillUltArmorBreak
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
