/**
 * SOUL STRIKE — canonical economy data (v0.1, 2026-04-15).
 *
 * All values are tunable. Edit every value. 
 */

import type { EconomyData } from './schema';

export const ECONOMY: EconomyData = {
  startingGold: 15,
  rerollCost: 1,
  sellRefundRatio: 0.5,
  shopSlotCount: 6,
  roundRewardBase: 6,
  roundRewardPerRound: 1
};
