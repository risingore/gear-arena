/**
 * SOUL STRIKE — canonical enemy pool (v0.1, 2026-04-15).
 *
 * All values are tunable. Edit HP, damage, cooldown, and descriptions.
 *
 * Categories:
 *   normal  — 10 base designs. Each run also generates ±10% stat
 *             variants so the player never fights the exact same lineup.
 *   midBoss — 5 designs. Two appear per run (rounds 4 and 7).
 *   bigBoss — 3 designs. One appears per run (round 10).
 *   super   — 1 design. Appears as round 11 only after the player
 *             has cleared with all 4 cyborgs AND defeated every other
 *             enemy at least once (tracked in localStorage).
 */

export interface EnemyWeaponDef {
  readonly label: string;
  readonly damage: number;
  readonly cooldownSec: number;
}

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
  /** Short flavor text for display (optional — newly added mob1..14
   *  rows omit it, will fall back to '' at the call site). */
  readonly flavorText?: string;
  /** Extra weapons beyond the primary attack (optional). */
  readonly extraWeapons?: readonly EnemyWeaponDef[];
  /** Shield charges that block the first N player hits (optional). */
  readonly shieldCharges?: number;
  /** HP healed per repair tick; 0 or omitted = no healing (optional). */
  readonly repairAmount?: number;
  /** Repair tick interval in seconds (optional, default 5). */
  readonly repairIntervalSec?: number;
}

// ============================================================
// Normal enemies (13) — Episode 0 jam scope. Each entry corresponds to
// `public/assets/sprites/enemy_mob<N>.png`. mob12 is intentionally
// vacant (the roster skipped that slot — fill later).
//
// Tier curve covers easyPool (≤5), midPool (4-7), hardPool (≥6) with
// duplicates at tiers 5/8/10 to keep all three pools well-stocked.
// ============================================================

export const NORMAL_ENEMIES: readonly EnemyDef[] = [
  { id: 'enemy_mob1',  name: 'Scrap Hopper',    baseHp: 30,  baseDamage: 4,  baseCooldownSec: 1.8, baseDamageReductionPct: 0,    category: 'normal', tier: 1,  assetKey: 'enemy_mob1',
    flavorText: "Smallest of YOMI's patrol drones. One leg, one optic, one purpose." },
  { id: 'enemy_mob2',  name: 'Rust Imp',        baseHp: 50,  baseDamage: 6,  baseCooldownSec: 1.6, baseDamageReductionPct: 0,    category: 'normal', tier: 2,  assetKey: 'enemy_mob2',
    flavorText: 'Skitters along discarded conduits. Reads thermal noise as scripture.' },
  { id: 'enemy_mob3',  name: 'Bolt Skitterer',  baseHp: 65,  baseDamage: 7,  baseCooldownSec: 1.4, baseDamageReductionPct: 0.03, category: 'normal', tier: 3,  assetKey: 'enemy_mob3',
    flavorText: 'Eight gimbal-legs spider across pipes. Carries a charge that bites.' },
  { id: 'enemy_mob4',  name: 'Cog Hound',       baseHp: 80,  baseDamage: 9,  baseCooldownSec: 1.3, baseDamageReductionPct: 0.05, category: 'normal', tier: 4,  assetKey: 'enemy_mob4',
    flavorText: 'Sniffs for serial numbers that walked away from their owners.' },
  { id: 'enemy_mob5',  name: 'Piston Brute',    baseHp: 100, baseDamage: 11, baseCooldownSec: 1.5, baseDamageReductionPct: 0.05, category: 'normal', tier: 5,  assetKey: 'enemy_mob5',
    flavorText: 'Each step compresses three atmospheres of black pneumatic dread.' },
  { id: 'enemy_mob6',  name: 'Arc Stalker',     baseHp: 120, baseDamage: 13, baseCooldownSec: 1.2, baseDamageReductionPct: 0.08, category: 'normal', tier: 6,  assetKey: 'enemy_mob6',
    flavorText: 'Drags a cable behind it. Strike fast, before the cable touches you.' },
  { id: 'enemy_mob7',  name: 'Rivet Sentinel',  baseHp: 150, baseDamage: 15, baseCooldownSec: 1.1, baseDamageReductionPct: 0.08, category: 'normal', tier: 7,  assetKey: 'enemy_mob7',
    flavorText: 'Scans, archives, fires — in that order. Always.' },
  { id: 'enemy_mob8',  name: 'Slag Walker',     baseHp: 180, baseDamage: 17, baseCooldownSec: 1.4, baseDamageReductionPct: 0.12, category: 'normal', tier: 8,  assetKey: 'enemy_mob8',
    flavorText: 'Forged from melted resistance. The plates still remember being something else.' },
  { id: 'enemy_mob9',  name: 'Pyre Carver',     baseHp: 210, baseDamage: 19, baseCooldownSec: 1.0, baseDamageReductionPct: 0.10, category: 'normal', tier: 9,  assetKey: 'enemy_mob9',
    flavorText: 'Heats its blade in its own exhaust. Cuts through cold things.' },
  { id: 'enemy_mob10', name: 'Magma Crawler',   baseHp: 250, baseDamage: 22, baseCooldownSec: 1.3, baseDamageReductionPct: 0.12, category: 'normal', tier: 10, assetKey: 'enemy_mob10',
    flavorText: 'Treads liquefy the floor. The treads do not stop.' },
  // Tier-5 / 8 / 10 fillers for midPool and hardPool variety.
  { id: 'enemy_mob11', name: 'Coil Mauler',     baseHp: 105, baseDamage: 12, baseCooldownSec: 1.4, baseDamageReductionPct: 0.06, category: 'normal', tier: 5,  assetKey: 'enemy_mob11',
    flavorText: 'Wraps prey in its own discharge. Bills the corpse afterwards.' },
  { id: 'enemy_mob13', name: 'Shred Auger',     baseHp: 190, baseDamage: 18, baseCooldownSec: 1.3, baseDamageReductionPct: 0.10, category: 'normal', tier: 8,  assetKey: 'enemy_mob13',
    flavorText: 'Spirals forward. Everything in front becomes fragments.' },
  { id: 'enemy_mob14', name: 'Cinder Behemoth', baseHp: 245, baseDamage: 21, baseCooldownSec: 1.2, baseDamageReductionPct: 0.12, category: 'normal', tier: 10, assetKey: 'enemy_mob14',
    flavorText: 'Was once a recycler. Now refuses to recycle anyone.' },
];

