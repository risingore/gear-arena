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
  /** Fraction of remaining gold converted to scrap on run end (Hard mode). */
  scrapConversionRate: 0.5,
  /** Fraction of remaining gold converted to scrap on run end (Easy mode).
   *  Easy is for practice — players should NOT be able to grind it to amass
   *  enough scrap to clear Hard. Setting Easy at 1/20 of Hard means a long
   *  Easy grind still nets some scrap (psychologically rewarding, "you got
   *  something") but the actual SANCTUM stockpile must come from Hard runs. */
  scrapConversionRateEasy: 0.025,

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
  /**
   * Per-round difficulty ramp for normal enemies and mid-bosses (EXPONENTIAL).
   * Multiplier = roundDifficultyGrowth(easy|hard) ^ (round - 1).
   * Applied to baseHp and baseDamage at generation time, on top of the
   * normal ±variance. Big-boss (final round) is exempt — already tuned.
   *
   * Two curves so each mode reads correctly:
   *
   *   Easy (5 rounds, growth 1.10):
   *     R1=1.00× / R3=1.21× / R5=1.46×  — last mid-boss is a brief test.
   *   Hard (10 rounds, growth 1.18):
   *     R1=1.00× / R5=1.94× / R7=2.70× / R10=4.44×  — gear-walled without
   *     ★3 merges or 3+ SANCTUM buffs by R7-R10.
   */
  roundDifficultyGrowthEasy: 1.10,
  roundDifficultyGrowthHard: 1.18,

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
  // Star Merge (EXPONENTIAL — arms-race scaling)
  // ---------------------------------------------------------------------------
  /** Stat multiplier per star level. Index 0 unused, 1=default, 2=merged once, 3=max.
   *  ★3 = 4× damage / HP / DR — late-game arms-race payoff for committing to a part.
   *  Pairs with the exponential enemy ramp; a fully ★3'd loadout is the ONLY way
   *  to clear Hard buff-less. Without ★3, Hard requires ~3 SANCTUM buffs. */
  starMultipliers: [1.0, 1.0, 2.0, 4.0] as readonly number[],
  /** Maximum star level a part can reach. */
  maxStarLevel: 3,

  // ---------------------------------------------------------------------------
  // Display scale
  // ---------------------------------------------------------------------------
  /** Multiplier baked into every HP / damage / flat-DR / repair value the
   *  moment a combatant is created. Pure cosmetic on the math side: every
   *  stat scales together so the HP/DMG ratio (and ★ merge multipliers,
   *  % DR, lifesteal, etc.) stay invariant — it just pushes the raw
   *  numbers out of single-digit "12 dmg" territory into "1200 dmg" so
   *  combat reads as machine-grade scale. Ratio-based mechanics are
   *  unaffected because they all operate on multipliers, not raw values. */
  statScale: 100,

  /** Extra multiplier applied to ENEMY baseDamage on top of statScale.
   *  statScale alone (100×) made enemy damage outpace the player's
   *  pre-ult survival window — INDRA died in 2 hits before the gauge
   *  could fill once. This trims enemy raw damage so the player has
   *  time to land their first ULT in early rounds, while ramps and
   *  mid-/big-boss tuning still gate Hard mode behind buffs. Player
   *  HP and ULT damage stay at full statScale so ratios remain
   *  player-favourable for early reads. */
  enemyDamageMultiplier: 0.55,
} as const;
