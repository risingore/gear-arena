/**
 * GEAR ARENA — data layer barrel export.
 *
 * Usage:
 *   import { PARTS, ROBOTS, ROUNDS, ECONOMY, SYNERGIES } from '@/data';
 *
 * Game code should always import through this module. Importing the sibling
 * files directly scatters paths across the codebase and makes refactors harder.
 */

export { PARTS, ALL_PART_KEYS } from './parts';
export type { PartKey } from './parts';

export { ROBOTS, ALL_ROBOT_KEYS } from './robots';
export type { RobotKey } from './robots';

export { ROUNDS, ALL_ROUND_KEYS, TOTAL_ROUNDS } from './rounds';
export type { RoundKey } from './rounds';

export { ECONOMY } from './economy';

export { SYNERGIES, ALL_SYNERGY_KEYS } from './synergies';
export type { SynergyKey } from './synergies';

export {
  NORMAL_ENEMIES,
  MID_BOSSES,
  BIG_BOSSES,
  SUPER_BOSS,
  ALL_ENEMY_IDS,
  TOTAL_COLLECTIBLE_ENEMIES
} from './enemies';
export type { EnemyDef } from './enemies';

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
  SynergyEffect
} from './schema';