// ============================================================
// Mid-bosses — appear at rounds 4 and 7 (Hard) / round 5 (Easy).
// Episode 0 jam scope ships the lower-tier yokai (bakeneko / nopperabo /
// karakasa). The upper-tier set (iron_sentinel / volt_charger /
// shield_golem / flame_mantis / frost_walker) is kept dormant for Ep1.
// ============================================================

export const MID_BOSSES: readonly EnemyDef[] = [
  // --- Episode 0 jam scope ---
  { id: 'midboss_bakeneko',      name: 'Bakeneko',          baseHp: 220, baseDamage: 20, baseCooldownSec: 1.0, baseDamageReductionPct: 0.08, category: 'midBoss', tier: 5, assetKey: 'midboss_bakeneko',
    flavorText: 'An AI mimicking the long-lived cat that learned to take human form.',
    extraWeapons: [{ label: 'Pounce', damage: 9, cooldownSec: 1.6 }] },
  { id: 'midboss_nopperabo',     name: 'Noppera-bo',        baseHp: 240, baseDamage: 18, baseCooldownSec: 1.2, baseDamageReductionPct: 0.12, category: 'midBoss', tier: 5, assetKey: 'midboss_nopperabo',
    flavorText: 'An AI mimicking the faceless yokai that wears the face of someone you trust.',
    extraWeapons: [{ label: 'Mimic Strike', damage: 14, cooldownSec: 2.2 }], shieldCharges: 2 },
  { id: 'midboss_karakasa',      name: 'Karakasa Obake',    baseHp: 180, baseDamage: 14, baseCooldownSec: 1.3, baseDamageReductionPct: 0.10, category: 'midBoss', tier: 5, assetKey: 'midboss_karakasa',
    flavorText: 'An AI mimicking the one-legged umbrella tsukumogami that startles passersby.',
    extraWeapons: [{ label: 'Hop Slam', damage: 11, cooldownSec: 2.0 }] },

  // --- Reserved for Episode 1 (not in jam scope) ---
  { id: 'midboss_iron_sentinel', name: 'Ibaraki Doji',     baseHp: 200, baseDamage: 16, baseCooldownSec: 1.3, baseDamageReductionPct: 0.12, category: 'midBoss', tier: 5, assetKey: 'midboss_sentinel',
    flavorText: 'An AI mimicking the one-armed oni of Rashomon.',
    extraWeapons: [{ label: 'Iron Bash', damage: 8, cooldownSec: 2.5 }], shieldCharges: 1 },
  { id: 'midboss_volt_charger',  name: 'Raijuu',            baseHp: 180, baseDamage: 20, baseCooldownSec: 1.0, baseDamageReductionPct: 0.08, category: 'midBoss', tier: 5, assetKey: 'midboss_charger',
    flavorText: 'An AI mimicking the thunder beast that rides lightning.',
    extraWeapons: [{ label: 'Volt Burst', damage: 12, cooldownSec: 1.8 }] },
  { id: 'midboss_shield_golem',  name: 'Gashadokuro',      baseHp: 260, baseDamage: 12, baseCooldownSec: 1.5, baseDamageReductionPct: 0.20, category: 'midBoss', tier: 5, assetKey: 'midboss_golem',
    flavorText: 'An AI mimicking the giant skeleton assembled from the war-dead.',
    shieldCharges: 2, repairAmount: 3, repairIntervalSec: 6 },
  { id: 'midboss_flame_mantis',  name: 'Jorougumo',        baseHp: 170, baseDamage: 22, baseCooldownSec: 0.9, baseDamageReductionPct: 0.05, category: 'midBoss', tier: 5, assetKey: 'midboss_mantis',
    flavorText: 'An AI mimicking the ancient spider that lures prey as a beautiful woman.',
    extraWeapons: [{ label: 'Flame Spit', damage: 6, cooldownSec: 0.5 }] },
  { id: 'midboss_frost_walker',  name: 'Yuki Onna (mid)',   baseHp: 220, baseDamage: 14, baseCooldownSec: 1.2, baseDamageReductionPct: 0.15, category: 'midBoss', tier: 5, assetKey: 'midboss_frost',
    flavorText: 'An AI mimicking the snow woman who freezes travelers with her breath. (Ep1 reserve — Ep0 promotes Yuki Onna to big boss.)',
    extraWeapons: [{ label: 'Frost Spike', damage: 10, cooldownSec: 2.0 }], repairAmount: 2, repairIntervalSec: 5 },
];

