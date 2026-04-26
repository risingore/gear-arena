/**
 * Combat simulation.
 *
 * The Battle scene drives this module from its `update(time, delta)` loop via
 * `tickCombatant`. Each weapon has its own cooldown timer and fires whenever
 * it drops to zero.
 *
 * Combatants are mutated in place rather than returned via immutable copies,
 * to keep allocation pressure minimal on every frame.
 */

import { PARTS, type RoundData, type UltimateDef, type StatusEffectKind, type PartKey } from '@/data';
import { BALANCE } from '@/data/balance';
import { applyDefense, type LoadoutStats } from './stats';

export interface StatusEffect {
  readonly kind: StatusEffectKind;
  remainingDuration: number;
  readonly magnitude: number;
}

export interface CombatWeapon {
  readonly label: string;
  /** Effective damage (may be boosted by item buffs). */
  damage: number;
  /** Effective cooldown (may be modified by item buffs). */
  cooldownSec: number;
  /** Remaining cooldown in seconds; fires when it drops to zero. */
  timer: number;
  /** Part key for status effect lookup (optional). */
  readonly partKey?: PartKey;
}

export interface Combatant {
  readonly name: string;
  maxHp: number;
  hp: number;
  damageReductionFlat: number;
  damageReductionPct: number;
  weapons: CombatWeapon[];
  /** Extra attack-speed multiplier applied while Overdrive is active (0 = disabled). */
  overdriveMultiplier: number;
  overdriveThresholdHp: number;
  overdriveActive: boolean;
  repairIntervalSec: number;
  repairAmount: number;
  repairTimer: number;
  /** Kinetic Shield: blocks the first incoming hit completely (one-time). */
  shieldCharges: number;
  /** Ultimate ability (null = none). */
  ultimate: UltimateDef | null;
  /** Damage accumulated toward ultimate gauge (0-1 ratio of maxHp). */
  ultimateGauge: number;
  /** Whether ultimate has been used this battle. */
  ultimateUsed: boolean;
  /** Remaining duration of timed ultimate effects (seconds). */
  ultimateEffectTimer: number;
  /** Temporary DR boost from fortress ultimate. */
  tempDrBoost: number;
  /** Temporary speed multiplier from speed-burst ultimate. */
  tempSpeedMult: number;
  /** Remaining weapon-disable time from system-hack (seconds). */
  weaponDisableTimer: number;
  /** If true, ultimate fires automatically when gauge is full (enemies). Player = false. */
  autoFireUltimate: boolean;
  /** Number of strikes in the ultimate burst (from equipped weapons). */
  ultimateStrikes: number;
  /** Damage per ultimate strike (computed from loadout). */
  ultimateDmgPerStrike: number;
  /** Gauge charge rate multiplier (from engines). */
  ultimateChargeRate: number;
  /** Fraction of ultimate damage healed back. */
  ultimateLifesteal: number;
  /** If true, ultimate ignores enemy DR. */
  ultimateArmorBreak: boolean;
  /** Whether all slots filled — triggers Tier 2 awakened ultimate. */
  isAwakened: boolean;
  /** Active status effects on this combatant. */
  statusEffects: StatusEffect[];
  /** Evasion chance (0-0.3). */
  evasionChance: number;
  /** Consecutive hit counter for combo damage bonus. */
  comboCount: number;
}

export interface AttackEvent {
  readonly attackerName: string;
  readonly defenderName: string;
  readonly weaponLabel: string;
  readonly rawDamage: number;
  readonly finalDamage: number;
  readonly killed: boolean;
  readonly combo: number;
}

export interface TickResult {
  readonly attacks: AttackEvent[];
  readonly healed: number;
  readonly overdriveTriggered: boolean;
  readonly ultimateFired: string | null;
}

