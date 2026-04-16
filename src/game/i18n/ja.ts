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
  SETTINGS: 'SETTINGS',
  'BGM Volume': 'BGM Volume',
  'SFX Volume': 'SFX Volume',
  Language: 'Language',
  Fullscreen: 'Fullscreen',
  'Battle Speed': 'Battle Speed',
  'Debug Mode': 'Debug Mode',
  'RESET ALL DATA': 'RESET ALL DATA',
  'Click again to confirm': 'Click again to confirm',
  'Data reset. Reloading...': 'Data reset. Reloading...',
  COLLECTION: 'COLLECTION',
  MACHINES: 'MACHINES',
  PARTS: 'PARTS',
  ENEMIES: 'ENEMIES',
  'BACK TO TITLE': 'BACK TO TITLE',
  unlocked: 'unlocked',
  discovered: 'discovered',
  defeated: 'defeated',
  clears: 'clears',
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
  'Special effects +50% / weapon cooldown +15%.': 'Special effects +50% / weapon cooldown +15%.',

  // ---------------------------------------------------------------------------
  // Item names and descriptions
  // ---------------------------------------------------------------------------
  'Repair Spray': 'リペアスプレー',
  'Emergency Patch': '応急パッチ',
  'Adrenaline Shot': 'アドレナリン・ショット',
  'Hardened Coating': '硬化コーティング',
  'Recon Scan': '偵察スキャン',
  'Restore 20 HP immediately.': '即座にHPを20回復。',
  'Restore 40 HP immediately.': '即座にHPを40回復。',
  'Next battle: +30% attack speed.': '次の戦闘: 攻撃速度+30%。',
  'Next battle: +10% damage reduction.': '次の戦闘: ダメージ軽減+10%。',
  'Next battle: enemy takes +20% damage.': '次の戦闘: 敵の被ダメージ+20%。',

  // ---------------------------------------------------------------------------
  // Skill names and descriptions
  // ---------------------------------------------------------------------------
  'Iron Will': '鉄の意志',
  '+15 max HP.': '最大HP+15。',
  'Quick Draw': 'クイックドロー',
  '-10% weapon cooldown.': '武器クールダウン-10%。',
  'Hard Shell': '硬殻',
  '+5% damage reduction.': 'ダメージ軽減+5%。',
  'Power Surge': 'パワーサージ',
  '+3 weapon damage.': '武器ダメージ+3。',
  'Nano Repair': 'ナノリペア',
  'Heal 2 HP every 5 seconds.': '5秒ごとにHP2回復。',
  'Reflex Boost': 'リフレクスブースト',
  '-15% weapon cooldown.': '武器クールダウン-15%。',
  'Vital Core': 'バイタルコア',
  '+30 max HP.': '最大HP+30。',
  'Piercing Eye': 'ピアシングアイ',
  '+6 weapon damage.': '武器ダメージ+6。',
  'Titan Frame': 'タイタンフレーム',
  '+8% damage reduction.': 'ダメージ軽減+8%。',
  'Overdrive Protocol': 'オーバードライブ・プロトコル',
  '+25% attack speed below 30% HP.': 'HP30%以下で攻撃速度+25%。',

  // ---------------------------------------------------------------------------
  // Achievement names, descriptions, and titles
  // ---------------------------------------------------------------------------
  'First Victory': '初勝利',
  'Clear any run.': '任意のランをクリア。',
  'Rookie Pilot': 'ルーキーパイロット',
  Seasoned: '歴戦',
  'Win 5 total runs.': '合計5回クリア。',
  'Veteran Pilot': 'ベテランパイロット',
  'War Machine': 'ウォーマシン',
  'Win 10 total runs.': '合計10回クリア。',
  'Machine Master': 'マシンマスター',
  'Clear with all 4 robots.': '全4機体でクリア。',
  'Full Arsenal': '完全武装',
  'Use all 25 parts at least once.': '全25パーツを使用。',
  'Chief Engineer': 'チーフエンジニア',
  Weaponsmith: 'ウェポンスミス',
  'Use all 5 weapon types.': '全5種の武器を使用。',
  Hunter: 'ハンター',
  'Defeat every enemy type.': '全敵タイプを撃破。',
  'Apex Hunter': 'エイペックスハンター',
  'Apex Predator': 'エイペックスプレデター',
  'Defeat the APEX MACHINE.': 'APEX MACHINEを撃破。',
  'Halfway There': '折り返し地点',
  'Reach round 5.': 'ラウンド5に到達。',
  Cadet: 'カデット',
  Collector: 'コレクター',
  'Defeat 10 different enemy types.': '10種類の敵を撃破。',

  // ---------------------------------------------------------------------------
  // UI strings
  // ---------------------------------------------------------------------------
  SKILLS: 'スキル',
  SKILL: 'スキル',
  BUFF: 'バフ',
  USE: '使用',
  ITEM: 'アイテム',
  'CHOOSE A SKILL': 'スキルを選択',
  CONFIRM: '確定',
  '← BACK': '← 戻る',
  TITLES: '称号',
  'SKILLS DISCOVERED': '発見したスキル',
  skills: 'スキル',
  earned: '獲得',
  BUFFS: 'バフ',
  HP: 'HP',
  Scrap: 'スクラップ',
  'DAILY RUN': 'デイリーラン',
  UNDO: '戻す',
  'NEXT ENEMY': '次の敵',
  '▶  NEXT ROUND': '▶  次のラウンド',
  'QUIT TO TITLE': 'タイトルに戻る',
  '▶  RETURN TO TITLE': '▶  タイトルに戻る',
  '▶  CONTINUE': '▶  続ける',
  'Click shop to buy · Click slots to sell · Drag parts to specific slots':
    'ショップをクリックで購入 · スロットをクリックで売却 · ドラッグで配置',

  // ---------------------------------------------------------------------------
  // Status effects
  // ---------------------------------------------------------------------------
  BURN: '燃焼',
  FREEZE: '凍結',
  POISON: '毒',
  DODGE: '回避',

  // ---------------------------------------------------------------------------
  // New part names and descriptions (v0.3 additions)
  // ---------------------------------------------------------------------------
  Railgun: 'レールガン',
  'Extreme damage, very slow. One-shot potential.': '極大ダメージ、非常に遅い。一撃必殺。',
  Flamethrower: 'フレイムスロワー',
  'Rapid close-range burn. Low per-hit but fast.': '近距離連射。低威力だが高速。',
  'Reactive Plating': 'リアクティブ装甲',
  'Flat -4 damage taken but -10 max HP.': 'ダメージ-4だが最大HP-10。',
  'Fortress Frame': 'フォートレスフレーム',
  '+30 max HP and 10% DR. Heavy but durable.': '最大HP+30、DR10%。重いが頑丈。',
  'Striker Core': 'ストライカーコア',
  '+5 damage to all weapons. No HP bonus.': '全武器ダメージ+5。HP増加なし。',
  'Regen Cell': 'リジェンセル',
  '+15 max HP and 3% damage reduction.': '最大HP+15、ダメージ軽減3%。',
  'Micro Gear': 'マイクロギア',
  '-5% cooldown. Cheap filler.': 'クールダウン-5%。安価。',
  'Overclock Gear': 'オーバークロックギア',
  '-25% cooldown, -10 max HP. Glass cannon.': 'クールダウン-25%、最大HP-10。',
  'Last Stand Module': 'ラストスタンド・モジュール',
  'Survive one lethal hit with 1 HP (once per battle).': '致死ダメージを1回HP1で耐える。',
  'Vampiric Core': 'ヴァンパイリック・コア',
  'Heal 2 HP on every weapon hit.': '武器命中ごとにHP2回復。',
  'Blocks the first hit completely, then +5% DR.': '最初の被弾を完全防御、以降DR+5%。'
};