// ============================================================
// Big bosses — appear at round 10 (Hard).
// Episode 0 jam scope ships Yuki Onna only. The upper-tier set
// (Shuten Doji / Tamamo-no-Mae / Nue) is kept dormant for Ep1.
// ============================================================

export const BIG_BOSSES: readonly EnemyDef[] = [
  // --- Episode 0 jam scope ---
  { id: 'boss_yuki_onna',       name: 'Yuki Onna',         baseHp: 700, baseDamage: 26, baseCooldownSec: 1.4, baseDamageReductionPct: 0.20, category: 'bigBoss', tier: 10, assetKey: 'boss_yuki_onna',
    flavorText: 'An AI mimicking the snow woman whose breath freezes the dying. The kindest kill in the catalogue.',
    extraWeapons: [{ label: 'Frozen Breath', damage: 16, cooldownSec: 2.4 }, { label: 'Whiteout', damage: 40, cooldownSec: 4.5 }], shieldCharges: 3, repairAmount: 5, repairIntervalSec: 7 },

  // --- Reserved for Episode 1 (not in jam scope) ---
  { id: 'boss_leviathan',       name: 'Shuten Doji',       baseHp: 500, baseDamage: 30, baseCooldownSec: 1.3, baseDamageReductionPct: 0.18, category: 'bigBoss', tier: 10, assetKey: 'boss_leviathan',
    flavorText: 'An AI mimicking the king of oni who ruled Mt. Ooe.',
    extraWeapons: [{ label: 'Tail Sweep', damage: 15, cooldownSec: 2.0 }, { label: 'Deep Charge', damage: 40, cooldownSec: 4.0 }], shieldCharges: 2 },
  { id: 'boss_colossus',        name: 'Tamamo-no-Mae',     baseHp: 600, baseDamage: 25, baseCooldownSec: 1.5, baseDamageReductionPct: 0.25, category: 'bigBoss', tier: 10, assetKey: 'boss_colossus',
    flavorText: 'An AI mimicking the nine-tailed fox that infiltrated the imperial court.',
    extraWeapons: [{ label: 'Ground Pound', damage: 20, cooldownSec: 3.0 }], shieldCharges: 3, repairAmount: 5, repairIntervalSec: 8 },
  { id: 'boss_storm_kaiser',    name: 'Nue',               baseHp: 450, baseDamage: 35, baseCooldownSec: 1.1, baseDamageReductionPct: 0.15, category: 'bigBoss', tier: 10, assetKey: 'boss_kaiser',
    flavorText: 'An AI mimicking the chimera that plagued the emperor.',
    extraWeapons: [{ label: 'Lightning Arc', damage: 18, cooldownSec: 1.5 }, { label: 'Thunder Crash', damage: 50, cooldownSec: 5.0 }] },
];

// ============================================================
// Super boss (1) — unlocked after all robots cleared + all enemies defeated
// ============================================================

export const SUPER_BOSS: EnemyDef = {
  id: 'superboss_apex',
  name: 'Daitengu',
  baseHp: 999,
  baseDamage: 40,
  baseCooldownSec: 1.0,
  baseDamageReductionPct: 0.25,
  category: 'super',
  tier: 99,
  assetKey: 'superboss_apex',
  flavorText: 'The traitor among ATMAN\'s eight. It raised the boy. Now it awaits the strike it cannot give itself.',
  extraWeapons: [
    { label: 'Apex Cannon', damage: 25, cooldownSec: 1.8 },
    { label: 'Extinction Beam', damage: 60, cooldownSec: 6.0 }
  ],
  shieldCharges: 3,
  repairAmount: 8,
  repairIntervalSec: 7
};

/** Every enemy ID in the game (for collection tracking). */
export const ALL_ENEMY_IDS: readonly string[] = [
  ...NORMAL_ENEMIES.map((e) => e.id),
  ...MID_BOSSES.map((e) => e.id),
  ...BIG_BOSSES.map((e) => e.id),
  SUPER_BOSS.id
];

export const TOTAL_COLLECTIBLE_ENEMIES = ALL_ENEMY_IDS.length;

const ALL_ENEMY_DEFS: readonly EnemyDef[] = [
  ...NORMAL_ENEMIES,
  ...MID_BOSSES,
  ...BIG_BOSSES,
  SUPER_BOSS
];

export const findEnemyDef = (id: string): EnemyDef | undefined =>
  ALL_ENEMY_DEFS.find((d) => d.id === id);