export const createPlayerCombatant = (
  robotName: string,
  stats: LoadoutStats,
  ultimate: UltimateDef | null = null
): Combatant => {
  // Apply the cosmetic ×100 stat scale at the combatant boundary so every
  // HP / damage / flat-DR / repair value the rest of the engine sees is
  // already in "machine-grade" units. Ratio-based fields (% DR, lifesteal,
  // ★ multipliers) are left untouched.
  const scale = BALANCE.statScale;
  return {
    name: robotName,
    maxHp: stats.maxHp * scale,
    hp: stats.maxHp * scale,
    damageReductionFlat: stats.damageReductionFlat * scale,
    damageReductionPct: stats.damageReductionPct,
    // Player has no auto-attacks. Weapons data is used for ultimate calculation only.
    weapons: stats.weapons.map((w) => ({
      label: w.name,
      damage: w.damage * scale,
      cooldownSec: w.cooldownSec,
      timer: w.cooldownSec,
      partKey: w.partKey
    })),
    overdriveMultiplier: stats.overdriveMultiplier,
    overdriveThresholdHp: stats.overdriveThresholdHp * scale,
    overdriveActive: false,
    repairIntervalSec: stats.repairIntervalSec,
    repairAmount: stats.repairAmount * scale,
    repairTimer: stats.repairIntervalSec,
    shieldCharges: stats.shieldCharges,
    ultimate,
    ultimateGauge: 0,
    ultimateUsed: false,
    ultimateEffectTimer: 0,
    tempDrBoost: 0,
    tempSpeedMult: 1,
    weaponDisableTimer: 0,
    statusEffects: [],
    evasionChance: stats.evasionChance,
    comboCount: 0,
    autoFireUltimate: false,
    ultimateStrikes: stats.ultimateStrikes,
    ultimateDmgPerStrike: stats.ultimateDamagePerStrike * scale,
    ultimateChargeRate: stats.ultimateChargeRate,
    ultimateLifesteal: stats.ultimateLifesteal,
    ultimateArmorBreak: stats.ultimateArmorBreak,
    isAwakened: stats.isAwakened
  };
};

export const createEnemyCombatant = (
  round: RoundData,
  ultimate: UltimateDef | null = null
): Combatant => ({
  name: round.enemy.name,
  // Same statScale as createPlayerCombatant — both sides scale together
  // so HP/DMG ratios stay invariant.
  maxHp: round.enemy.hp * BALANCE.statScale,
  hp: round.enemy.hp * BALANCE.statScale,
  damageReductionFlat: 0,
  damageReductionPct: round.enemy.damageReductionPct,
  weapons: [
    {
      label: 'Enemy Strike',
      damage: round.enemy.damage * BALANCE.statScale,
      cooldownSec: round.enemy.cooldownSec,
      timer: round.enemy.cooldownSec
    }
  ],
  overdriveMultiplier: 0,
  overdriveThresholdHp: 0,
  overdriveActive: false,
  repairIntervalSec: 0,
  repairAmount: 0,
  repairTimer: 0,
  shieldCharges: 0,
  ultimate,
  ultimateGauge: 0,
  ultimateUsed: false,
  ultimateEffectTimer: 0,
  tempDrBoost: 0,
  tempSpeedMult: 1,
  weaponDisableTimer: 0,
  statusEffects: [],
  evasionChance: 0,
  comboCount: 0,
  autoFireUltimate: true,
  ultimateStrikes: 1,
  ultimateDmgPerStrike: 0,
  ultimateChargeRate: 1,
  ultimateLifesteal: 0,
  ultimateArmorBreak: false,
  isAwakened: false
});


/** Roll for and apply a weapon's status effect on the defender. */
const tryApplyStatusEffect = (weapon: CombatWeapon, defender: Combatant): void => {
  if (!weapon.partKey) return;
  const partDef = PARTS[weapon.partKey];
  if (!partDef || partDef.category !== 'module') return;
  const weaponDef = partDef as import('@/data').WeaponPart;
  if (!weaponDef.statusEffect) return;
  const se = weaponDef.statusEffect;
  if (Math.random() >= se.chance) return;
  // Replace existing effect of the same kind (refresh duration).
  const idx = defender.statusEffects.findIndex((e) => e.kind === se.kind);
  const effect: StatusEffect = { kind: se.kind, remainingDuration: se.durationSec, magnitude: se.magnitude };
  if (idx >= 0) {
    defender.statusEffects[idx] = effect;
  } else {
    defender.statusEffects.push(effect);
  }
};

