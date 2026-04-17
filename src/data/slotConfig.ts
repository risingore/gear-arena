/**
 * GEAR ARENA — pachislot system configuration.
 *
 * All tunable values for the hit/rush/aura system.
 * Heika is free to edit every number here.
 */

import type { AuraColor } from '../game/systems/slotMachine';

/** Base hit probability per second of combat (Setting 6). */
export const SLOT_HIT_PROB_PER_SEC = 1 / 240.9;

/** Damage multiplier when a hit occurs. */
export const SLOT_HIT_DAMAGE_MULT = 1.5;

/** Rush mode: gauge charge speed multiplier. */
export const SLOT_RUSH_CHARGE_MULT = 1.8;

/** Aura appears when gauge ratio reaches this during rush. */
export const SLOT_AURA_THRESHOLD = 0.7;

/** Continuation rate per aura color (chance the next ult is also a hit). */
export const SLOT_CONTINUATION_RATE: Record<AuraColor, number> = {
  white:   0.05,
  blue:    0.07,
  yellow:  0.10,
  green:   0.25,
  red:     0.40,
  rainbow: 0.60,
};

/** Aura color roll weights (higher = more common). */
export const SLOT_AURA_WEIGHTS: Record<AuraColor, number> = {
  white:   40,
  blue:    25,
  yellow:  15,
  green:   10,
  red:     7,
  rainbow: 3,
};
