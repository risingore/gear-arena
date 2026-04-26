/**
 * SOUL STRIKE — canonical economy data (v0.1, 2026-04-15).
 *
 * All values are tunable. Edit every value. 
 */

import type { EconomyData } from './schema';

// All gold/scrap-denominated values are scaled ×100 from the original
// design (15 → 1500 starting gold, 6 → 600 round reward base, etc.).
// Part prices in parts.ts and buff prices in items.ts mirror the same
// scale; ratios (sellRefundRatio, scrapConversionRate) stay invariant.
// Round-reward base/perRound are tuned against
// BALANCE.roundDifficultyGrowthHard so a Hard run cannot afford to ★3
// every slot AND keep buying through R9 — forcing a commit choice.
export const ECONOMY: EconomyData = {
  startingGold: 1500,
  rerollCost: 100,
  sellRefundRatio: 0.5,
  shopSlotCount: 6,
  roundRewardBase: 500,
  roundRewardPerRound: 80
};