/** Apply damage to defender, filling their ultimate gauge. */
const dealDamage = (
  attacker: Combatant,
  defender: Combatant,
  weapon: CombatWeapon,
  attacks: AttackEvent[],
  damageMultiplier = 1
): boolean => {
  // Evasion check.
  if (defender.evasionChance > 0 && Math.random() < defender.evasionChance) {
    attacks.push({ attackerName: attacker.name, defenderName: defender.name, weaponLabel: 'DODGE', rawDamage: 0, finalDamage: 0, killed: false, combo: attacker.comboCount });
    attacker.comboCount = 0;
    return false;
  }
  if (defender.shieldCharges > 0) {
    defender.shieldCharges -= 1;
    attacker.comboCount += 1;
    attacks.push({ attackerName: attacker.name, defenderName: defender.name, weaponLabel: weapon.label, rawDamage: weapon.damage, finalDamage: 0, killed: false, combo: attacker.comboCount });
    return false;
  }
  // Combo bonus.
  const comboBonus = 1 + Math.min(attacker.comboCount * BALANCE.comboBonusPerHit, BALANCE.comboBonusCap);
  const raw = Math.round(weapon.damage * damageMultiplier * comboBonus);
  // Freeze speed reduction is handled in tick; here we only compute damage.
  const effectiveDr = defender.damageReductionPct + defender.tempDrBoost;
  const finalDamage = applyDefense(raw, defender.damageReductionFlat, Math.min(effectiveDr, BALANCE.damageReductionCapInFormula));
  defender.hp = Math.max(0, defender.hp - finalDamage);
  // Fill defender's ultimate gauge based on damage taken.
  if (defender.ultimate && !defender.ultimateUsed) {
    defender.ultimateGauge += (finalDamage / defender.maxHp) * defender.ultimateChargeRate;
  }
  attacker.comboCount += 1;
  // Roll for status effect.
  tryApplyStatusEffect(weapon, defender);
  const killed = defender.hp <= 0;
  attacks.push({ attackerName: attacker.name, defenderName: defender.name, weaponLabel: weapon.label, rawDamage: raw, finalDamage, killed, combo: attacker.comboCount });
  return killed;
};

