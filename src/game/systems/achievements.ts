/**
 * Achievement evaluation — derives earned achievements from SaveData.
 *
 * No additional storage: achievements are computed on the fly from the
 * existing save data (clears, defeated enemies, used parts, best round).
 */

import { ACHIEVEMENTS, type AchievementDef } from '@/data/achievements';
import { ALL_PART_KEYS, JAM_ROBOT_KEYS, SKILLS } from '@/data';
import { JAM_ENEMY_IDS } from '@/data/enemies';
import type { SaveData } from './savedata';

type CheckFn = (save: SaveData) => boolean;

// `ach_all_robots` and `ach_apex` were dropped in Ep0 jam scope (only
// INDRA ships, Daitengu is dormant). The remaining checks measure
// against the jam-active rosters: 25 parts, 5 weapon modules, 17 enemy
// types (JAM_ENEMY_IDS).
const CHECKS: Record<string, CheckFn> = {
  ach_first_win:   (s) => s.totalClears >= 1,
  ach_5_wins:      (s) => s.totalClears >= 5,
  ach_10_wins:     (s) => s.totalClears >= 10,
  ach_all_parts:   (s) => s.usedParts.length >= ALL_PART_KEYS.length,
  ach_all_weapons: (s) => {
    const weapons = ALL_PART_KEYS.filter((k) => k.startsWith('weapon_'));
    return weapons.every((w) => s.usedParts.includes(w));
  },
  ach_all_enemies: (s) => {
    const defeated = new Set(s.defeatedEnemies);
    return JAM_ENEMY_IDS.every((id) => defeated.has(id));
  },
  ach_round_5:     (s) => s.bestRound >= 5,
  ach_collector:   (s) => s.defeatedEnemies.length >= 10,
  // Collect King — earns when every Ep0 collection is at 100 %.
  // Mirrors the per-tab fill criteria the Collection scene uses
  // (1 machine cleared, all 25 parts, all 17 jam enemies, all 6
  // reachable mid-boss skills). Big-boss tier skills are excluded
  // because they are unreachable in Ep0 (super-route gate).
  ach_collect_king: (s) => {
    const machineDone = JAM_ROBOT_KEYS.every((k) => (s.perRobotClears[k] ?? 0) > 0);
    const partsDone = s.usedParts.length >= ALL_PART_KEYS.length;
    const defeated = new Set(s.defeatedEnemies);
    const enemiesDone = JAM_ENEMY_IDS.every((id) => defeated.has(id));
    const acquired = new Set(s.acquiredSkillsEver);
    const skillsDone = SKILLS.filter((sk) => sk.tier === 'midBoss').every((sk) => acquired.has(sk.id));
    return machineDone && partsDone && enemiesDone && skillsDone;
  },
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
