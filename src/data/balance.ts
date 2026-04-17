/**
 * GEAR ARENA — game balance configuration (single source of truth).
 *
 * Every gameplay-relevant number lives here. Heika can tune any value
 * without touching implementation code.
 */

export const BALANCE = {
  // ---------------------------------------------------------------------------
  // Combat
  // ---------------------------------------------------------------------------
  /** Damage bonus per consecutive hit (1% per hit). */
  comboBonusPerHit: 0.01,
  /** Max combo damage bonus (20%). */
  comboBonusCap: 0.2,
  /** Hard cap on damage reduction percentage in ultimate calculations. */
  damageReductionCapInFormula: 0.9,
  /** DR percentage cap from loadout stats. */
  damageReductionCap: 0.8,
  /** Max evasion chance (30%). */
  evasionCap: 0.3,
  /** HP ratio at which Overdrive triggers. */
  overdriveTriggerRatio: 0.3,
  /** Repair Kit interval in seconds. */
  repairIntervalSec: 5,
  /** Minimum weapon cooldown floor in seconds. */
  minCooldownSec: 0.2,
  /** Bare-fist fallback base cooldown (before attack speed). */
  fistBaseCooldown: 2.0,
  /** Minimum HP floor. */
  hpFloor: 1,

  // ---------------------------------------------------------------------------
  // Ultimate Power Scaling (from equipped parts)
  // ---------------------------------------------------------------------------
  /** Per-gear damage multiplier added to ultimate (1 + gearCount * this). */
  gearUltimateMult: 0.25,
  /** Base ultimate damage multiplier (applied on top of weapon average). */
  ultimateBaseMult: 2,
  /** Per-engine charge rate bonus (1 + engineCount * this). */
  engineChargeRate: 0.3,

  // ---------------------------------------------------------------------------
  // Shop & Economy
  // ---------------------------------------------------------------------------
  /** Chance that any given shop slot contains an item instead of a part. */
  itemShopChance: 0.2,
  /** Round after which epic-rarity parts can appear in shop. */
  epicUnlockRound: 5,
  /** Reroll cost increases by +1g every N rerolls. */
  rerollCostStep: 3,
  /** Fraction of remaining gold converted to scrap on run end. */
  scrapConversionRate: 0.5,

  // ---------------------------------------------------------------------------
  // Enemy Generation
  // ---------------------------------------------------------------------------
  /** ±variance applied to normal enemy stats. */
  normalEnemyVariance: 0.10,
  /** Max tier for easy pool. */
  easyTierMax: 5,
  /** Tier range for mid pool. */
  midTierMin: 4,
  midTierMax: 7,
  /** Min tier for hard pool. */
  hardTierMin: 6,

  // ---------------------------------------------------------------------------
  // Battle UX
  // ---------------------------------------------------------------------------
  /** Player HP ratio at which BGM tempo increases. */
  bgmUrgentHpRatio: 0.3,
  /** BGM playback rate when HP is critical. */
  bgmUrgentRate: 1.15,
  /** Normal auto-attack damage ratio for player (0 = no auto-attacks). */
  playerAutoAttackRatio: 0,
} as const;
