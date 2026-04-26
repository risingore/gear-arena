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

/**
 * Difficulty mode the run was started in.
 * - `easy`: shorter precursor arc — Result plays a minimal cliffhanger
 *   epilogue and returns straight to Title (no credits, no HYAKKI YAKOU,
 *   no SOUL BREAKER teaser).
 * - `hard`: canonical Episode 0 — full credits roll, HYAKKI YAKOU
 *   reveal, SOUL BREAKER continuation cue.
 */
export type EndingMode = 'easy' | 'hard';

/** A part installed in a slot, with its current star level. */
export interface EquippedEntry {
  readonly key: PartKey;
  readonly star: number;
}

export interface RunState {
  robotKey: RobotKey | null;
  currentRound: number;
  gold: number;
  /** Slot ID -> equipped part (key + star level) */
  equipped: Record<string, EquippedEntry>;
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
  /**
   * Buff items drained from savedata.ownedBuffItems at run start (purchased
   * at SANCTUM). Consumed by Battle.ts when the first battle begins.
   */
  equippedBuffs: ItemKey[];
  /** Accumulated statistics for the current run. */
  runStats: RunStats;
  /** Difficulty mode for this run (drives Result scene's ending flavor). */
  endingMode: EndingMode;
  /**
   * When true, the Result scene treats the run as a debug preview and
   * skips every persistent save mutation (no clears recorded, no scrap
   * earned, no easyCleared flag, no collection unlocks). Used by the
   * Settings → Debug → "Ending (Easy/Hard)" buttons so previewing the
   * ending sequence doesn't contaminate the player's real save data.
   */
  previewOnly: boolean;
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
  equippedBuffs: [],
  runStats: createEmptyRunStats(),
  endingMode: 'hard',
  previewOnly: false
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
