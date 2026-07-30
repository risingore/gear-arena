/**
 * SOUL STRIKE — placement synergy definitions.
 *
 * Placement synergies trigger based on WHERE parts are placed on the body,
 * adding a spatial strategy layer on top of the existing category synergies.
 *
 * Numeric values are tunable. 
 */

import type { SlotType, PartCategory } from './schema';

// =============================================================================
// Types
// =============================================================================

export interface PlacementSynergyEffect {
  readonly kind:
    | 'ult_strike_bonus'
    | 'ult_damage_pct'
    | 'charge_speed'
    | 'dr_bonus'
    | 'hp_bonus'
    | 'hit_chance_bonus';
  readonly value: number;
}

export interface PlacementSlotPattern {
  /** Which slotTypes must be filled. */
  readonly slotTypes: readonly SlotType[];
  /** What category must be in those slots (or 'any'). */
  readonly requiredCategory?: PartCategory | 'any';
  /** Minimum count of the same category in those slots. */
  readonly minCount?: number;
}

export interface PlacementSynergyDef {
  readonly id: string;
  readonly name: string;
  readonly description: string;
  /** Slot pattern that must be satisfied to trigger. */
  readonly slotPattern: PlacementSlotPattern;
  /** The bonus when triggered. */
  readonly effect: PlacementSynergyEffect;
}

// =============================================================================
// Data
// =============================================================================

export const PLACEMENT_SYNERGIES: readonly PlacementSynergyDef[] = [
  {
    id: 'psyn_twin_module',
    name: 'Twin Module',
    description: '2+ modules in the same slot type: ULT strike +1.',
    slotPattern: {
      slotTypes: ['arm_r', 'arm_l', 'legs_l', 'legs_r', 'head', 'chest', 'back'],
      requiredCategory: 'module',
      minCount: 2,
    },
    effect: { kind: 'ult_strike_bonus', value: 1 },
  },
  {
    id: 'psyn_full_arm',
    name: 'Full Arm',
    description: 'All arm_r slots filled: ULT damage +20%.',
    slotPattern: {
      slotTypes: ['arm_r'],
      requiredCategory: 'any',
    },
    effect: { kind: 'ult_damage_pct', value: 0.2 },
  },
  {
    id: 'psyn_full_leg',
    name: 'Full Leg',
    description: 'All legs_l slots filled: charge speed +30%.',
    slotPattern: {
      slotTypes: ['legs_l'],
      requiredCategory: 'any',
    },
    effect: { kind: 'charge_speed', value: 0.3 },
  },
  {
    id: 'psyn_core_lock',
    name: 'Core Lock',
    description: 'Chest + back both have parts: DR +5%.',
    slotPattern: {
      slotTypes: ['chest', 'back'],
      requiredCategory: 'any',
    },
    effect: { kind: 'dr_bonus', value: 0.05 },
  },
  {
    id: 'psyn_head_start',
    name: 'Head Start',
    description: 'Head slot filled: hit chance +0.5/sec.',
    slotPattern: {
      slotTypes: ['head'],
      requiredCategory: 'any',
    },
    effect: { kind: 'hit_chance_bonus', value: 0.5 },
  },
  {
    id: 'psyn_soul_resonance',
    name: 'Soul Resonance',
    description: '2+ soul parts on back slots: ULT damage +25%.',
    slotPattern: {
      slotTypes: ['back'],
      requiredCategory: 'soul',
      minCount: 2,
    },
    effect: { kind: 'ult_damage_pct', value: 0.25 },
  },
  {
    id: 'psyn_booster_chain',
    name: 'Booster Chain',
    description: '3+ boosters anywhere: charge speed +20%.',
    slotPattern: {
      slotTypes: ['arm_r', 'arm_l', 'legs_l', 'legs_r', 'head', 'chest', 'back'],
      requiredCategory: 'booster',
      minCount: 3,
    },
    effect: { kind: 'charge_speed', value: 0.2 },
  },
  {
    id: 'psyn_mixed_arms',
    name: 'Mixed Arms',
    description: 'Module + implant in the same limb: HP +15.',
    slotPattern: {
      slotTypes: ['arm_r', 'legs_l'],
      requiredCategory: 'any',
      minCount: 2,
    },
    effect: { kind: 'hp_bonus', value: 15 },
  },
  {
    id: 'psyn_leg_charger',
    name: 'Leg Charger',
    description: 'Charger on legs: ULT damage +10%.',
    slotPattern: {
      slotTypes: ['legs_l', 'legs_r'],
      requiredCategory: 'charger',
      minCount: 1,
    },
    effect: { kind: 'ult_damage_pct', value: 0.1 },
  },
  {
    id: 'psyn_spine_link',
    name: 'Spine Link',
    description: 'Soul on back + charger on chest: charge speed +40%.',
    slotPattern: {
      slotTypes: ['back', 'chest'],
      requiredCategory: 'any',
    },
    effect: { kind: 'charge_speed', value: 0.4 },
  },
] as const;

export type PlacementSynergyId = (typeof PLACEMENT_SYNERGIES)[number]['id'];

export const ALL_PLACEMENT_SYNERGY_IDS: readonly string[] =
  PLACEMENT_SYNERGIES.map((s) => s.id);
