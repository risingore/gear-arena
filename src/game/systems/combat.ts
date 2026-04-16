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

import type { RoundData } from '@/data';
import { applyDefense, type LoadoutStats } from './stats';

export interface CombatWeapon {
  readonly label: string;
  readonly damage: number;
  readonly cooldownSec: number;
  /** Remaining cooldown in seconds; fires when it drops to zero. */
  timer: number;
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
}

export interface AttackEvent {
  readonly attackerName: string;
  readonly defenderName: string;
  readonly weaponLabel: string;
  readonly rawDamage: number;
  readonly finalDamage: number;
  readonly killed: boolean;
}

export interface TickResult {
  readonly attacks: AttackEvent[];
  readonly healed: number;
  readonly overdriveTriggered: boolean;
}

export const createPlayerCombatant = (
  robotName: string,
  stats: LoadoutStats
): Combatant => ({
  name: robotName,
  maxHp: stats.maxHp,
  hp: stats.maxHp,
  damageReductionFlat: stats.damageReductionFlat,
  damageReductionPct: stats.damageReductionPct,
  weapons: stats.weapons.map((w) => ({
    label: w.name,
    damage: w.damage,
    cooldownSec: w.cooldownSec,
    timer: w.cooldownSec
  })),
  overdriveMultiplier: stats.overdriveMultiplier,
  overdriveThresholdHp: stats.overdriveThresholdHp,
  overdriveActive: false,
  repairIntervalSec: stats.repairIntervalSec,
  repairAmount: stats.repairAmount,
  repairTimer: stats.repairIntervalSec,
  shieldCharges: stats.shieldCharges
});

export const createEnemyCombatant = (round: RoundData): Combatant => ({
  name: round.enemy.name,
  maxHp: round.enemy.hp,
  hp: round.enemy.hp,
  damageReductionFlat: 0,
  damageReductionPct: round.enemy.damageReductionPct,
  weapons: [
    {
      label: 'Enemy Strike',
      damage: round.enemy.damage,
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
  shieldCharges: 0
});

/** Advance time by `dtSec` seconds and return any events that fired. Mutates the combatants. */
export const tickCombatant = (
  attacker: Combatant,
  defender: Combatant,
  dtSec: number
): TickResult => {
  const attacks: AttackEvent[] = [];
  let healed = 0;
  let overdriveTriggered = false;
  if (attacker.hp <= 0 || defender.hp <= 0) {
    return { attacks, healed, overdriveTriggered };
  }

  // Overdrive activation check (HP threshold -> attack-speed boost).
  if (
    attacker.overdriveMultiplier > 0 &&
    !attacker.overdriveActive &&
    attacker.hp <= attacker.overdriveThresholdHp
  ) {
    attacker.overdriveActive = true;
    overdriveTriggered = true;
  }
  const effectiveDt =
    attacker.overdriveActive && attacker.overdriveMultiplier > 0
      ? dtSec * (1 + attacker.overdriveMultiplier)
      : dtSec;

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

  for (let i = 0; i < attacker.weapons.length; i += 1) {
    const w = attacker.weapons[i]!;
    w.timer -= effectiveDt;
    while (w.timer <= 0) {
      // Kinetic Shield: first hit is completely blocked.
      if (defender.shieldCharges > 0) {
        defender.shieldCharges -= 1;
        attacks.push({
          attackerName: attacker.name,
          defenderName: defender.name,
          weaponLabel: w.label,
          rawDamage: w.damage,
          finalDamage: 0,
          killed: false
        });
        w.timer += w.cooldownSec;
        continue;
      }
      const finalDamage = applyDefense(
        w.damage,
        defender.damageReductionFlat,
        defender.damageReductionPct
      );
      defender.hp = Math.max(0, defender.hp - finalDamage);
      const killed = defender.hp <= 0;
      attacks.push({
        attackerName: attacker.name,
        defenderName: defender.name,
        weaponLabel: w.label,
        rawDamage: w.damage,
        finalDamage,
        killed
      });
      w.timer += w.cooldownSec;
      if (killed) return { attacks, healed, overdriveTriggered };
    }
  }

  return { attacks, healed, overdriveTriggered };
};
