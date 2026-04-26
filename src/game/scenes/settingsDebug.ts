/**
 * Dev-only debug helpers for the Settings scene.
 *
 * This module is imported behind `import.meta.env.DEV` from Settings.ts,
 * so Vite + Terser tree-shake the entire file out of the production
 * bundle (verified by Skill `dist`'s grep step). Putting these helpers
 * in the Settings class as private methods leaves the method bodies in
 * the prod bundle even when the debugRows array that calls them is
 * already dead-code eliminated.
 *
 * Both jumps create a minimal fake RunState and `previewOnly = true`
 * so no save mutations leak from a debug action.
 */
import type { Scene } from 'phaser';
import { createInitialRunState, setRunState } from '../systems/runState';
import { fadeToScene } from '../systems/transition';
import type { GeneratedRound } from '../systems/enemyPool';
import { ALL_PART_KEYS, JAM_ROBOT_KEYS, SKILLS, type RobotKey } from '@/data';
import { JAM_ENEMY_IDS } from '@/data/enemies';
import { loadSaveData, saveSaveData } from '../systems/savedata';

/** Jump straight to Result with the chosen ending flavour playing end to end. */
export const jumpToEnding = (scene: Scene, mode: 'easy' | 'hard'): void => {
  const fake = createInitialRunState();
  fake.robotKey = 'robot_knight';
  fake.battleOutcome = 'victory';
  fake.gold = 300;
  fake.lastDefeatedEnemyId = 'boss_yuki_onna';
  fake.endingMode = mode;
  fake.previewOnly = true;
  const finalRound: GeneratedRound = {
    index: 5,
    enemy: {
      name: 'YUKIME-Ω',
      hp: 1,
      damage: 1,
      cooldownSec: 1,
      damageReductionPct: 0,
      assetKey: 'boss_yuki_onna',
    },
    enemyId: 'boss_yuki_onna',
    goldReward: 0,
    isBoss: true,
    isSuperBoss: false,
  };
  fake.generatedRounds = [finalRound];
  setRunState(scene, fake);
  fadeToScene(scene, 'Result');
};

/** Jump straight to Battle with `previewCutIn` set, so it plays once and fades back. */
export const jumpToCutInPreview = (
  scene: Scene,
  kind: 'player' | 'enemy',
  enemyId?: string,
): void => {
  const fake = createInitialRunState();
  fake.robotKey = 'robot_knight';
  fake.previewOnly = true;
  fake.previewCutIn = { kind, enemyId };
  // Battle.create() bails to Title when generatedRounds[0] is missing,
  // so always provide a fake round even for player previews. The round's
  // enemy is a dummy that never actually fights (huge HP + cooldown).
  const fakeId = (kind === 'enemy' && enemyId) ? enemyId : 'enemy_mob1';
  const round: GeneratedRound = {
    index: 1,
    enemy: {
      name: fakeId,
      hp: 9999,
      damage: 0,
      cooldownSec: 99,
      damageReductionPct: 0,
      assetKey: fakeId,
    },
    enemyId: fakeId,
    goldReward: 0,
    isBoss: kind === 'enemy',
    isSuperBoss: false,
  };
  fake.generatedRounds = [round];
  setRunState(scene, fake);
  fadeToScene(scene, 'Battle');
};

/**
 * QA helpers to flip every collection-tracking field at once. Touches
 * only what the Collection scene reads (defeated / used / acquired /
 * unlocked / cleared flags + achievement-gating counters); run state
 * (current scrap, equipped buffs, etc.) is left untouched.
 *
 * Skills cap at the mid-boss tier because big-boss skills are
 * unreachable in jam scope (see Collection.ts re: isSuperRoute) —
 * marking them "acquired" would lie about what the player can obtain.
 */
const applyCollectionState = (mode: 'full' | 'empty'): void => {
  const full = mode === 'full';
  const data = loadSaveData();
  data.unlockedRobots = [...JAM_ROBOT_KEYS];
  for (const k of Object.keys(data.perRobotClears) as RobotKey[]) {
    data.perRobotClears[k] = 0;
  }
  if (full) {
    for (const k of JAM_ROBOT_KEYS) data.perRobotClears[k] = 1;
  }
  data.defeatedEnemies = full ? [...JAM_ENEMY_IDS] : [];
  data.usedParts = full ? [...ALL_PART_KEYS] : [];
  data.acquiredSkillsEver = full
    ? SKILLS.filter((s) => s.tier === 'midBoss').map((s) => s.id)
    : [];
  data.totalClears = full ? 10 : 0;
  data.bestRound = full ? 10 : 0;
  data.battlesCompleted = full ? 1 : 0;
  data.easyCleared = full;
  data.hardCleared = full;
  saveSaveData(data);
};

export const unlockAllCollection = (): void => applyCollectionState('full');
export const wipeCollection = (): void => applyCollectionState('empty');
