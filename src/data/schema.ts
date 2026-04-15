/**
 * GEAR ARENA — data layer type definitions (single source of truth).
 *
 * This file contains types only. Concrete values live in sibling files
 * (`parts.ts`, `robots.ts`, `rounds.ts`, `economy.ts`, `synergies.ts`) and are
 * validated through these types via `as const satisfies`.
 *
 * Design: template literal types + discriminated unions + const satisfies.
 *   - zero dependencies (pure TypeScript)
 *   - ID naming is enforced at compile time
 *   - category-specific fields are constrained per variant
 *   - HMR-friendly; IDE surfaces mistakes inline on save
 *
 * Heika edits values in the sibling files. This schema file is owned by Kima
 * and is only changed when the game's data shape genuinely needs to evolve.
 */

// =============================================================================
// Template literal types: enforce ID naming conventions
// =============================================================================
//
// Design note: an earlier version used branded symbol types to keep different
// ID kinds from being mixed up. That broke hand-authored string literals in
// the data files, so it was dropped in favor of template literal types only.
// Preventing cross-ID contamination statically can be revisited in Phase 7.

export type PartId =
  | `weapon_${string}`
  | `armor_${string}`
  | `engine_${string}`
  | `gear_${string}`
  | `spec_${string}`;

export type RobotId = `robot_${string}`;
export type RoundId = `round_${string}`;
export type SynergyId = `syn_${string}`;
/** Slot IDs use free-form naming per robot. */
export type SlotId = string;

// =============================================================================
// Enum-ish string literal unions
// =============================================================================

export type SlotType =
  | 'head'
  | 'chest'
  | 'arm_l'
  | 'arm_r'
  | 'legs_l'
  | 'legs_r'
  | 'back';

export type PartCategory = 'weapon' | 'armor' | 'engine' | 'gear' | 'special';

export type RobotArchetype = 'balanced' | 'heavy' | 'speed' | 'tech';

export type WeaponRange = 'melee' | 'mid' | 'long';

// =============================================================================
// Discriminated union: each part category carries its own fields
// =============================================================================

interface PartBase {
  readonly id: PartId;
  readonly name: string;
  readonly description: string;
  readonly price: number;
  readonly allowedSlots: readonly SlotType[];
}

export interface WeaponPart extends PartBase {
  readonly category: 'weapon';
  readonly cooldownSec: number;
  readonly damage: number;
  readonly range: WeaponRange;
}

export interface ArmorPart extends PartBase {
  readonly category: 'armor';
  /** Flat reduction applied before the percentage reduction. */
  readonly damageReduction: number;
  /** Percentage reduction in [0, 1]. */
  readonly damageReductionPct: number;
  readonly bonusHp: number;
}

export interface EnginePart extends PartBase {
  readonly category: 'engine';
  readonly bonusHp: number;
  readonly bonusDamage: number;
  readonly bonusDamageReductionPct: number;
}

export interface GearPart extends PartBase {
  readonly category: 'gear';
  /** Multiplier applied to every weapon cooldown (0.9 = 10% faster). */
  readonly cooldownMultiplier: number;
  readonly hpPenalty: number;
}

export interface SpecialPart extends PartBase {
  readonly category: 'special';
  readonly effectKind: 'overdrive' | 'repair' | 'synergy_gear';
  readonly magnitude: number;
}

export type PartData = WeaponPart | ArmorPart | EnginePart | GearPart | SpecialPart;

// =============================================================================
// Robots
// =============================================================================

/**
 * Slot definition on a robot blueprint.
 *
 * `x` / `y` are pixel coordinates inside a virtual 192x220 blueprint space.
 * The Build scene projects these onto the actual on-screen blueprint panel.
 */
export interface SlotDef {
  readonly id: SlotId;
  readonly slotType: SlotType;
  readonly accepts: PartCategory;
  readonly x: number;
  readonly y: number;
}

export interface RobotData {
  readonly id: RobotId;
  readonly name: string;
  readonly archetype: RobotArchetype;
  readonly description: string;
  readonly baseHp: number;
  readonly baseDamageReductionPct: number;
  readonly baseAttackSpeedMultiplier: number;
  readonly passiveText: string;
  readonly slots: readonly SlotDef[];
  /** Asset key for the Build scene's blueprint line-art. */
  readonly blueprintAssetKey: string;
  /** Asset key for the Battle scene's color side-view sprite. */
  readonly battleAssetKey: string;
}

// =============================================================================
// Rounds (enemies + rewards)
// =============================================================================

export interface EnemyData {
  readonly name: string;
  readonly hp: number;
  readonly damage: number;
  readonly cooldownSec: number;
  readonly damageReductionPct: number;
  readonly assetKey: string;
}

export interface RoundData {
  readonly id: RoundId;
  readonly index: number;
  readonly enemy: EnemyData;
  readonly goldReward: number;
  readonly isBoss: boolean;
}

// =============================================================================
// Economy (shop)
// =============================================================================

export interface EconomyData {
  readonly startingGold: number;
  readonly rerollCost: number;
  readonly sellRefundRatio: number;
  readonly shopSlotCount: number;
  readonly roundRewardBase: number;
  readonly roundRewardPerRound: number;
}

// =============================================================================
// Synergies
// =============================================================================

export type SynergyTrigger =
  | { readonly kind: 'gear_count'; readonly threshold: number }
  | { readonly kind: 'category_pair'; readonly a: PartCategory; readonly b: PartCategory };

export type SynergyEffect =
  | { readonly kind: 'cooldown_mult'; readonly multiplier: number }
  | { readonly kind: 'damage_flat'; readonly bonus: number }
  | { readonly kind: 'pierce_plus'; readonly amount: number };

export interface SynergyData {
  readonly id: SynergyId;
  readonly name: string;
  readonly description: string;
  readonly trigger: SynergyTrigger;
  readonly effect: SynergyEffect;
}

// =============================================================================
// Registry container types (used with `as const satisfies`)
// =============================================================================

export type PartsRegistry    = Record<string, PartData>;
export type RobotsRegistry   = Record<string, RobotData>;
export type RoundsRegistry   = Record<string, RoundData>;
export type SynergiesRegistry = Record<string, SynergyData>;
