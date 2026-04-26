/**
 * SOUL STRIKE — canonical economy data (v0.1, 2026-04-15).
 *
 * All values are tunable. Edit every value. 
 */

import type { EconomyData } from './schema';

// All gold/scrap-denominated values are scaled ×100 from the original
// design (15 gold start → 1500 gold start, 6 round reward → 600, etc).
// Part prices in parts.ts and buff prices in items.ts are also ×100.
// Ratios (sellRefundRatio, scrapConversionRate) stay the same — this is
// purely cosmetic but makes the economy numbers feel substantial.
export const ECONOMY: EconomyData = {
  startingGold: 1500,
  rerollCost: 100,
  sellRefundRatio: 0.5,
  shopSlotCount: 6,
  roundRewardBase: 600,
  roundRewardPerRound: 100
};
