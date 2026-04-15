/**
 * Shop roll logic.
 *
 * Picks `ECONOMY.shopSlotCount` parts from the full catalogue with
 * independent random draws (duplicates allowed — the same part can appear
 * twice in one offer). Sold-out slots are represented by the empty string.
 */

import { ALL_PART_KEYS, ECONOMY, type PartKey } from '@/data';

const pickRandom = <T>(arr: readonly T[]): T => arr[Math.floor(Math.random() * arr.length)]!;

export const generateShopOffer = (): string[] => {
  const slots: string[] = [];
  for (let i = 0; i < ECONOMY.shopSlotCount; i += 1) {
    slots.push(pickRandom(ALL_PART_KEYS) as string);
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
