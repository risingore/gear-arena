/**
 * Shop roll logic.
 *
 * Picks `ECONOMY.shopSlotCount` parts from the full catalogue with
 * independent random draws (duplicates allowed — the same part can appear
 * twice in one offer). Sold-out slots are represented by the empty string.
 */

import { ALL_PART_KEYS, ALL_ITEM_KEYS, ECONOMY, type PartKey } from '@/data';

const pickRandom = <T>(arr: readonly T[]): T => arr[Math.floor(Math.random() * arr.length)]!;

/** Chance that any given shop slot contains an item instead of a part. */
const ITEM_CHANCE = 0.2;

export const generateShopOffer = (): string[] => {
  const slots: string[] = [];
  for (let i = 0; i < ECONOMY.shopSlotCount; i += 1) {
    if (Math.random() < ITEM_CHANCE) {
      slots.push(pickRandom(ALL_ITEM_KEYS) as string);
    } else {
      slots.push(pickRandom(ALL_PART_KEYS) as string);
    }
  }
  return slots;
};

export const isOfferEmpty = (offer: readonly string[]): boolean =>
  offer.every((slot) => slot === '');

export const takeFromOffer = (
  offer: readonly string[],
  index: number
): { next: string[]; picked: PartKey | null } => {
  if (index < 0 || index >= offer.length) return { next: [...offer], picked: null };
  const picked = offer[index];
  if (!picked) return { next: [...offer], picked: null };
  const next = [...offer];
  next[index] = '';
  return { next, picked: picked as PartKey };
};
