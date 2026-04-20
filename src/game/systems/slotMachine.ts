/**
 * Pachislot-inspired hit system.
 *
 * All tunable values are in src/data/slotConfig.ts.
 * This file is pure logic — no magic numbers.
 */

import {
  SLOT_HIT_PROB_PER_SEC,
  SLOT_RUSH_CHARGE_MULT,
  SLOT_AURA_THRESHOLD,
  SLOT_CONTINUATION_RATE,
  SLOT_AURA_WEIGHTS
} from '@/data/slotConfig';

/** Aura colors in ascending rarity order. */
export type AuraColor = 'white' | 'blue' | 'yellow' | 'green' | 'red' | 'rainbow';

export const AURA_COLORS: readonly AuraColor[] = ['white', 'blue', 'yellow', 'green', 'red', 'rainbow'];

// Visual constants only — not gameplay tunable (hex color codes for rendering).
export const AURA_HEX: Record<AuraColor, number> = {
  white:   0xffffff,
  blue:    0x3ab0ff,
  yellow:  0xffd94a,
  green:   0x3aff7a,
  red:     0xff3a3a,
  rainbow: 0xff00ff
};

export const AURA_CSS: Record<AuraColor, string> = {
  white:   '#ffffff',
  blue:    '#3ab0ff',
  yellow:  '#ffd94a',
  green:   '#3aff7a',
  red:     '#ff3a3a',
  rainbow: '#ff00ff'
};

/** Re-export for Battle.ts convenience. */
export const RUSH_CHARGE_MULT = SLOT_RUSH_CHARGE_MULT;

export interface SlotState {
  inRush: boolean;
  aura: AuraColor | null;
  accumulator: number;
  nextIsHit: boolean;
}

export const createSlotState = (): SlotState => ({
  inRush: false,
  aura: null,
  accumulator: 0,
  nextIsHit: false
});

/** Roll a random aura color based on configured weights. */
export const rollAuraColor = (): AuraColor => {
  const total = AURA_COLORS.reduce((s, c) => s + SLOT_AURA_WEIGHTS[c], 0);
  let roll = Math.random() * total;
  for (const color of AURA_COLORS) {
    roll -= SLOT_AURA_WEIGHTS[color];
    if (roll <= 0) return color;
  }
  return 'white';
};

/** Tick each frame. Returns true if a hit flag was just set. */
export const tickSlotMachine = (
  state: SlotState,
  dtSec: number,
  bonusHitProbPerSec = 0,
): boolean => {
  if (state.inRush) return false;
  state.accumulator += dtSec;
  const probPerFrame = (SLOT_HIT_PROB_PER_SEC + bonusHitProbPerSec) * dtSec * 60;
  if (Math.random() < probPerFrame) {
    state.nextIsHit = true;
    return true;
  }
  return false;
};

/** Resolve ultimate press. Returns true if this press is a hit. */
export const resolveUltimatePress = (state: SlotState): boolean => {
  if (state.inRush) {
    const rate = state.aura ? SLOT_CONTINUATION_RATE[state.aura] : 0;
    if (Math.random() < rate) {
      state.aura = null;
      return true;
    }
    state.inRush = false;
    state.aura = null;
    state.nextIsHit = false;
    return false;
  }
  if (state.nextIsHit) {
    state.nextIsHit = false;
    state.inRush = true;
    state.aura = null;
    return true;
  }
  return false;
};

/** Check if aura should appear during rush. */
export const checkAuraAppear = (state: SlotState, gaugeRatio: number): void => {
  if (state.inRush && !state.aura && gaugeRatio >= SLOT_AURA_THRESHOLD) {
    state.aura = rollAuraColor();
  }
};
