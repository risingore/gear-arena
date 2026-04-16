/**
 * Achievement evaluation — derives earned achievements from SaveData.
 *
 * No additional storage: achievements are computed on the fly from the
 * existing save data (clears, defeated enemies, used parts, best round).
 */

import { ACHIEVEMENTS, type AchievementDef } from '@/data/achievements';
import { ALL_PART_KEYS, ALL_ROBOT_KEYS } from '@/data';
import type { SaveData } from './savedata';

type CheckFn = (save: SaveData) => boolean;

const CHECKS: Record<string, CheckFn> = {
  ach_first_win:   (s) => s.totalClears >= 1,
  ach_5_wins:      (s) => s.totalClears >= 5,
  ach_10_wins:     (s) => s.totalClears >= 10,
  ach_all_robots:  (s) => ALL_ROBOT_KEYS.every((k) => (s.perRobotClears[k] ?? 0) > 0),
  ach_all_parts:   (s) => s.usedParts.length >= ALL_PART_KEYS.length,
  ach_all_weapons: (s) => {
    const weapons = ALL_PART_KEYS.filter((k) => k.startsWith('weapon_'));
    return weapons.every((w) => s.usedParts.includes(w));
  },
  ach_all_enemies: (s) => s.defeatedEnemies.length >= 18,
  ach_apex:        (s) => s.defeatedEnemies.includes('superboss_apex'),
  ach_round_5:     (s) => s.bestRound >= 5,
  ach_collector:   (s) => s.defeatedEnemies.length >= 10,
};

export interface EarnedAchievement {
  readonly def: AchievementDef;
}

export const getEarnedAchievements = (save: SaveData): EarnedAchievement[] =>
  ACHIEVEMENTS
    .filter((a) => CHECKS[a.id]?.(save) === true)
    .map((def) => ({ def }));

/** Return the highest-tier title the player has earned, or null. */
export const getPlayerTitle = (save: SaveData): string | null => {
  const earned = getEarnedAchievements(save);
  if (earned.length === 0) return null;
  earned.sort((a, b) => b.def.tier - a.def.tier);
  return earned[0]!.def.title;
};