/** Fire the attacker's ultimate ability against the defender. */
export const fireUltimate = (
  attacker: Combatant,
  defender: Combatant,
  attacks: AttackEvent[]
): void => {
  const ult = attacker.ultimate!;
  attacker.ultimateUsed = false; // Can fire again once gauge refills
  attacker.ultimateGauge = 0;

  // Player ultimate: burst of strikes computed from equipped parts.
  if (!attacker.autoFireUltimate && attacker.ultimateStrikes > 0 && attacker.ultimateDmgPerStrike > 0) {
    // Tier 2 awakened bonuses (all slots filled).
    let awakenedStrikes = 0;
    let awakenedArmorBreak = attacker.ultimateArmorBreak;
    let awakenedHealPct = 0;
    let awakenedDisableSec = 0;
    if (attacker.isAwakened && ult.awakenedBonus) {
      switch (ult.awakenedBonus) {
        case 'armor_break': awakenedArmorBreak = true; break;
        case 'heal': awakenedHealPct = ult.awakenedMagnitude ?? 0; break;
        case 'extra_strikes': awakenedStrikes = ult.awakenedMagnitude ?? 0; break;
        case 'disable_weapons': awakenedDisableSec = ult.awakenedMagnitude ?? 0; break;
      }
    }
    const totalStrikes = attacker.ultimateStrikes + awakenedStrikes;

    // Temporarily remove defender DR if armor break is active.
    const savedDr = defender.damageReductionPct;
    const savedFlat = defender.damageReductionFlat;
    if (awakenedArmorBreak) {
      defender.damageReductionPct = 0;
      defender.damageReductionFlat = 0;
    }
    let totalDealt = 0;
    for (let i = 0; i < totalStrikes; i += 1) {
      const sourceWeapon = i < attacker.weapons.length ? attacker.weapons[i]! : undefined;
      const strikeWeapon: CombatWeapon = {
        label: sourceWeapon?.label ?? ult.name,
        damage: attacker.ultimateDmgPerStrike,
        cooldownSec: 999,
        timer: 999,
        partKey: sourceWeapon?.partKey
      };
      const hpBefore = defender.hp;
      dealDamage(attacker, defender, strikeWeapon, attacks);
      totalDealt += hpBefore - defender.hp;
      if (defender.hp <= 0) break;
    }
    // Restore defender DR.
    if (awakenedArmorBreak) {
      defender.damageReductionPct = savedDr;
      defender.damageReductionFlat = savedFlat;
    }
    // Lifesteal: heal attacker based on damage dealt.
    const totalLifesteal = attacker.ultimateLifesteal + awakenedHealPct;
    if (totalLifesteal > 0 && totalDealt > 0) {
      const heal = Math.floor(totalDealt * totalLifesteal);
      attacker.hp = Math.min(attacker.maxHp, attacker.hp + heal);
    }
    // Awakened disable: freeze enemy weapons.
    if (awakenedDisableSec > 0) {
      defender.weaponDisableTimer = Math.max(defender.weaponDisableTimer, awakenedDisableSec);
    }
    return;
  }

  // Enemy ultimates: use the effect-based system.
  switch (ult.effect.kind) {
    case 'multi_strike':
      for (const w of attacker.weapons) {
        dealDamage(attacker, defender, w, attacks, ult.effect.damageMultiplier);
        if (defender.hp <= 0) return;
      }
      break;
    case 'fortress': {
      const healAmt = Math.floor(attacker.maxHp * ult.effect.healPct);
      attacker.hp = Math.min(attacker.maxHp, attacker.hp + healAmt);
      attacker.tempDrBoost = ult.effect.drBoost;
      attacker.ultimateEffectTimer = ult.effect.durationSec;
      break;
    }
    case 'speed_burst':
      attacker.tempSpeedMult = ult.effect.speedMultiplier;
      attacker.ultimateEffectTimer = ult.effect.durationSec;
      break;
    case 'system_hack': {
      const hackDmg: CombatWeapon = { label: ult.name, damage: ult.effect.damage, cooldownSec: 999, timer: 999 };
      dealDamage(attacker, defender, hackDmg, attacks);
      defender.weaponDisableTimer = ult.effect.disableSec;
      break;
    }
  }
};

/** Tick status effects: apply burn/poison damage and expire durations. */
const tickStatusEffects = (target: Combatant, dtSec: number): void => {
  for (let i = target.statusEffects.length - 1; i >= 0; i -= 1) {
    const se = target.statusEffects[i]!;
    if (se.kind === 'burn' || se.kind === 'poison') {
      target.hp = Math.max(0, target.hp - se.magnitude * dtSec);
    }
    se.remainingDuration -= dtSec;
    if (se.remainingDuration <= 0) {
      target.statusEffects.splice(i, 1);
    }
  }
};

/** Returns a speed multiplier reduction from active freeze effects (stacks replaced, not additive). */
const getFreezeSlowdown = (target: Combatant): number => {
  for (const se of target.statusEffects) {
    if (se.kind === 'freeze') return 1 - se.magnitude;
  }
  return 1;
};

