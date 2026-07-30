/**
 * Per-run statistics tracking.
 *
 * Accumulated during battle ticks and displayed on the result / game-over screens.
 */

export interface RunStats {
  totalDamageDealt: number;
  totalDamageTaken: number;
  totalHealed: number;
  roundsCleared: number;
  enemiesDefeated: number;
  partsUsed: number;
  itemsUsed: number;
}

export const createEmptyRunStats = (): RunStats => ({
  totalDamageDealt: 0,
  totalDamageTaken: 0,
  totalHealed: 0,
  roundsCleared: 0,
  enemiesDefeated: 0,
  partsUsed: 0,
  itemsUsed: 0
});
