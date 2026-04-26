/**
 * SOUL STRIKE — game balance configuration (single source of truth).
 *
 * Every gameplay-relevant number lives here. Any value can be tuned
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
  /** Minimum HP floor. */
  hpFloor: 1,

  // ---------------------------------------------------------------------------
  // Ultimate Power Scaling (from equipped parts)
  // ---------------------------------------------------------------------------
  //
  // Expected combat flow (ultimate-only, no auto-attacks):
  //   1. Player takes passive damage until gauge fills (gaugeFillRatio ~0.4 of maxHP).
  //   2. Player fires ultimate burst (moduleCount strikes × ultDmgPerStrike).
  //   3. Repeat until one side falls.
  //
  // Target kill times (reasonably equipped = 2 modules + 1 booster):
  //   - Early enemies (tier 1-3, HP 30-65):  1 ultimate
  //   - Mid enemies   (tier 4-6, HP 80-120): 1-2 ultimates
  //   - Bosses        (HP 450-600, 15-25% DR): 2-3 ultimates (with late-game gear)
  //
  // Math for baseline (INDRA, 2× Phantom Limb avg 8 dmg, 1 booster):
  //   gearMult = 1 + 1 × 0.25 = 1.25
  //   perStrike = round(8 × 1.25 × 3.5) = 35
  //   2 strikes = 70 total → one-shots tier 1-3 comfortably
  //
  /** Base ultimate damage when no modules equipped (fraction of maxHP). */
  bareUltimateDamageRatio: 0.1,
  /** Per-gear damage multiplier added to ultimate (1 + gearCount * this). */
  gearUltimateMult: 0.25,
  /** Base ultimate damage multiplier (applied on top of weapon average). */
  ultimateBaseMult: 3.5,
  /** Per-engine charge rate bonus (1 + engineCount * this). */
  engineChargeRate: 0.3,
  /**
   * Base ultimate gauge fill per second (continuous, time-based).
   * Multiplied by `attacker.ultimateChargeRate` (engines, rush, etc.).
   * 0.04 → ~10s base for a 0.4 fillRatio robot (auto-FF 1.5× → ~6.7s, rush 1.8× → ~5.6s).
   */
  ultimateGaugeFillPerSec: 0.04,

  // ---------------------------------------------------------------------------
  // Shop & Economy
  // ---------------------------------------------------------------------------
  /** Chance that any given shop slot contains an item instead of a part. (0 = disabled) */
  itemShopChance: 0,
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
  bgmUrgentRate: 1.08,
  /** Normal auto-attack damage ratio for player (0 = no auto-attacks). */
  playerAutoAttackRatio: 0,

  // ---------------------------------------------------------------------------
  // Star Merge
  // ---------------------------------------------------------------------------
  /** Stat multiplier per star level. Index 0 unused, 1=default, 2=merged once, 3=max. */
  starMultipliers: [1.0, 1.0, 1.5, 2.0] as readonly number[],
  /** Maximum star level a part can reach. */
  maxStarLevel: 3,
} as const;
