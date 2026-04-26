/**
 * SOUL STRIKE — data layer barrel export.
 *
 * Usage:
 *   import { PARTS, ROBOTS, ECONOMY, SYNERGIES } from '@/data';
 *
 * Game code should always import through this module. Importing the sibling
 * files directly scatters paths across the codebase and makes refactors harder.
 */

export { PARTS, ALL_PART_KEYS } from './parts';
export type { PartKey } from './parts';

export { ROBOTS, ALL_ROBOT_KEYS } from './robots';
export type { RobotKey } from './robots';

export { ECONOMY } from './economy';

export { SYNERGIES, ALL_SYNERGY_KEYS } from './synergies';
export type { SynergyKey } from './synergies';

export { PLACEMENT_SYNERGIES, ALL_PLACEMENT_SYNERGY_IDS } from './placementSynergies';
export type { PlacementSynergyDef, PlacementSynergyEffect, PlacementSlotPattern, PlacementSynergyId } from './placementSynergies';

export { ITEMS, ALL_ITEM_KEYS, isItemKey } from './items';
export type { ItemKey } from './items';

export { SKILLS, ALL_SKILL_IDS, findSkillDef, rollSkillChoices } from './skills';
export type { SkillDef, SkillEffectKind } from './skills';

export { ROBOT_ULTIMATES, ENEMY_ULTIMATES } from './ultimates';
export type { UltimateDef, UltimateEffect } from './ultimates';

export { ULT_PITCH_BY_ROBOT } from './audioProfile';

export {
  NORMAL_ENEMIES,
  MID_BOSSES,
  BIG_BOSSES,
  SUPER_BOSS,
  ALL_ENEMY_IDS,
  TOTAL_COLLECTIBLE_ENEMIES,
  findEnemyDef
} from './enemies';
export type { EnemyDef, EnemyWeaponDef } from './enemies';

export type {
  PartId,
  RobotId,
  SlotId,
  RoundId,
  SynergyId,
  SlotType,
  PartCategory,
  RobotArchetype,
  WeaponRange,
  PartData,
  WeaponPart,
  ArmorPart,
  EnginePart,
  GearPart,
  SpecialPart,
  SlotDef,
  RobotData,
  EnemyData,
  RoundData,
  EconomyData,
  SynergyData,
  SynergyTrigger,
  SynergyEffect,
  ItemId,
  ItemData,
  ItemTiming,
  ItemEffect,
  ItemsRegistry,
  StatusEffectKind,
  StatusEffectDef,
  PartRarity
} from './schema';
