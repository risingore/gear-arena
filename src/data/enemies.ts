/**
 * GEAR ARENA — canonical enemy pool (v0.1, 2026-04-15).
 *
 * Heika is free to edit HP, damage, cooldown, and descriptions.
 * Kima must not rewrite these values without explicit approval.
 *
 * Categories:
 *   normal  — 10 base designs. Each run also generates ±10% stat
 *             variants so the player never fights the exact same lineup.
 *   midBoss — 5 designs. Two appear per run (rounds 4 and 7).
 *   bigBoss — 3 designs. One appears per run (round 10).
 *   super   — 1 design. Appears as round 11 only after the player
 *             has cleared with all 4 robots AND defeated every other
 *             enemy at least once (tracked in localStorage).
 */

export interface EnemyDef {
  readonly id: string;
  readonly name: string;
  readonly baseHp: number;
  readonly baseDamage: number;
  readonly baseCooldownSec: number;
  readonly baseDamageReductionPct: number;
  readonly category: 'normal' | 'midBoss' | 'bigBoss' | 'super';
  readonly tier: number;
  readonly assetKey: string;
}

// ============================================================
// Normal enemies (10) — tier 1-10 ascending difficulty
// ============================================================

export const NORMAL_ENEMIES: readonly EnemyDef[] = [
  { id: 'enemy_scrap_drone',    name: 'Scrap Drone',      baseHp: 30,  baseDamage: 4,  baseCooldownSec: 1.8, baseDamageReductionPct: 0,    category: 'normal', tier: 1, assetKey: 'enemy_drone' },
  { id: 'enemy_rust_walker',    name: 'Rust Walker',      baseHp: 50,  baseDamage: 6,  baseCooldownSec: 1.6, baseDamageReductionPct: 0,    category: 'normal', tier: 2, assetKey: 'enemy_walker' },
  { id: 'enemy_bolt_spider',    name: 'Bolt Spider',      baseHp: 65,  baseDamage: 7,  baseCooldownSec: 1.4, baseDamageReductionPct: 0.03, category: 'normal', tier: 3, assetKey: 'enemy_spider' },
  { id: 'enemy_gear_hound',     name: 'Gear Hound',       baseHp: 80,  baseDamage: 9,  baseCooldownSec: 1.3, baseDamageReductionPct: 0.05, category: 'normal', tier: 4, assetKey: 'enemy_hound' },
  { id: 'enemy_piston_brute',   name: 'Piston Brute',     baseHp: 100, baseDamage: 11, baseCooldownSec: 1.5, baseDamageReductionPct: 0.05, category: 'normal', tier: 5, assetKey: 'enemy_brute' },
  { id: 'enemy_arc_striker',    name: 'Arc Striker',       baseHp: 120, baseDamage: 13, baseCooldownSec: 1.2, baseDamageReductionPct: 0.08, category: 'normal', tier: 6, assetKey: 'enemy_striker' },
  { id: 'enemy_hover_sentinel', name: 'Hover Sentinel',    baseHp: 150, baseDamage: 15, baseCooldownSec: 1.1, baseDamageReductionPct: 0.08, category: 'normal', tier: 7, assetKey: 'enemy_hover' },
  { id: 'enemy_heavy_bipod',    name: 'Heavy Bipod',       baseHp: 180, baseDamage: 17, baseCooldownSec: 1.4, baseDamageReductionPct: 0.12, category: 'normal', tier: 8, assetKey: 'enemy_bipod' },
  { id: 'enemy_twin_rotor',     name: 'Twin Rotor',        baseHp: 210, baseDamage: 19, baseCooldownSec: 1.0, baseDamageReductionPct: 0.10, category: 'normal', tier: 9, assetKey: 'enemy_rotor' },
  { id: 'enemy_plasma_crawler', name: 'Plasma Crawler',    baseHp: 250, baseDamage: 22, baseCooldownSec: 1.3, baseDamageReductionPct: 0.12, category: 'normal', tier: 10, assetKey: 'enemy_crawler' },
];

// ============================================================
// Mid-bosses (5) — appear at rounds 4 and 7
// ============================================================

export const MID_BOSSES: readonly EnemyDef[] = [
  { id: 'midboss_iron_sentinel', name: 'Iron Sentinel',    baseHp: 200, baseDamage: 16, baseCooldownSec: 1.3, baseDamageReductionPct: 0.12, category: 'midBoss', tier: 5, assetKey: 'midboss_sentinel' },
  { id: 'midboss_volt_charger',  name: 'Volt Charger',     baseHp: 180, baseDamage: 20, baseCooldownSec: 1.0, baseDamageReductionPct: 0.08, category: 'midBoss', tier: 5, assetKey: 'midboss_charger' },
  { id: 'midboss_shield_golem',  name: 'Shield Golem',     baseHp: 260, baseDamage: 12, baseCooldownSec: 1.5, baseDamageReductionPct: 0.20, category: 'midBoss', tier: 5, assetKey: 'midboss_golem' },
  { id: 'midboss_flame_mantis',  name: 'Flame Mantis',     baseHp: 170, baseDamage: 22, baseCooldownSec: 0.9, baseDamageReductionPct: 0.05, category: 'midBoss', tier: 5, assetKey: 'midboss_mantis' },
  { id: 'midboss_frost_walker',  name: 'Frost Walker',     baseHp: 220, baseDamage: 14, baseCooldownSec: 1.2, baseDamageReductionPct: 0.15, category: 'midBoss', tier: 5, assetKey: 'midboss_frost' },
];

// ============================================================
// Big bosses (3) — appear at round 10
// ============================================================

export const BIG_BOSSES: readonly EnemyDef[] = [
  { id: 'boss_leviathan',       name: 'Leviathan',         baseHp: 500, baseDamage: 30, baseCooldownSec: 1.3, baseDamageReductionPct: 0.18, category: 'bigBoss', tier: 10, assetKey: 'boss_leviathan' },
  { id: 'boss_colossus',        name: 'Colossus',          baseHp: 600, baseDamage: 25, baseCooldownSec: 1.5, baseDamageReductionPct: 0.25, category: 'bigBoss', tier: 10, assetKey: 'boss_colossus' },
  { id: 'boss_storm_kaiser',    name: 'Storm Kaiser',      baseHp: 450, baseDamage: 35, baseCooldownSec: 1.1, baseDamageReductionPct: 0.15, category: 'bigBoss', tier: 10, assetKey: 'boss_kaiser' },
];

// ============================================================
// Super boss (1) — unlocked after all robots cleared + all enemies defeated
// ============================================================

export const SUPER_BOSS: EnemyDef = {
  id: 'superboss_apex',
  name: 'APEX MACHINE',
  baseHp: 999,
  baseDamage: 40,
  baseCooldownSec: 1.0,
  baseDamageReductionPct: 0.25,
  category: 'super',
  tier: 99,
  assetKey: 'superboss_apex'
};

/** Every enemy ID in the game (for collection tracking). */
export const ALL_ENEMY_IDS: readonly string[] = [
  ...NORMAL_ENEMIES.map((e) => e.id),
  ...MID_BOSSES.map((e) => e.id),
  ...BIG_BOSSES.map((e) => e.id),
  SUPER_BOSS.id
];

export const TOTAL_COLLECTIBLE_ENEMIES = ALL_ENEMY_IDS.length;
