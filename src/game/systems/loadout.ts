/**
 * Equipment actions (buy / sell / reroll / reward).
 *
 * Returns new partial run state objects rather than mutating the argument.
 * Callers are responsible for pushing the result through `setRunState`.
 */

import { PARTS, ROBOTS, ECONOMY, type PartKey, type RobotKey } from '@/data';
import type { RunState } from './runState';

export interface BuyResult {
  readonly ok: boolean;
  readonly reason?: 'no_robot' | 'not_enough_gold' | 'no_slot';
  readonly next?: RunState;
}

const findFreeSlotFor = (
  robotKey: RobotKey,
  partKey: PartKey,
  equipped: Readonly<Record<string, PartKey>>
): string | null => {
  const robot = ROBOTS[robotKey];
  const part = PARTS[partKey];
  for (const slot of robot.slots) {
    if (equipped[slot.id]) continue;
    // Slot eligibility is driven entirely by the part's allowedSlots list.
    // slot.accepts is kept for UI labeling only.
    const slotTypeOk = part.allowedSlots.some((s) => s === slot.slotType);
    if (!slotTypeOk) continue;
    return slot.id;
  }
  return null;
};

export const canAfford = (state: RunState, cost: number): boolean => state.gold >= cost;

export const attemptBuy = (state: RunState, shopIndex: number): BuyResult => {
  if (!state.robotKey) return { ok: false, reason: 'no_robot' };
  const partKey = state.shopOffer[shopIndex] as PartKey | '' | undefined;
  if (!partKey) return { ok: false, reason: 'no_slot' };
  const part = PARTS[partKey];
  if (!part) return { ok: false, reason: 'no_slot' };
  if (!canAfford(state, part.price)) return { ok: false, reason: 'not_enough_gold' };
  const slotId = findFreeSlotFor(state.robotKey, partKey, state.equipped);
  if (!slotId) return { ok: false, reason: 'no_slot' };

  const nextEquipped = { ...state.equipped, [slotId]: partKey };
  const nextOffer = [...state.shopOffer];
  nextOffer[shopIndex] = '';
  const next: RunState = {
    ...state,
    gold: state.gold - part.price,
    equipped: nextEquipped,
    shopOffer: nextOffer
  };
  return { ok: true, next };
};

export const attemptSell = (state: RunState, slotId: string): RunState => {
  const partKey = state.equipped[slotId];
  if (!partKey) return state;
  const part = PARTS[partKey];
  if (!part) return state;
  const refund = Math.floor(part.price * ECONOMY.sellRefundRatio);
  const nextEquipped = { ...state.equipped };
  delete nextEquipped[slotId];
  return {
    ...state,
    gold: state.gold + refund,
    equipped: nextEquipped
  };
};

/** Reroll cost escalates: base + rerollsUsed this run. */
export const getRerollCost = (state: RunState): number =>
  ECONOMY.rerollCost + (state.rerollsUsed ?? 0);

export const attemptReroll = (
  state: RunState,
  nextOffer: string[]
): RunState | null => {
  const cost = getRerollCost(state);
  if (!canAfford(state, cost)) return null;
  return {
    ...state,
    gold: state.gold - cost,
    shopOffer: nextOffer,
    rerollsUsed: (state.rerollsUsed ?? 0) + 1
  };
};

export const awardRoundReward = (state: RunState): RunState => {
  const reward = ECONOMY.roundRewardBase + ECONOMY.roundRewardPerRound * state.currentRound;
  return { ...state, gold: state.gold + reward };
};