/** Advance time by `dtSec` seconds and return any events that fired. Mutates the combatants. */
export const tickCombatant = (
  attacker: Combatant,
  defender: Combatant,
  dtSec: number
): TickResult => {
  const attacks: AttackEvent[] = [];
  let healed = 0;
  let overdriveTriggered = false;
  let ultimateFired: string | null = null;
  if (attacker.hp <= 0 || defender.hp <= 0) {
    return { attacks, healed, overdriveTriggered, ultimateFired };
  }

  // Tick status effects on attacker (burn/poison damage, freeze slowdown, expiry).
  tickStatusEffects(attacker, dtSec);
  if (attacker.hp <= 0) return { attacks, healed, overdriveTriggered, ultimateFired };

  // Tick down timed ultimate effects.
  if (attacker.ultimateEffectTimer > 0) {
    attacker.ultimateEffectTimer -= dtSec;
    if (attacker.ultimateEffectTimer <= 0) {
      attacker.tempDrBoost = 0;
      attacker.tempSpeedMult = 1;
    }
  }
  if (attacker.weaponDisableTimer > 0) {
    attacker.weaponDisableTimer -= dtSec;
    if (attacker.weaponDisableTimer > 0) {
      return { attacks, healed, overdriveTriggered, ultimateFired };
    }
  }

  // Time-based fill uses raw dtSec (not effectiveDt) so the gauge feels
  // like a steady tempo meter — independent of freeze / Overdrive / temp
  // speed mods. The cap prevents unbounded float drift while the player
  // sits on a full gauge waiting to fire (autoFireUltimate=false).
  if (attacker.ultimate && !attacker.ultimateUsed && attacker.ultimateGauge < attacker.ultimate.gaugeFillRatio) {
    attacker.ultimateGauge += BALANCE.ultimateGaugeFillPerSec * dtSec * attacker.ultimateChargeRate;
  }

  // Check ultimate gauge — enemies auto-fire; player requires manual trigger via Battle scene.
  if (attacker.autoFireUltimate && attacker.ultimate && !attacker.ultimateUsed && attacker.ultimateGauge >= attacker.ultimate.gaugeFillRatio) {
    ultimateFired = attacker.ultimate.name;
    fireUltimate(attacker, defender, attacks);
    if (defender.hp <= 0) return { attacks, healed, overdriveTriggered, ultimateFired };
  }

  // Overdrive activation check.
  if (
    attacker.overdriveMultiplier > 0 &&
    !attacker.overdriveActive &&
    attacker.hp <= attacker.overdriveThresholdHp
  ) {
    attacker.overdriveActive = true;
    overdriveTriggered = true;
  }

  let effectiveDt = dtSec;
  if (attacker.overdriveActive && attacker.overdriveMultiplier > 0) {
    effectiveDt *= (1 + attacker.overdriveMultiplier);
  }
  effectiveDt *= attacker.tempSpeedMult;
  // Apply freeze slowdown to attacker's effective tick speed.
  effectiveDt *= getFreezeSlowdown(attacker);

  // Repair Kit healing.
  if (attacker.repairIntervalSec > 0 && attacker.repairAmount > 0) {
    attacker.repairTimer -= dtSec;
    if (attacker.repairTimer <= 0) {
      const before = attacker.hp;
      attacker.hp = Math.min(attacker.maxHp, attacker.hp + attacker.repairAmount);
      healed = attacker.hp - before;
      attacker.repairTimer += attacker.repairIntervalSec;
    }
  }

  // Player has no normal attacks — only the ultimate.
  // Enemies auto-attack normally.
  let attackedThisTick = false;
  if (attacker.autoFireUltimate) {
    for (let i = 0; i < attacker.weapons.length; i += 1) {
      const w = attacker.weapons[i]!;
      w.timer -= effectiveDt;
      while (w.timer <= 0) {
        attackedThisTick = true;
        const killed = dealDamage(attacker, defender, w, attacks);
        w.timer += w.cooldownSec;
        if (killed) return { attacks, healed, overdriveTriggered, ultimateFired };
      }
    }
  }
  // Reset combo if no attack fired this tick.
  if (!attackedThisTick) {
    attacker.comboCount = 0;
  }

  return { attacks, healed, overdriveTriggered, ultimateFired };
};
