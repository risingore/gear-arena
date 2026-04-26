/**
 * Japanese dictionary — full coverage.
 */

import type { LocaleDict } from './locales';

export const ja: LocaleDict = {
  // Title / menus
  'Assemble Your Soul. Press the Button. Strike.': 'この一撃に、全てを賭ける。',
  'Press SPACE or click to start': 'SPACE またはクリックでスタート',
  'R = restart anytime': 'R = いつでもリスタート',
  'Gamedev.js Jam 2026 / theme: Machines': 'Gamedev.js Jam 2026 / テーマ: Machines',
  '▶  START': '▶  スタート',

  // Select
  'SELECT YOUR MACHINE': 'サイボーグを選択',
  '← →  to browse    ENTER  to confirm': '← →  で選択    ENTER  で決定',
  'Click a cyborg to deploy': 'クリックで出撃',
  SELECT: '選択',
  'COMING SOON': '近日公開',
  'Clear the previous character to unlock': '前のキャラクターをクリアして解放',

  // Build
  'BUILD your machine — click shop or press 1-5 to buy, click slots to sell':
    '義体を組み立て — ショップをクリック or 1-5キーで購入、スロットクリックで売却',
  'Click shop to buy · Click slots to sell · Drag to place':
    'ショップをクリックで購入 · スロットをクリックで売却 · ドラッグで配置',
  'Click shop to buy · Click slots to sell · Drag parts to specific slots':
    'ショップをクリックで購入 · スロットをクリックで売却 · ドラッグで配置',
  SHOP: 'ショップ',
  SOLD: '売却済',
  REROLL: 'リロール',
  'MAX HP': '最大HP',
  HP: 'HP',
  'DR flat': 'DR固定',
  'DR pct': 'DR%',
  dmg: 'ダメ',
  WEAPONS: 'モジュール',
  Weapons: 'モジュール',
  '— no weapon equipped —': '— モジュール未装備 —',
  BLUEPRINT: '設計図',
  PREVIEW: 'プレビュー',
  buy: '購入',
  '(stats unchanged)': '(変化なし)',
  'no matching free slot': '空きスロットなし',
  ROUND: 'ラウンド',
  UNDO: '取消',
  'NEXT ENEMY': '次の敵',
  SKILLS: 'スキル',
  SKILL: 'スキル',
  BUFFS: 'バフ',
  BUFF: 'バフ',
  USE: '使用',
  ITEM: 'アイテム',
  '(40% in auto-attack)': '(通常攻撃は40%)',

  // Battle
  BATTLE: 'バトル',
  SPEED: '速度',
  '⚠  BOSS BATTLE  ⚠': '⚠  ボス戦  ⚠',
  'Combat begins…  (SPACE: speed toggle x1 / x2 / x4)':
    'バトル開始…  (SPACE: 速度切替 x1 / x2 / x4)',
  'SPACE / Click = SOUL STRIKE  |  S = speed toggle':
    'SPACE / クリック = SOUL STRIKE  |  S = 速度切替',
  'OVERDRIVE!': 'オーバードライブ!',
  '⚡ TURBO COMBO ⚡': '⚡ ターボコンボ ⚡',
  '(no weapons)': '(モジュールなし)',
  'Enemy Strike': '敵の攻撃',
  Round: 'ラウンド',
  'cleared.': 'クリア。',
  'was destroyed.': 'は破壊された。',
  'VICTORY!  All rounds cleared.': '勝利！  全ラウンドクリア。',
  Strike: '打撃',
  Fist: '素手',
  DODGE: '回避',

  // Result / GameOver
  'ROUND CLEARED': 'ラウンドクリア',
  DEFEATED: '敗北',
  VICTORY: '勝利',
  'GAME OVER': 'ゲームオーバー',
  'Press SPACE to continue to next round   ·   R to quit':
    'SPACE で次のラウンド   ·   R で終了',
  'Press SPACE to return to title': 'SPACE でタイトルに戻る',
  'Press SPACE or R to restart': 'SPACE または R でリスタート',
  '▶  NEXT ROUND': '▶  次のラウンド',
  'QUIT TO TITLE': 'タイトルに戻る',
  '▶  RETURN TO TITLE': '▶  タイトルに戻る',
  'RETURN TO TITLE': 'タイトルに戻る',
  '▶  CONTINUE': '▶  続ける',
  // Title overlay menu labels
  PLAY: 'プレイ',
  START: 'スタート',
  EASY: 'イージー',
  HARD: 'ハード',
  'Clear Easy to unlock Hard': 'イージー攻略でハード解放',
  // ED sequence
  'TO BE CONTINUED:': '続く：',
  // Thesis and Atman quotes used by overlays and Select
  'The soul is a myth.': '魂は神話だ。',
  "What you call 'soul' is merely unprocessed data.": 'お前の言う「魂」は、未処理のデータに過ぎない。',
  '— ATMAN, broadcast': '— ATMAN、放送',
  // SPACE / MOUSE footer hints used on Title overlay (static; no translation needed but kept for consistency)
  'PRESS  [SPACE]  /  NAV  [MOUSE]': '[SPACE]で開始  /  [MOUSE]で選択',
  'Earned gold — total now': '獲得ゴールド — 合計',
  earned: '獲得',
  All: '全',
  'rounds cleared. Final gold:': 'ラウンドクリア。最終ゴールド:',
  'Reached round': '到達ラウンド',
  Your: 'あなたの',
  contained: 'の構成:',
  modules: 'モジュール',
  implants: 'インプラント',
  chargers: 'チャージャー',
  boosters: 'ブースター',
  souls: 'ソウル',
  'CHOOSE A SKILL': 'スキルを選択',
  'Tip: You had no weapons. Buy a weapon first!': 'ヒント: モジュールがありません。まずモジュールを購入しましょう！',
  'Tip: Try filling more slots before fighting.': 'ヒント: 戦闘前にもっとスロットを埋めましょう。',
  'Tip: Adding a second weapon doubles your DPS.': 'ヒント: モジュールを2本にするとDPSが倍増します。',
  'Tip: Try different part combinations or a different robot.': 'ヒント: 別のパーツ構成や別のサイボーグを試しましょう。',
  'Tip: Equip modules to add strikes to your soul strike!': 'ヒント: モジュールを装備してストライクを増やそう！',
  'Tip: Fill more slots to power up your soul strike.': 'ヒント: スロットを埋めてSOUL STRIKEを強化しよう。',
  'Tip: More modules = more soul strike hits!': 'ヒント: モジュールが多い＝ストライクが増える！',
  'Tip: Try different part combos to boost your soul strike damage.': 'ヒント: パーツの組み合わせでSOUL STRIKEダメージを上げよう。',

  // Settings
  SETTINGS: '設定',
  'BGM Volume': 'BGM音量',
  'SFX Volume': 'SE音量',
  Language: '言語',
  Fullscreen: 'フルスクリーン',
  'Battle Speed': 'バトル速度',
  'Background Audio': 'バックグラウンド再生',
  'Debug Mode': 'デバッグモード',
  'Boss Mode': 'ボスモード',
  'One-Shot': '一撃',
  Ending: 'エンディング',
  'Ending (Easy)': 'エンディング (Easy)',
  'Ending (Hard)': 'エンディング (Hard)',
  Recommended: '推奨解像度',
  'RESET ALL DATA': '全データリセット',
  'Click again to confirm': 'もう一度クリックで確定',
  'Data reset. Reloading...': 'データリセット完了。再読込中...',
  '← BACK': '← 戻る',
  'BACK TO TITLE': 'タイトルに戻る',
  '← BACK TO TITLE': '← タイトルに戻る',

  // Sanctum (加持堂) — meta-progression buff shop
  SANCTUM: '加持堂',
  'Spend scrap to consecrate your next loadout.':
    'スクラップでバフを授かり次戦に備える',
  'Scrap:': 'スクラップ:',
  'Consecrate': '授かる',
  'Consecrated:': '授かった:',
  'Not enough scrap.': 'スクラップが足りない',
  READIED: '授かり済',
  'BUFFS READIED': '次戦バフ',
  'No buffs readied.': 'バフは授かっていない',

  // Collection
  COLLECTION: 'コレクション',
  STORY: 'ストーリー',
  'I — THE FALLING': '一 — 堕ちるとき',
  'II — THE FIRST FIST': '二 — はじまりの拳',
  CYBORGS: 'サイボーグ',
  PARTS: 'パーツ',
  ENEMIES: '敵',
  TITLES: '称号',
  unlocked: '解放済',
  discovered: '発見済',
  defeated: '撃破済',
  clears: 'クリア',
  'SKILLS DISCOVERED': '発見したスキル',
  skills: 'スキル',

  // Robot names
  'INDRA': 'INDRA',
  'GOLIATH-414': 'GOLIATH-414',
  'LILITH': 'LILITH',
  'MUMEI': 'MUMEI',

  // Robot descriptions
  'Right arm carries a massive mechanical weapon. Balanced cyborg fighter.':
    '右腕に巨大な機械兵器を装着。バランス型サイボーグ。',
  'Massive build with reinforced body. Charges through enemies.':
    '巨体に強化装甲。敵を突き破る。',
  'Left leg houses a devastating mechanical kick weapon. Speed fighter.':
    '左脚に破壊的な機械キック兵器。スピード型。',
  'An ordinary boy. The machine on his back is anything but.':
    'ただの少年。背中の機械だけが、普通じゃない。',
  'No passive — raw striking power.': 'パッシブなし — 純粋な打撃力。',
  'Damage taken -10% / attack speed -20%.': '被ダメ-10% / 攻撃速度-20%。',
  'Attack speed +30% / damage taken +10%.': '攻撃速度+30% / 被ダメ+10%。',
  'Special effects +50% / weapon cooldown +15%.': '特殊効果+50% / モジュールCD+15%。',

  // Part names — Modules (was Weapons)
  'Phantom Limb': 'ファントムリム',
  'Junk Pile Driver': 'パイルドライバー',
  'Nerve Hijacker': 'ナーヴハイジャッカー',
  'ATMAN Breaker': 'アートマンブレイカー',
  'Rage Burner': 'レイジバーナー',

  // Part names — Implants (was Armor)
  'Blackmarket Plating': 'ブラックマーケット装甲',
  'Scar Tissue Mesh': 'スカーティシュメッシュ',
  'Stolen Aegis': 'ストールンイージス',
  "Dead Man's Vest": 'デッドマンズベスト',
  'Jury-Rigged Exoframe': '廃材エクソフレーム',

  // Part names — Chargers (was Engines)
  'Salvage Reactor': 'サルベージリアクター',
  'Overclocked Heart': 'オーバークロックハート',
  'Stolen Core': 'ストールンコア',
  'Adrenaline Pump': 'アドレナリンポンプ',
  'Parasite Cell': 'パラサイトセル',

  // Part names — Boosters (was Gears)
  'Feedback Loop': 'フィードバックループ',
  'Rage Amplifier': 'レイジアンプリファイア',
  'Chrono Splice': 'クロノスプライス',
  'Junk Capacitor': 'ジャンクキャパシタ',
  'Overdrive Injector': '過給インジェクター',

  // Part names — Souls (was Specials)
  'Mandala Chip': 'マンダラチップ',
  'Karma Circuit': 'カルマサーキット',
  'Samsara Link': 'サンサーラリンク',
  'Last Wish': 'ラストウィッシュ',
  'Soul Drain': 'ソウルドレイン',

  // Part descriptions — Modules
  "Lost arm's memory strikes through the ultimate.": '失われた腕の記憶が必殺技を貫く。',
  'Compressed scrap fired at terminal velocity.': '圧縮スクラップを終端速度で射出。',
  'Seizes enemy control circuits. Chance to freeze.': '敵の制御回路を掌握。凍結の可能性。',
  'Forbidden tech. Extreme damage, slow charge.': '禁忌技術。極大ダメージ、遅い充填。',
  'Channeled fury ignites everything nearby.': '集束された怒りが周囲を焼き尽くす。',

  // Part descriptions — Implants
  'Flat damage reduction. No questions asked.': '固定ダメージ軽減。詮索無用。',
  '15% damage reduction. Your scars are your armor.': '15%ダメージ軽減。傷痕こそが鎧。',
  'Blocks first hit. Stolen from corporate elite.': '最初の被弾を防御。企業上層部からの盗品。',
  "DR+4 but HP-10. A fallen comrade's last gift.": 'DR+4だがHP-10。散った仲間の最後の贈り物。',
  'HP+30, DR 10%. Held together with wire and will.': 'HP+30、DR10%。針金と意志で繋ぎ止めた。',

  // Part descriptions — Chargers
  'Pulls power from scrap. HP+20.': 'スクラップから出力。HP+20。',
  'Pushed past limits. HP+10, DMG+2.': '限界を超えて。HP+10、DMG+2。',
  'Corporate power plant. HP+40, DR 5%.': '企業製動力炉。HP+40、DR5%。',
  'Pure chemical boost. DMG+5.': '純粋な化学ブースト。DMG+5。',
  'Feeds on damage. HP+15, DR 3%.': 'ダメージを糧にする。HP+15、DR3%。',

  // Part descriptions — Boosters
  'Recycles combat data. -10% cooldown.': '戦闘データを再利用。CD-10%。',
  'Converts anger to power. -20% CD, HP-5.': '怒りを力に変換。CD-20%、HP-5。',
  'Time-shifted circuits. -8% cooldown.': '時間偏位回路。CD-8%。',
  'Cheap but works. -5% cooldown.': '安価だが動く。CD-5%。',
  '-25% CD, HP-10. Glass cannon.': 'CD-25%、HP-10。ガラスの大砲。',

  // Part descriptions — Souls
  'Soul resonance amplifies at low HP. +50% speed below 30%.': '低HPで魂の共鳴が増幅。30%以下で速度+50%。',
  'The cycle heals. 3 HP every 5 seconds.': '輪廻が癒す。5秒ごとにHP3回復。',
  'Each booster echoes through the soul. +3 DMG per booster.': 'ブースターの響きが魂を貫く。ブースター1個につきDMG+3。',
  'One chance to defy death. Survive lethal hit at 1 HP.': '死に抗う一度きりの機会。致死ダメージをHP1で耐える。',
  'Every strike feeds the spirit. Heal 2 HP on hit.': '一撃ごとに魂を養う。命中時HP2回復。',

  // Item names and descriptions
  'Trace Stim': 'トレース・スティム',
  'Adrenaline Shot': 'アドレナリン・ショット',
  'Berserker Surge': 'バーサーカー・サージ',
  'Reactive Plate': 'リアクティブ・プレート',
  'Hardened Coating': '硬化コーティング',
  'Aegis Lattice': 'イージス・ラティス',
  'Spotter Pulse': 'スポッター・パルス',
  'Recon Scan': '偵察スキャン',
  'Targeting Override': '照準オーバーライド',
  'Next battle: +15% attack speed.': '次の戦闘: 攻撃速度+15%。',
  'Next battle: +30% attack speed.': '次の戦闘: 攻撃速度+30%。',
  'Next battle: +50% attack speed.': '次の戦闘: 攻撃速度+50%。',
  'Next battle: +5% damage reduction.': '次の戦闘: ダメージ軽減+5%。',
  'Next battle: +10% damage reduction.': '次の戦闘: ダメージ軽減+10%。',
  'Next battle: +20% damage reduction.': '次の戦闘: ダメージ軽減+20%。',
  'Next battle: enemy takes +10% damage.': '次の戦闘: 敵の被ダメージ+10%。',
  'Next battle: enemy takes +20% damage.': '次の戦闘: 敵の被ダメージ+20%。',
  'Next battle: enemy takes +35% damage.': '次の戦闘: 敵の被ダメージ+35%。',

  // Skill names and descriptions (ultimate-focused)
  'Impact Amp': 'インパクトアンプ',
  'Ultimate damage +30%.': '必殺技ダメージ+30%。',
  'Multi Loader': 'マルチローダー',
  'Ultimate gains +1 strike.': '必殺技のストライク+1。',
  'Rapid Charge': 'ラピッドチャージ',
  'Ultimate gauge fills 40% faster.': '必殺ゲージ充填速度+40%。',
  'Drain Strike': 'ドレインストライク',
  'Ultimate heals 20% of damage dealt.': '必殺技ダメージの20%をHP回復。',
  'Iron Will': '鉄の意志',
  '+20 max HP. Survive to fire.': '最大HP+20。撃つまで耐えろ。',
  'Shield Breaker': 'シールドブレイカー',
  'Ultimate ignores enemy DR.': '必殺技が敵のDRを無視。',
  Overcharge: 'オーバーチャージ',
  'Ultimate damage +60%.': '必殺技ダメージ+60%。',
  'Barrage Module': 'バラージモジュール',
  'Ultimate gains +2 strikes.': '必殺技のストライク+2。',
  'Instant Charge': 'インスタントチャージ',
  'Ultimate gauge fills 80% faster.': '必殺ゲージ充填速度+80%。',
  Annihilate: 'アナイアレイト',
  'Ultimate heals 40% of damage dealt.': '必殺技ダメージの40%をHP回復。',

  // Achievement names, descriptions, and titles
  'First Victory': '初勝利',
  'Clear any run.': '任意のランをクリア。',
  'Rookie Pilot': 'ルーキーパイロット',
  Seasoned: '歴戦',
  'Win 5 total runs.': '合計5回クリア。',
  'Veteran Pilot': 'ベテランパイロット',
  'War Machine': 'ウォーマシン',
  'Win 10 total runs.': '合計10回クリア。',
  'Machine Master': 'マシンマスター',
  'Clear with all 4 cyborgs.': '全4サイボーグでクリア。',
  'Full Arsenal': '完全武装',
  'Use all 25 parts at least once.': '全25パーツを使用。',
  'Chief Engineer': 'チーフエンジニア',
  Weaponsmith: 'ウェポンスミス',
  'Use all 5 weapon types.': '全5種のモジュールを使用。',
  'Use all 5 weapon modules.': '全5種のモジュールを使用。',
  Hunter: 'ハンター',
  'Defeat every enemy type.': '全敵タイプを撃破。',
  'Apex Hunter': 'エイペックスハンター',
  'Apex Predator': 'エイペックスプレデター',
  'Defeat the Daitengu.': '大天狗を撃破。',
  'Halfway There': '折り返し地点',
  'Reach round 5.': 'ラウンド5に到達。',
  Cadet: 'カデット',
  Collector: 'コレクター',
  'Defeat 10 different enemy types.': '10種類の敵を撃破。',

  // Ultimate names
  'Iron Fist': 'アイアンフィスト',
  'Vajra Strike': 'ヴァジュラストライク',
  Bulldoze: 'ブルドーズ',
  'Compassion Engine': 'コンパッション・エンジン',
  'Thunder Kick': 'サンダーキック',
  'Rakshasa Dance': 'ラクシャサ・ダンス',
  'Void Echo': 'ヴォイドエコー',
  Nirvana: 'ニルヴァーナ',
  'Boss Rage': 'ボスレイジ',
  'Titan Strike': 'タイタンストライク',
  'Extinction Protocol': 'エクスティンクション・プロトコル',

  // Synergy names
  'Booster Sync': 'ブースターシンク',
  'Turbo Combo': 'ターボコンボ',
  'Dual Wield': 'デュアルウィールド',
  'Heavy Implant': 'ヘビーインプラント',
  'Soul Amp': 'ソウルアンプ',
  'Full Kit': 'フルキット',

  // Status effects
  BURN: '燃焼',
  FREEZE: '凍結',
  POISON: '毒',

  // Placement synergy names
  'Twin Module': 'ツインモジュール',
  'Full Arm': 'フルアーム',
  'Full Leg': 'フルレッグ',
  'Core Lock': 'コアロック',
  'Head Start': 'ヘッドスタート',
  'Soul Resonance': 'ソウルレゾナンス',
  'Booster Chain': 'ブースターチェーン',
  'Mixed Arms': 'ミックスドアームズ',
  'Leg Charger': 'レッグチャージャー',
  'Spine Link': 'スパインリンク',

  // Placement synergy descriptions
  '2+ modules in the same slot type: ULT strike +1.':
    '同じスロット種に2つ以上のモジュール: ULTストライク+1。',
  'All arm_r slots filled: ULT damage +20%.':
    '右腕スロット全装備: ULTダメージ+20%。',
  'All legs_l slots filled: charge speed +30%.':
    '左脚スロット全装備: チャージ速度+30%。',
  'Chest + back both have parts: DR +5%.':
    '胸+背中にパーツ装備: DR+5%。',
  'Head slot filled: hit chance +0.5/sec.':
    '頭スロット装備: 命中率+0.5/秒。',
  '2+ soul parts on back slots: ULT damage +25%.':
    '背中に2つ以上のソウル: ULTダメージ+25%。',
  '3+ boosters anywhere: charge speed +20%.':
    'ブースター3つ以上: チャージ速度+20%。',
  'Module + implant in the same limb: HP +15.':
    '同じ肢にモジュール+インプラント: HP+15。',
  'Charger on legs: ULT damage +10%.':
    '脚にチャージャー: ULTダメージ+10%。',
  'Soul on back + charger on chest: charge speed +40%.':
    '背中にソウル+胸にチャージャー: チャージ速度+40%。',

  // Misc
  'DAILY RUN': 'デイリーラン',
  CONFIRM: '確定',
  Scrap: 'スクラップ',
  '★ SOUL STRIKE ★': '★ SOUL STRIKE ★',
  DEFENSE: '防御',
  'Survive until SOUL STRIKE is ready!': 'SOUL STRIKEが溜まるまで耐えろ！',
  'Survive and charge your SOUL STRIKE! SPACE / Click to fire!': '耐えてSOUL STRIKEを溜めろ！ SPACE / クリック で発動！',
  'READY!': 'READY!',
  'Drag parts from shop to blueprint slots': 'ショップからパーツをドラッグして設計図に配置',
  'DRAG parts into slots  ·  MATCH types for synergy  ·  PRESS READY to fight': 'スロットにパーツを配置  ·  同種でシナジー  ·  READYで出撃',
  SELL: '売却',
  STORAGE: '保管',

  'Acquired:': '習得:',
  BACK: '戻る',
  CONTINUE: '続行',
  CREDITS: 'クレジット',
  'Code: MIT  ·  Assets: CC BY-NC 4.0': 'コード: MIT  ·  アセット: CC BY-NC 4.0',
  LOCKED: 'ロック中',
  'NEXT ROUND': '次のラウンド',
  READY: '準備完了',
  '...': '...',
  'ARMOR BREAK': 'アーマーブレイク',
  'READY  ▶': '準備完了  ▶',
  'SOUL STRIKE': 'SOUL STRIKE',
  STRIKE: '撃',
  STRIKES: '撃',
  '← RETURN TO TITLE': '← タイトルに戻る',
  SYNERGIES: 'シナジー',
};
