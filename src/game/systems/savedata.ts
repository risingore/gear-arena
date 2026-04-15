/**
 * Persistent best-run tracking via localStorage.
 *
 * Silently falls back to empty data when localStorage is unavailable (SSR,
 * some iframes, privacy modes). The game must stay playable regardless.
 */

import { ALL_ROBOT_KEYS, type RobotKey } from '@/data';

const STORAGE_KEY = 'gear-arena-save-v1';

export interface SaveData {
  bestRound: number;
  totalClears: number;
  perRobotClears: Record<RobotKey, number>;
}

const emptySave = (): SaveData => {
  const perRobotClears = {} as Record<RobotKey, number>;
  for (const key of ALL_ROBOT_KEYS) perRobotClears[key] = 0;
  return { bestRound: 0, totalClears: 0, perRobotClears };
};

export const loadSaveData = (): SaveData => {
  try {
    if (typeof localStorage === 'undefined') return emptySave();
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return emptySave();
    const parsed = JSON.parse(raw) as Partial<SaveData>;
    const base = emptySave();
    return {
      bestRound: typeof parsed.bestRound === 'number' ? parsed.bestRound : 0,
      totalClears: typeof parsed.totalClears === 'number' ? parsed.totalClears : 0,
      perRobotClears: { ...base.perRobotClears, ...(parsed.perRobotClears ?? {}) }
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
  if (data.bestRound < 5) data.bestRound = 5;
  saveSaveData(data);
  return data;
};
