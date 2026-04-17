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

import { ECONOMY, type PartKey, type RobotKey, type ItemKey } from '@/data';
import type { GeneratedRound } from './enemyPool';
import { createEmptyRunStats, type RunStats } from './runStats';

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
  /** Pre-generated enemy lineup for the current run. */
  generatedRounds: GeneratedRound[];
  /** The enemy ID of the most recent battle (for collection tracking). */
  lastDefeatedEnemyId: string;
  /** Number of rerolls used this run (drives cost escalation). */
  rerollsUsed: number;
  /** HP carried from last battle (0 = use max HP). */
  carryHp: number;
  /** Battle buffs queued from next-battle items (consumed on battle start). */
  battleBuffs: ItemKey[];
  /** Permanent skills acquired from boss rewards (max 3 per run). */
  acquiredSkills: string[];
  /** Pending skill choices offered after boss fight (skill IDs; empty = none). */
  pendingSkillChoices: string[];
  /** Parts removed from blueprint and stored in the basket (persist between rounds). */
  storedParts: PartKey[];
  /** Buff items equipped in the blueprint's buff slots (consumed on battle start). */
  equippedBuffs: ItemKey[];
  /** Accumulated statistics for the current run. */
  runStats: RunStats;
}

export const createInitialRunState = (): RunState => ({
  robotKey: null,
  currentRound: 1,
  gold: ECONOMY.startingGold,
  equipped: {},
  shopOffer: [],
  battleOutcome: 'pending',
  lastResultMessage: '',
  generatedRounds: [],
  lastDefeatedEnemyId: '',
  rerollsUsed: 0,
  carryHp: 0,
  battleBuffs: [],
  acquiredSkills: [],
  pendingSkillChoices: [],
  storedParts: [],
  equippedBuffs: [],
  runStats: createEmptyRunStats()
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
