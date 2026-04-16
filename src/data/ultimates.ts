/**
 * GEAR ARENA — ultimate abilities (v0.1, 2026-04-16).
 *
 * Each robot and boss has a unique ultimate that fires automatically
 * when the gauge fills. Gauge fills by taking damage.
 * One use per battle.
 */

export type UltimateEffect =
  | { readonly kind: 'multi_strike'; readonly damageMultiplier: number }
  | { readonly kind: 'fortress'; readonly healPct: number; readonly drBoost: number; readonly durationSec: number }
  | { readonly kind: 'speed_burst'; readonly speedMultiplier: number; readonly durationSec: number }
  | { readonly kind: 'system_hack'; readonly damage: number; readonly disableSec: number };

export interface UltimateDef {
  readonly id: string;
  readonly name: string;
  /** Damage required to fill gauge (as fraction of maxHp). */
  readonly gaugeFillRatio: number;
  readonly effect: UltimateEffect;
}

/** Robot ultimates keyed by robot ID. */
export const ROBOT_ULTIMATES: Record<string, UltimateDef> = {
  robot_knight: {
    id: 'ult_blade_storm',
    name: 'Blade Storm',
    gaugeFillRatio: 0.4,
    effect: { kind: 'multi_strike', damageMultiplier: 2 }
  },
  robot_goliath: {
    id: 'ult_fortress_mode',
    name: 'Fortress Mode',
    gaugeFillRatio: 0.35,
    effect: { kind: 'fortress', healPct: 0.3, drBoost: 0.5, durationSec: 5 }
  },
  robot_striker: {
    id: 'ult_overdrive_burst',
    name: 'Overdrive Burst',
    gaugeFillRatio: 0.45,
    effect: { kind: 'speed_burst', speedMultiplier: 3, durationSec: 3 }
  },
  robot_oracle: {
    id: 'ult_system_hack',
    name: 'System Hack',
    gaugeFillRatio: 0.4,
    effect: { kind: 'system_hack', damage: 40, disableSec: 2 }
  }
};

/** Enemy ultimates by enemy category. */
export const ENEMY_ULTIMATES: Record<string, UltimateDef> = {
  midBoss: {
    id: 'ult_boss_rage',
    name: 'Boss Rage',
    gaugeFillRatio: 0.5,
    effect: { kind: 'speed_burst', speedMultiplier: 2, durationSec: 3 }
  },
  bigBoss: {
    id: 'ult_titan_strike',
    name: 'Titan Strike',
    gaugeFillRatio: 0.4,
    effect: { kind: 'multi_strike', damageMultiplier: 3 }
  },
  super: {
    id: 'ult_extinction',
    name: 'Extinction Protocol',
    gaugeFillRatio: 0.3,
    effect: { kind: 'system_hack', damage: 80, disableSec: 3 }
  }
};
