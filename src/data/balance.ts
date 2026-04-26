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
  /** Flat scrap reward per round clear (Hard mode). Indexed by the round
   *  just cleared. Awarded immediately on the ROUND CLEARED screen, not
   *  on death — death simply forfeits future round rewards. This replaces
   *  the old "remaining-gold × conversionRate" formula, which created a
   *  perverse incentive to hoard gold instead of buying parts.
   *
   *  Hard full-clear total = 50+80+120+300+200+240+700+320+380+1500 = 3890.
   *  Mid-boss spikes (R4=300, R7=700) and final boss (R10=1500) pay the
   *  bulk of the run; trash rounds are token rewards. */
  hardRoundClearScrap: {
    1: 50, 2: 80, 3: 120,
    4: 300,            // mid-boss 1
    5: 200, 6: 240,
    7: 700,            // mid-boss 2
    8: 320, 9: 380,
    10: 1500,          // big-boss / final clear
  } as Record<number, number>,
  /** Flat scrap reward for an Easy-mode full clear (R5 victory).
   *  Easy is the practice path — small token reward, not viable for SANCTUM
   *  stockpiling. Hard remains the canonical scrap source. */
  easyVictoryScrap: 100,

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
   *   Hard (10 rounds, growth 1.22):
   *     R1=1.00× / R5=2.21× / R7=3.30× / R9=4.91× — gear-walled without
   *     ★3 merges or 3+ SANCTUM buffs by R7-R10. Big-boss (R10) stays
   *     exempt — tuned via its own baseHp / DR / shields.
   */
  roundDifficultyGrowthEasy: 1.10,
  roundDifficultyGrowthHard: 1.22,

  /** Extra HP / damage multiplier applied to ENEMIES in Easy mode only.
   *  Goal: a part-less INDRA cannot survive a single round — every round
   *  forces the player to equip at least one part to win. With the
   *  baseline statScale (100×) and growth 1.10, INDRA's bare maxHp can
   *  outlast R1 if the player just stalls. Bumping enemy baseHp / dmg by
   *  this factor narrows the survival window so "buy nothing, fight
   *  empty" is no longer viable, while equipping any single part keeps
   *  the round winnable. Tuning this number directly trades against the
   *  jam-clearable threshold — auto-play on adjustments. */
  easyEnemyStatBoost: 1.30,

  /** Extra HP / damage multiplier applied to ENEMIES in Hard mode only.
   *  Symmetric to easyEnemyStatBoost: Hard's gold rewards were raised
   *  so each round funds ~3 parts (~1700g/round), and this boost keeps
   *  the difficulty calibrated against that wallet — without it, the
   *  bigger purse would trivialise the run. Stacks on top of
   *  roundDifficultyGrowthHard (1.18^N-1) so by R10 the effective enemy
   *  scaling is 1.30 × 4.44 = ~5.77×. */
  hardEnemyStatBoost: 1.30,

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
