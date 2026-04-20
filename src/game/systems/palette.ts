/**
 * Placeholder color constants.
 *
 * These drive the provisional visuals used until real art ships (Day 7).
 * Once art is in, HP bar / button / text colors stay; silhouette fills are
 * replaced by sprite textures.
 */

import type { PartCategory, RobotArchetype } from '@/data';

export const PALETTE = {
  bg: 0x0a0a10,
  blueprintBg: 0x142a5e,
  blueprintLine: 0xaeeaff,
  slotEmpty: 0x2a4a7e,
  slotEmptyStroke: 0x88bbee,
  slotFilled: 0x4a7abe,
  slotFilledStroke: 0xffffff,
  cardBg: 0x1c2438,
  cardBgHover: 0x2e3a58,
  cardStroke: 0x5a8ec4,
  cardStrokeSelected: 0xff7a00,
  textPrimary: 0xffffff,
  textMuted: 0x888899,
  hpBarBg: 0x331515,
  hpBarFill: 0xff3a3a,
  hpBarFillEnemy: 0xaa3333,
  goldText: 0xffd94a,
  buttonBg: 0x3a3a55,
  buttonBgHover: 0x555577,
  buttonDisabled: 0x222233,
  accentOrange: 0xff7a00,
  accentBlue: 0x3ab0ff,
  accentGreen: 0x3aff7a,
  accentRed: 0xff3a3a,
  danger: 0xff4444,
  itemCardBg: 0x1a2a1a,
  itemBar: 0x88ff44,
  itemText: '#88ff44'
} as const;

export const ROBOT_COLORS: Record<RobotArchetype, number> = {
  balanced: 0x9bbdff,
  heavy:    0xff9b5b,
  speed:    0x3aff7a,
  tech:     0xc49bff
};

export const CATEGORY_COLORS: Record<PartCategory, number> = {
  module:  0xff5a5a,
  implant: 0x5aaaff,
  charger: 0xffaa3a,
  booster: 0xc0c0c0,
  soul:    0xc49bff
};

export const CATEGORY_LABEL: Record<PartCategory, string> = {
  module:  'MOD',
  implant: 'IMP',
  charger: 'CHG',
  booster: 'BST',
  soul:    'SOL'
};
