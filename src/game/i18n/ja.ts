/**
 * Japanese dictionary.
 *
 * Status: placeholder — every entry currently holds the English source verbatim.
 * Replace the right-hand side values with Japanese translations whenever you
 * want, one row at a time. Keys without a row here automatically fall back to
 * the English source, so partial coverage is always safe.
 *
 * Editor workflow:
 *   - Left side (key): English source exactly as it appears in game code / data.
 *   - Right side (value): translated string. Leave as English to keep the
 *     current behavior.
 *
 * To verify your translation shows up:
 *   1. Set locale to `ja` via localStorage key `gear-arena-locale` or by
 *      loading the page with browser language set to Japanese.
 *   2. Reload.
 */

import type { LocaleDict } from './locales';

export const ja: LocaleDict = {
  // ---------------------------------------------------------------------------
  // Title / menus
  // ---------------------------------------------------------------------------
  'Slot-based Mecha Auto-Battler': 'Slot-based Mecha Auto-Battler',
  'Press SPACE or click to start': 'Press SPACE or click to start',
  'R = restart anytime': 'R = restart anytime',
  'Gamedev.js Jam 2026 / theme: Machines': 'Gamedev.js Jam 2026 / theme: Machines',

  // ---------------------------------------------------------------------------
  // Select scene
  // ---------------------------------------------------------------------------
  'SELECT YOUR MACHINE': 'SELECT YOUR MACHINE',
  '← →  to browse    ENTER  to confirm': '← →  to browse    ENTER  to confirm',

  // ---------------------------------------------------------------------------
  // Build scene
  // ---------------------------------------------------------------------------
  'BUILD your machine — click shop or press 1-5 to buy, click slots to sell':
    'BUILD your machine — click shop or press 1-5 to buy, click slots to sell',
  SHOP: 'SHOP',
  SOLD: 'SOLD',
  REROLL: 'REROLL',
  'READY  ▶': 'READY  ▶',
  'MAX HP': 'MAX HP',
  'DR flat': 'DR flat',
  'DR pct': 'DR pct',
  dmg: 'dmg',
  WEAPONS: 'WEAPONS',
  Weapons: 'Weapons',
  '— no weapon equipped —': '— no weapon equipped —',
  BLUEPRINT: 'BLUEPRINT',
  PREVIEW: 'PREVIEW',
  buy: 'buy',
  '(stats unchanged)': '(stats unchanged)',
  'no matching free slot': 'no matching free slot',
  ROUND: 'ROUND',

  // ---------------------------------------------------------------------------
  // Battle scene
  // ---------------------------------------------------------------------------
  BATTLE: 'BATTLE',
  SPEED: 'SPEED',
  '⚠  BOSS BATTLE  ⚠': '⚠  BOSS BATTLE  ⚠',
  'Combat begins…  (SPACE: speed toggle x1 / x2 / x4)':
    'Combat begins…  (SPACE: speed toggle x1 / x2 / x4)',
  'OVERDRIVE!': 'OVERDRIVE!',
  '⚡ TURBO COMBO ⚡': '⚡ TURBO COMBO ⚡',
  '(no weapons)': '(no weapons)',
  'Enemy Strike': 'Enemy Strike',
  Round: 'Round',
  'cleared.': 'cleared.',
  'was destroyed.': 'was destroyed.',
  'VICTORY!  All rounds cleared.': 'VICTORY!  All rounds cleared.',

  // ---------------------------------------------------------------------------
  // Result / GameOver
  // ---------------------------------------------------------------------------
  'ROUND CLEARED': 'ROUND CLEARED',
  'DEFEATED': 'DEFEATED',
  VICTORY: 'VICTORY',
  'GAME OVER': 'GAME OVER',
  'Press SPACE to continue to next round   ·   R to quit':
    'Press SPACE to continue to next round   ·   R to quit',
  'Press SPACE to return to title': 'Press SPACE to return to title',
  'Press SPACE or R to restart': 'Press SPACE or R to restart',
  'Earned gold — total now': 'Earned gold — total now',
  All: 'All',
  'rounds cleared. Final gold:': 'rounds cleared. Final gold:',
  'Reached round': 'Reached round',
  Your: 'Your',
  contained: 'contained',
  weapons: 'weapons',
  armor: 'armor',
  engines: 'engines',
  gears: 'gears',
  specials: 'specials',

  // ---------------------------------------------------------------------------
  // Part names
  // ---------------------------------------------------------------------------
  Chainblade: 'Chainblade',
  'Rivet Cannon': 'Rivet Cannon',
  'Pulse Laser': 'Pulse Laser',
  'Steel Plate': 'Steel Plate',
  'Composite Mesh': 'Composite Mesh',
  'Kinetic Shield': 'Kinetic Shield',
  'Basic Engine': 'Basic Engine',
  'Turbo Engine': 'Turbo Engine',
  'Reactor Core': 'Reactor Core',
  'Small Gear': 'Small Gear',
  'Heavy Gear': 'Heavy Gear',
  'Chrono Gear': 'Chrono Gear',
  'Overdrive Chip': 'Overdrive Chip',
  'Repair Kit': 'Repair Kit',
  'Gear Sync': 'Gear Sync',

  // ---------------------------------------------------------------------------
  // Part descriptions
  // ---------------------------------------------------------------------------
  'Lightweight melee blade. Fast hit rate.': 'Lightweight melee blade. Fast hit rate.',
  'Long-range heavy hitter. Slow to cycle.': 'Long-range heavy hitter. Slow to cycle.',
  'Piercing mid-range laser.': 'Piercing mid-range laser.',
  'Flat -2 damage taken. Forgiving for new pilots.': 'Flat -2 damage taken. Forgiving for new pilots.',
  '15% incoming damage reduction.': '15% incoming damage reduction.',
  '+15 max HP and 5% damage reduction.': '+15 max HP and 5% damage reduction.',
  '+20 max HP.': '+20 max HP.',
  '+10 max HP and +2 to every weapon.': '+10 max HP and +2 to every weapon.',
  '+40 max HP and 5% damage reduction.': '+40 max HP and 5% damage reduction.',
  '-10% cooldown on every weapon.': '-10% cooldown on every weapon.',
  '-20% cooldown, -5 max HP.': '-20% cooldown, -5 max HP.',
  '-8% cooldown. Stacks for Gear Sync.': '-8% cooldown. Stacks for Gear Sync.',
  '+50% attack speed below 30% HP.': '+50% attack speed below 30% HP.',
  'Heal 3 HP every 5 seconds.': 'Heal 3 HP every 5 seconds.',
  '+3 damage per equipped gear.': '+3 damage per equipped gear.',

  // ---------------------------------------------------------------------------
  // Robot descriptions and passives
  // ---------------------------------------------------------------------------
  'Standard mass-production frame. Head, chest, arms, legs.':
    'Standard mass-production frame. Head, chest, arms, legs.',
  'Heavily armored siege frame. Dense slot layout on legs.':
    'Heavily armored siege frame. Dense slot layout on legs.',
  'Lean strike frame. Headless, dual weapons, gear leg.':
    'Lean strike frame. Headless, dual weapons, gear leg.',
  'Synergy-driven tech frame. Three special slots on the back.':
    'Synergy-driven tech frame. Three special slots on the back.',
  'No passive — straightforward power.': 'No passive — straightforward power.',
  'Damage taken -10% / attack speed -20%.': 'Damage taken -10% / attack speed -20%.',
  'Attack speed +30% / damage taken +10%.': 'Attack speed +30% / damage taken +10%.',
  'Special effects +50% / weapon cooldown +15%.': 'Special effects +50% / weapon cooldown +15%.'
};
