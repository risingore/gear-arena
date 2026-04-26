/**
 * Persistent progress tracking via localStorage.
 *
 * Tracks:
 *   - Best round reached + total victories
 *   - Per-cyborg clear count (used for cyborg unlock progression)
 *   - Unlocked cyborgs (INDRA -> GOLIATH-414 -> LILITH -> MUMEI)
 *   - Defeated enemy IDs (collection)
 *   - Used part IDs (collection)
 *
 * Silently falls back to empty data when localStorage is unavailable.
 */

import { ALL_ROBOT_KEYS, type RobotKey, type PartKey } from '@/data';
import { ALL_ENEMY_IDS } from '@/data/enemies';

const STORAGE_KEY = 'soul-strike-save-v2';

/** Cyborg unlock order — first cyborg is always unlocked. */
const UNLOCK_ORDER: readonly RobotKey[] = ALL_ROBOT_KEYS;

export interface SaveData {
  bestRound: number;
  totalClears: number;
  perRobotClears: Record<RobotKey, number>;
  unlockedRobots: string[];
  defeatedEnemies: string[];
  usedParts: string[];
  acquiredSkillsEver: string[];
  scrap: number;
  /** Total completed battles (any outcome). Gates SANCTUM unlock on Title. */
  battlesCompleted: number;
  /** Buff items purchased at SANCTUM, waiting to be auto-applied at next Build → Battle. */
  ownedBuffItems: string[];
  /**
   * Whether the player has completed an Easy mode run at least once.
   * Title screen gates the HARD button on this — a fresh save can only
   * pick EASY first, mirroring the in-fiction "you've only just fallen"
   * arc.
   */
  easyCleared: boolean;
  /**
   * Whether the player has completed a Hard mode run at least once.
   * Title screen gates the STORY button on this — only players who have
   * seen both endings should be able to read the joined epilogue.
   */
  hardCleared: boolean;
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
    usedParts: [],
    acquiredSkillsEver: [],
    scrap: 0,
    battlesCompleted: 0,
    ownedBuffItems: [],
    easyCleared: false,
    hardCleared: false,
  };
};

export const loadSaveData = (): SaveData => {
  try {
    if (typeof localStorage === 'undefined') return emptySave();
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      // Migrate from v1 if present
      const v1 = localStorage.getItem('soul-strike-save-v1');
      if (v1) {
        const parsed = JSON.parse(v1) as Partial<SaveData>;
        const base = emptySave();
        const migrated: SaveData = {
          bestRound: typeof parsed.bestRound === 'number' ? parsed.bestRound : 0,
          totalClears: typeof parsed.totalClears === 'number' ? parsed.totalClears : 0,
          perRobotClears: { ...base.perRobotClears, ...(parsed.perRobotClears ?? {}) },
          unlockedRobots: base.unlockedRobots,
          defeatedEnemies: [],
          usedParts: [],
          acquiredSkillsEver: [],
          scrap: 0,
          battlesCompleted: 0,
          ownedBuffItems: [],
          easyCleared: false,
          hardCleared: false,
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
      usedParts: Array.isArray(parsed.usedParts) ? parsed.usedParts : [],
      acquiredSkillsEver: Array.isArray(parsed.acquiredSkillsEver) ? parsed.acquiredSkillsEver : [],
      scrap: typeof parsed.scrap === 'number' ? parsed.scrap : 0,
      battlesCompleted: typeof parsed.battlesCompleted === 'number' ? parsed.battlesCompleted : 0,
      ownedBuffItems: Array.isArray(parsed.ownedBuffItems) ? parsed.ownedBuffItems : [],
      easyCleared: typeof parsed.easyCleared === 'boolean' ? parsed.easyCleared : false,
      hardCleared: typeof parsed.hardCleared === 'boolean' ? parsed.hardCleared : false,
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

/**
 * Mark Easy mode as cleared. Unlocks the HARD button on the Title screen.
 * Idempotent — calling again after Hard unlock has no effect.
 */
export const recordEasyCleared = (): SaveData => {
  const data = loadSaveData();
  if (data.easyCleared) return data;
  data.easyCleared = true;
  saveSaveData(data);
  return data;
};

/**
 * Mark Hard mode as cleared. Unlocks the STORY button on the Title screen.
 * Idempotent — calling again is a no-op.
 */
export const recordHardCleared = (): SaveData => {
  const data = loadSaveData();
  if (data.hardCleared) return data;
  data.hardCleared = true;
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

export const recordAcquiredSkill = (skillId: string): SaveData => {
  const data = loadSaveData();
  if (!data.acquiredSkillsEver.includes(skillId)) {
    data.acquiredSkillsEver.push(skillId);
  }
  saveSaveData(data);
  return data;
};

export const recordScrap = (amount: number): SaveData => {
  const data = loadSaveData();
  data.scrap += amount;
  saveSaveData(data);
  return data;
};

/**
 * Incremented every time the Battle scene completes (win OR lose). First
 * battle completion unlocks the SANCTUM button on the Title screen.
 */
export const recordBattleCompleted = (): SaveData => {
  const data = loadSaveData();
  data.battlesCompleted += 1;
  saveSaveData(data);
  return data;
};

/** Purchase: deduct scrap and append buff item to pending inventory. Returns
 *  `null` if the player cannot afford it OR already holds an unconsumed copy
 *  (each buff is buy-once until next battle drains it). */
export const purchaseSanctumBuff = (itemKey: string, scrapCost: number): SaveData | null => {
  const data = loadSaveData();
  if (data.scrap < scrapCost) return null;
  if (data.ownedBuffItems.includes(itemKey)) return null;
  data.scrap -= scrapCost;
  data.ownedBuffItems.push(itemKey);
  saveSaveData(data);
  return data;
};

/** Drain the pending buff inventory (called when Battle starts). */
export const consumeOwnedBuffs = (): readonly string[] => {
  const data = loadSaveData();
  const drained = [...data.ownedBuffItems];
  if (drained.length === 0) return drained;
  data.ownedBuffItems = [];
  saveSaveData(data);
  return drained;
};

export const isRobotUnlocked = (robotKey: RobotKey): boolean => {
  const data = loadSaveData();
  return data.unlockedRobots.includes(robotKey);
};

/**
 * Check if the super boss is unlocked:
 *   1. All 4 cyborgs have at least 1 clear each.
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
    localStorage.removeItem('soul-strike-save-v1');
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
