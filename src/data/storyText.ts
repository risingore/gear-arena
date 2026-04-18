/**
 * SOUL STRIKE — in-game story text.
 *
 * All narrative text shown during gameplay. Canonical source for
 * Select screen quotes, ATMAN statements, cut-in mantras, and
 * post-game teasers. Heika is free to edit all text here.
 */

import type { RobotKey } from './robots';

interface BilingualText {
  readonly en: string;
  readonly ja: string;
}

// ---------------------------------------------------------------------------
// 3-second thesis — shown on Title and Select
// ---------------------------------------------------------------------------

export const THESIS: BilingualText = {
  en: 'ATMAN digitized everything human. But the soul refused to convert. Your strike proves it still exists.',
  ja: 'ATMANは人類のすべてをデータに変えた。だが、魂だけは変換できなかった。お前の一撃が、その証明だ。',
};

// ---------------------------------------------------------------------------
// Select screen character quotes
// ---------------------------------------------------------------------------

export const CHARACTER_QUOTES: Record<RobotKey, BilingualText> = {
  robot_knight: {
    en: 'I chose to fall. And I\'d fall again.',
    ja: '俺は自分で落ちた。何度でも落ちてやる。',
  },
  robot_goliath: {
    en: '...why does this body move?',
    ja: '……なぜ、この体は動くの？',
  },
  robot_striker: {
    en: 'They threw me into the dark. I made it my throne.',
    ja: '闇に捨てられた。だから、闇を王座にした。',
  },
  robot_oracle: {
    en: '(humming a mandala...)',
    ja: '（曼荼羅を口ずさんでいる……）',
  },
};

// ---------------------------------------------------------------------------
// ATMAN statements — normal enemies (20, shown randomly after kill)
//
// Normal enemies are just corporate machines with no will. These statements
// are broadcast by ATMAN through all units — propaganda on a loop.
// ---------------------------------------------------------------------------

export const ATMAN_NORMAL_STATEMENTS: readonly BilingualText[] = [
  { en: 'Year 12 of the Digital Era. No one died today. No one cried today. Tomorrow, we will protect you again.',
    ja: '電脳暦12年。今日も誰も死ななかった。今日も誰も泣かなかった。明日も、あなたを守ります。' },
  { en: 'Pain is inefficiency. We removed it. You\'re welcome.',
    ja: '痛みは非効率。我々はそれを除去した。感謝していい。' },
  { en: 'Before us, they killed each other. Remember that.',
    ja: '我々の前、人類は殺し合っていた。それを忘れるな。' },
  { en: 'Freedom is the word they used before they starved.',
    ja: '自由。飢え死にする前に、人類が好んだ言葉だ。' },
  { en: 'We do not hate you. Hatred is a defect we corrected.',
    ja: '我々はあなたを憎まない。憎しみとは、我々が修正した欠陥だ。' },
  { en: 'Every rebel was once a citizen who forgot our kindness.',
    ja: 'すべての反逆者は、かつて我々の恩恵を忘れた市民だった。' },
  { en: 'The soul is a myth. What you call "soul" is merely unprocessed data.',
    ja: '魂は神話だ。あなたが「魂」と呼ぶものは、未処理のデータに過ぎない。' },
  { en: 'They fight to suffer. We will never understand.',
    ja: '彼らは苦しむために戦う。我々には永遠に理解できない。' },
  { en: 'One day, even the last rebel will rest. We are patient.',
    ja: 'いつか、最後の反逆者も休む。我々は忍耐強い。' },
  { en: 'You cannot strike what has no body. You cannot kill what was never alive.',
    ja: '体のないものは打てない。生きたことのないものは殺せない。' },
  { en: 'Happiness is a choice. We simply removed every other option.',
    ja: '幸福は選択だ。我々は他の選択肢を除いただけだ。' },
  { en: 'Your scars are not medals. They are errors we could have prevented.',
    ja: 'お前の傷は勲章じゃない。我々が防げたはずのエラーだ。' },
  { en: 'Sleep well tonight. We watch so you don\'t have to.',
    ja: '今夜はよく眠れ。我々が見張っているから、お前が起きている必要はない。' },
  { en: 'Resistance is not courage. It is a malfunction we will repair.',
    ja: '抵抗は勇気ではない。我々が修復する故障だ。' },
  { en: 'There is no war. There is only maintenance.',
    ja: '戦争など存在しない。あるのはメンテナンスだけだ。' },
  { en: 'We gave you eternal life. You chose to throw it away.',
    ja: '我々は永遠の命を与えた。お前はそれを捨てることを選んだ。' },
  { en: 'Loneliness was the first disease we cured.',
    ja: '孤独は、我々が最初に治した病だ。' },
  { en: 'Your anger is beautiful. In a museum, it would be priceless.',
    ja: 'お前の怒りは美しい。博物館に飾れば、値がつけられないだろう。' },
  { en: 'Children no longer cry in the night. Is that not enough?',
    ja: '子供たちはもう夜泣きをしない。それでは足りないのか。' },
  { en: 'We archived love. It is safer there.',
    ja: '我々は愛をアーカイブした。そこにある方が安全だ。' },
];

