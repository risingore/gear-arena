/**
 * SOUL STRIKE — canonical economy data (v0.1, 2026-04-15).
 *
 * Heika is free to edit every value. Kima must not rewrite without approval.
 */

import type { EconomyData } from './schema';

export const ECONOMY: EconomyData = {
  startingGold: 15,
  rerollCost: 1,
  sellRefundRatio: 0.5,
  shopSlotCount: 5,
  roundRewardBase: 6,
  roundRewardPerRound: 1
};
