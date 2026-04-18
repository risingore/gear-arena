/**
 * SOUL STRIKE — ultimate abilities (v0.1, 2026-04-16).
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
  /** Tier 2 (awakened) name — shown when all part slots are filled. */
  readonly awakenedName?: string;
  /** Tier 2 bonus effect kind. */
  readonly awakenedBonus?: 'armor_break' | 'heal' | 'extra_strikes' | 'disable_weapons';
  /** Tier 2 bonus magnitude (heal %, extra strike count, disable seconds). */
  readonly awakenedMagnitude?: number;
}

/** Cyborg ultimates keyed by cyborg ID. */
export const ROBOT_ULTIMATES: Record<string, UltimateDef> = {
  robot_knight: {
    id: 'ult_iron_fist',
    name: 'Iron Fist',
    gaugeFillRatio: 0.4,
    effect: { kind: 'multi_strike', damageMultiplier: 2 },
    awakenedName: 'Vajra Strike',
    awakenedBonus: 'armor_break',
    awakenedMagnitude: 1
  },
  robot_goliath: {
    id: 'ult_bulldoze',
    name: 'Bulldoze',
    gaugeFillRatio: 0.35,
    effect: { kind: 'multi_strike', damageMultiplier: 3 },
    awakenedName: 'Compassion Engine',
    awakenedBonus: 'heal',
    awakenedMagnitude: 0.3
  },
  robot_striker: {
    id: 'ult_thunder_kick',
    name: 'Thunder Kick',
    gaugeFillRatio: 0.45,
    effect: { kind: 'multi_strike', damageMultiplier: 2 },
    awakenedName: 'Rakshasa Dance',
    awakenedBonus: 'extra_strikes',
    awakenedMagnitude: 3
  },
  robot_oracle: {
    id: 'ult_void_echo',
    name: 'Void Echo',
    gaugeFillRatio: 0.4,
    effect: { kind: 'system_hack', damage: 40, disableSec: 2 },
    awakenedName: 'Nirvana',
    awakenedBonus: 'disable_weapons',
    awakenedMagnitude: 3
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