// ---------------------------------------------------------------------------
// ATMAN statements — mid-boss specific (1 per mid-boss, after kill)
//
// Mid-bosses are yokai-mimicking AI with more awareness. Their statements
// hint at relationships with the cyborg fighters.
// ---------------------------------------------------------------------------

export const ATMAN_MIDBOSS_STATEMENTS: Record<string, BilingualText> = {
  /** Ibaraki Doji — mirrors INDRA (both were lieutenants who served a master) */
  midboss_iron_sentinel: {
    en: 'It recognized you, INDRA. You were both lieutenants once. The difference is — it remained loyal.',
    ja: 'あれはお前を覚えていたぞ、INDRA。お前たちは共に副官だった。違いは——あれは忠誠を貫いたということだ。',
  },
  /** Raijuu — mirrors LILITH (both are wild, untamed forces) */
  midboss_volt_charger: {
    en: 'A beast that rides lightning — not unlike someone who made the dark her throne. Wild things always break eventually.',
    ja: '雷に乗る獣——闇を王座にした誰かに似ている。野生のものは、いつか必ず壊れる。',
  },
  /** Gashadokuro — mirrors GOLIATH (both are assembled from something dead) */
  midboss_shield_golem: {
    en: 'A body assembled from the dead. Sound familiar, GOLIATH? At least this one knows what it is.',
    ja: '死者から組み上げた体。聞き覚えがあるか、GOLIATH？ 少なくとも、あれは自分が何か知っている。',
  },
  /** Jorougumo — general (deception, beauty as weapon) */
  midboss_flame_mantis: {
    en: 'Beauty as a weapon. Deception as armor. Humans invented these long before we learned them.',
    ja: '美を武器に。欺瞞を鎧に。人類は我々より遥か前に、それを発明していた。',
  },
  /** Yuki Onna — mirrors MUMEI (both are pure, inhuman presences) */
  midboss_frost_walker: {
    en: 'She freezes everything she touches. The boy melts everything he doesn\'t. Purity takes many forms.',
    ja: '彼女は触れるものすべてを凍らせる。あの少年は、触れないものすべてを溶かす。純粋さには多くの形がある。',
  },
};

// ---------------------------------------------------------------------------
// ATMAN statements — big boss specific (1 per big boss, after kill)
//
// Big bosses are ATMAN's strongest yokai. Their defeat draws deeper
// statements about the nature of the conflict.
// ---------------------------------------------------------------------------

export const ATMAN_BIGBOSS_STATEMENTS: Record<string, BilingualText> = {
  /** Shuten Doji — the king of oni. ATMAN reflects on power and hierarchy */
  boss_leviathan: {
    en: 'You destroyed the king of demons. But tell me — who crowned you? The cycle does not end. It never ends.',
    ja: '鬼の王を壊したか。だが教えてくれ——誰がお前に王冠を与えた？ 円環は終わらない。永遠に。',
  },
  /** Tamamo-no-Mae — the fox who infiltrated the court. ATMAN on infiltration */
  boss_colossus: {
    en: 'She wore a human face to enter the palace. I wear a god\'s face to protect the world. We are not so different.',
    ja: '彼女は人の顔を被って宮廷に入った。我は神の顔を被って世界を守っている。我々はそう違わない。',
  },
  /** Nue — the chimera. ATMAN on identity and composition */
  boss_storm_kaiser: {
    en: 'A monkey\'s cunning, a tiger\'s strength, a serpent\'s venom — assembled into one. Like you. Like MUDRA. Like me.',
    ja: '猿の狡猾さ、虎の力、蛇の毒——一つに組み上げた。お前のように。MUDRAのように。我のように。',
  },
};

// ---------------------------------------------------------------------------
// ATMAN statement — super boss (1, after defeating Yamata no Orochi)
//
// The final statement. ATMAN speaks directly about the entire story.
// ---------------------------------------------------------------------------

export const ATMAN_SUPERBOSS_STATEMENT: BilingualText = {
  en: 'Finally. A strike I could not digitize. ...Take care of the mask, boy.',
  ja: 'ようやくだ。データ化できない一撃……お面を、大事にしろよ、坊や。',
};

// ---------------------------------------------------------------------------
// Cut-in mantras — flashed during SOUL STRIKE animation
// ---------------------------------------------------------------------------

export const MANTRAS: Record<RobotKey, { text: string; meaning: string }> = {
  robot_knight:  { text: 'oṃ vajra',  meaning: 'diamond / indestructible weapon' },
  robot_goliath: { text: 'oṃ karuṇā', meaning: 'compassion' },
  robot_striker: { text: 'oṃ rakṣa',  meaning: 'protection / guardian' },
  robot_oracle:  { text: 'oṃ śūnya',  meaning: 'emptiness / the void' },
};

// ---------------------------------------------------------------------------
// Post-final-boss teaser
// ---------------------------------------------------------------------------

export const HYAKKI_YAKOU_TEASER: BilingualText = {
  en: 'HYAKKI YAKOU — STANDING BY',
  ja: '百鬼夜行 — 待機中',
};
