/**
 * Cross-scene run state. A single object shared through Phaser's Registry.
 *
 * Every scene accesses the current run through `getRunState` / `setRunState`.
 *
 * Round transitions:
 *   - HP is restored to max at the start of each Build phase (jam simplification).
 *   - gold / equipped / robotKey persist across rounds.
 *   - Losing a round resets everything through `createInitialRunState`.
 */

import type { Scene } from 'phaser';

import { ECONOMY, type PartKey, type RobotKey } from '@/data';

const REGISTRY_KEY = 'runState';

export type BattleOutcome = 'pending' | 'win' | 'lose' | 'victory';

export interface RunState {
  robotKey: RobotKey | null;
  currentRound: number;
  gold: number;
  /** Slot ID -> equipped part key */
  equipped: Record<string, PartKey>;
  /** Current shop offer (part keys; empty string = sold out) */
  shopOffer: string[];
  battleOutcome: BattleOutcome;
  /** Message displayed on the Result scene after the latest battle. */
  lastResultMessage: string;
}

export const createInitialRunState = (): RunState => ({
  robotKey: null,
  currentRound: 1,
  gold: ECONOMY.startingGold,
  equipped: {},
  shopOffer: [],
  battleOutcome: 'pending',
  lastResultMessage: ''
});

export const getRunState = (scene: Scene): RunState => {
  const existing = scene.registry.get(REGISTRY_KEY) as RunState | undefined;
  if (existing) return existing;
  const fresh = createInitialRunState();
  scene.registry.set(REGISTRY_KEY, fresh);
  return fresh;
};

export const setRunState = (scene: Scene, next: RunState): void => {
  scene.registry.set(REGISTRY_KEY, next);
};

export const resetRunState = (scene: Scene): RunState => {
  const fresh = createInitialRunState();
  scene.registry.set(REGISTRY_KEY, fresh);
  return fresh;
};
