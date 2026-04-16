/**
 * Persistent progress tracking via localStorage.
 *
 * Tracks:
 *   - Best round reached + total victories
 *   - Per-robot clear count (used for robot unlock progression)
 *   - Unlocked robots (KNIGHT -> GOLIATH -> STRIKER -> ORACLE)
 *   - Defeated enemy IDs (collection)
 *   - Used part IDs (collection)
 *
 * Silently falls back to empty data when localStorage is unavailable.
 */

import { ALL_ROBOT_KEYS, type RobotKey, type PartKey } from '@/data';
import { ALL_ENEMY_IDS } from '@/data/enemies';

const STORAGE_KEY = 'gear-arena-save-v2';

/** Robot unlock order — first robot is always unlocked. */
const UNLOCK_ORDER: readonly RobotKey[] = ALL_ROBOT_KEYS;

export interface SaveData {
  bestRound: number;
  totalClears: number;
  perRobotClears: Record<RobotKey, number>;
  unlockedRobots: string[];
  defeatedEnemies: string[];
  usedParts: string[];
}

const emptySave = (): SaveData => {
  const perRobotClears = {} as Record<RobotKey, number>;
  for (const key of ALL_ROBOT_KEYS) perRobotClears[key] = 0;
  return {
    bestRound: 0,
    totalClears: 0,
    perRobotClears,
    unlockedRobots: [UNLOCK_ORDER[0]!],
    defeatedEnemies: [],
    usedParts: []
  };
};

export const loadSaveData = (): SaveData => {
  try {
    if (typeof localStorage === 'undefined') return emptySave();
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      // Migrate from v1 if present
      const v1 = localStorage.getItem('gear-arena-save-v1');
      if (v1) {
        const parsed = JSON.parse(v1) as Partial<SaveData>;
        const base = emptySave();
        const migrated: SaveData = {
          bestRound: typeof parsed.bestRound === 'number' ? parsed.bestRound : 0,
          totalClears: typeof parsed.totalClears === 'number' ? parsed.totalClears : 0,
          perRobotClears: { ...base.perRobotClears, ...(parsed.perRobotClears ?? {}) },
          unlockedRobots: base.unlockedRobots,
          defeatedEnemies: [],
          usedParts: []
        };
        // Compute unlocks from existing clears
        recomputeUnlocks(migrated);
        saveSaveData(migrated);
        return migrated;
      }
      return emptySave();
    }
    const parsed = JSON.parse(raw) as Partial<SaveData>;
    const base = emptySave();
    return {
      bestRound: typeof parsed.bestRound === 'number' ? parsed.bestRound : 0,
      totalClears: typeof parsed.totalClears === 'number' ? parsed.totalClears : 0,
      perRobotClears: { ...base.perRobotClears, ...(parsed.perRobotClears ?? {}) },
      unlockedRobots: Array.isArray(parsed.unlockedRobots) ? parsed.unlockedRobots : base.unlockedRobots,
      defeatedEnemies: Array.isArray(parsed.defeatedEnemies) ? parsed.defeatedEnemies : [],
      usedParts: Array.isArray(parsed.usedParts) ? parsed.usedParts : []
    };
  } catch {
    return emptySave();
  }
};

export const saveSaveData = (data: SaveData): void => {
  try {
    if (typeof localStorage === 'undefined') return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    // silent fallback
  }
};

/** Recompute the unlocked robots list based on per-robot clear counts. */
function recomputeUnlocks(data: SaveData): void {
  const unlocked = new Set(data.unlockedRobots);
  for (let i = 0; i < UNLOCK_ORDER.length - 1; i += 1) {
    const current = UNLOCK_ORDER[i]!;
    const next = UNLOCK_ORDER[i + 1]!;
    if ((data.perRobotClears[current as RobotKey] ?? 0) > 0) {
      unlocked.add(next);
    }
  }
  data.unlockedRobots = [...unlocked];
}

export const recordRoundReached = (round: number): SaveData => {
  const data = loadSaveData();
  if (round > data.bestRound) data.bestRound = round;
  saveSaveData(data);
  return data;
};

export const recordVictory = (robotKey: RobotKey): SaveData => {
  const data = loadSaveData();
  data.totalClears += 1;
  data.perRobotClears[robotKey] = (data.perRobotClears[robotKey] ?? 0) + 1;
  if (data.bestRound < 10) data.bestRound = 10;
  recomputeUnlocks(data);
  saveSaveData(data);
  return data;
};

export const recordDefeatedEnemy = (enemyId: string): SaveData => {
  const data = loadSaveData();
  if (!data.defeatedEnemies.includes(enemyId)) {
    data.defeatedEnemies.push(enemyId);
  }
  saveSaveData(data);
  return data;
};

export const recordUsedPart = (partKey: PartKey): SaveData => {
  const data = loadSaveData();
  const key = partKey as string;
  if (!data.usedParts.includes(key)) {
    data.usedParts.push(key);
  }
  saveSaveData(data);
  return data;
};

export const isRobotUnlocked = (robotKey: RobotKey): boolean => {
  const data = loadSaveData();
  return data.unlockedRobots.includes(robotKey);
};

/**
 * Check if the super boss is unlocked:
 *   1. All 4 robots have at least 1 clear each.
 *   2. Every non-super enemy has been defeated at least once.
 */
/**
 * Wipe ALL progress — unlocks, collections, clears, everything.
 * Called from the Settings screen's "RESET ALL DATA" button.
 */
export const resetAllData = (): void => {
  try {
    if (typeof localStorage === 'undefined') return;
    localStorage.removeItem(STORAGE_KEY);
    // Also remove the legacy v1 key if present.
    localStorage.removeItem('gear-arena-save-v1');
  } catch { /* silent */ }
};

export const isSuperBossUnlocked = (): boolean => {
  const data = loadSaveData();
  // All robots cleared?
  for (const key of ALL_ROBOT_KEYS) {
    if ((data.perRobotClears[key] ?? 0) === 0) return false;
  }
  // All non-super enemies defeated?
  const nonSuperIds = ALL_ENEMY_IDS.filter((id) => id !== 'superboss_apex');
  for (const id of nonSuperIds) {
    if (!data.defeatedEnemies.includes(id)) return false;
  }
  return true;
};
