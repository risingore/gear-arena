/**
 * SOUL STRIKE — pachislot system configuration.
 *
 * All tunable values for the hit/rush/aura system.
 * All values are tunable. Edit every number here.
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

// ---------------------------------------------------------------------------
// Pseudo-continuation (擬似連) — mandala pulses before ULTIMATE button
// ---------------------------------------------------------------------------

/** Probability that 擬似連 occurs at all (vs direct button appearance). */
export const GIJIREN_CHANCE = 0.6;

/**
 * When 擬似連 fires, how many pulses (1-4)?
 * Weighted roll. More pulses = rarer = higher hit expectation.
 * [pulses, weightOnHit, weightOnMiss]
 */
export const GIJIREN_PULSE_WEIGHTS: readonly [number, number, number][] = [
  [1, 30, 50],  // 1 pulse: common, low trust
  [2, 30, 30],  // 2 pulses: medium
  [3, 25, 15],  // 3 pulses: rare, high trust
  [4, 15,  5],  // 4 pulses: very rare, near-guaranteed
];

/** Delay between each mandala pulse (ms). */
export const GIJIREN_PULSE_INTERVAL_MS = 600;

/** Aura color roll weights (higher = more common). */
export const SLOT_AURA_WEIGHTS: Record<AuraColor, number> = {
  white:   40,
  blue:    25,
  yellow:  15,
  green:   10,
  red:     7,
  rainbow: 3,
};
