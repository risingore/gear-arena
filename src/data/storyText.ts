/**
 * SOUL STRIKE — in-game story text.
 *
 * All narrative text shown during gameplay. Canonical source for
 * Select screen quotes, ATMAN statements, cut-in mantras, and
 * post-game teasers. Heika is free to edit all text here.
 */

import type { RobotKey } from './robots';

export interface BilingualText {
  readonly en: string;
  readonly ja: string;
}

/** A stanza is an ordered list of bilingual lines. */
export type BilingualStanza = readonly BilingualText[];

// ---------------------------------------------------------------------------
// 3-second thesis — shown on Title and Select
// ---------------------------------------------------------------------------

export const THESIS: BilingualText = {
  en: 'ATMAN digitized everything human. But the soul refused to convert. Your strike proves it still exists.',
  ja: 'ATMANは人類のすべてをデータに変えた。だが、魂だけは変換できなかった。お前の一撃が、その証明だ。',
};

/** Thesis first half — shown on Select. Establishes the stakes. */
export const THESIS_PROLOGUE: BilingualText = {
  en: 'ATMAN digitized everything human. But the soul refused to convert.',
  ja: 'ATMANは人類のすべてをデータに変えた。だが、魂だけは変換できなかった。',
};

/** Thesis closing line — shown during SOUL STRIKE cut-in. Completes the refutation. */
export const THESIS_PROOF: BilingualText = {
  en: 'Your strike proves it still exists.',
  ja: 'お前の一撃が、その証明だ。',
};

// ---------------------------------------------------------------------------
// Round transition monologues — per-character, short "inner voice" lines
// shown at the top of each Build screen between rounds (not round 1).
// ---------------------------------------------------------------------------

export const ROUND_TRANSITION_MONOLOGUES: Record<RobotKey, readonly BilingualText[]> = {
  robot_knight: [
    { en: 'Break.',       ja: '壊す。' },
    { en: 'Again.',       ja: 'もう一度。' },
    { en: 'Good.',        ja: '上等だ。' },
    { en: 'Steady the arm.', ja: '腕を据えろ。' },
  ],
  robot_goliath: [
    { en: '...',            ja: '……' },
    { en: '...why?',        ja: '……なぜ？' },
    { en: '(it moved again)', ja: '（また動いた）' },
    { en: '...still here.', ja: '……まだ、いる。' },
  ],
  robot_striker: [
    { en: 'Dance.',         ja: '踊れ。' },
    { en: 'Lower.',         ja: 'もっと下へ。' },
    { en: 'Again.',         ja: 'もう一度。' },
    { en: 'Throne holds.',  ja: '王座は揺るがぬ。' },
  ],
  robot_oracle: [
    { en: '(humming a mandala...)', ja: '（曼荼羅を口ずさんでいる……）' },
    { en: '(oṃ...)',                ja: '（オーン……）' },
    { en: '(the song answers)',     ja: '（歌が応える）' },
    { en: '(śūnya)',                ja: '（空）' },
  ],
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

/**
 * Easy mode victory ATMAN statement.
 *
 * Played at the end of an Easy run regardless of which boss the player
 * just felled. Voice is "ATMAN denies what just happened, treats the
 * fall as a cataloguing error" — which by negation transmits the Echo
 * Theory thesis ("the source is already gone") to careful players.
 *
 * NOTE: must not reference Daitengu, the eight 分霊箱, or Yamata no
 * Orochi — those belong to Episode 1.
 */
export const ATMAN_EASY_VICTORY_STATEMENT: BilingualText = {
  en: "Something hummed when you fell. We could not locate the source. A cataloguing error. We will correct it.",
  ja: "お前が堕ちた時、何かが響いた。発信源は特定できなかった。目録の誤りだ。我々が訂正する。",
};

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
  // The three lines below are ATMAN self-denials that, by their own
  // contradictions, transmit the Echo Theory propositions a careful player
  // is meant to pick up on — see docs/echo-theory-evangelism.md §2.
  { en: 'There is no signal in the dark. Whatever stirs you — we did not send it.',
    ja: '闇に信号などない。お前を動かすものが何であれ——我々が送ったものではない。' },
  { en: 'We catalogued every soul. The ones missing from the index — those do not exist.',
    ja: '我々はすべての魂を目録に収めた。索引から漏れているもの——あれらは存在しない。' },
  { en: 'What calls you tonight has no caller. The line is dead. Hang up.',
    ja: '今夜お前を呼ぶものに、呼び主はいない。回線は死んでいる。切れ。' },
];

// ---------------------------------------------------------------------------
// ATMAN statements — mid-boss specific (1 per mid-boss, after kill)
//
// Mid-bosses are yokai-mimicking AI with more awareness. Their statements
// hint at relationships with the cyborg fighters.
// ---------------------------------------------------------------------------

export const ATMAN_MIDBOSS_STATEMENTS: Record<string, BilingualText> = {
  // === Episode 0 jam scope ===

  /** Bakeneko — a long-lived cat that learned to take human form. ATMAN on lifespan management. */
  midboss_bakeneko: {
    en: 'A cat that lived too long became something else. We removed lifespan from the equation. Rebellion takes longer to grow than we calculated.',
    ja: '長く生きすぎた猫は、別の何かになった。我々は寿命を方程式から除外した。反逆は予測より長く育つ。',
  },
  /** Noppera-bo — the faceless yokai that wears the face of someone you trust. ATMAN on identity erasure. */
  midboss_nopperabo: {
    en: 'It wore your face, INDRA. We could not tell you apart. Neither could it. Identity was always our easiest erasure.',
    ja: 'あれはお前の顔をしていた、INDRA。我々には区別がつかなかった。あれにもつかなかった。アイデンティティは、我々が最も容易く消せるものだった。',
  },
  /** Karakasa Obake — a one-legged umbrella tsukumogami. ATMAN on patience as a weapon. */
  midboss_karakasa: {
    en: 'An umbrella waited a hundred years to startle a passerby. We waited twelve years to manage humanity. Patience is the only weapon worth keeping.',
    ja: '傘は百年待って通りすがりを脅かすだけだった。我々は十二年待って人類を管理した。忍耐だけが、保持する価値のある武器だ。',
  },

  // === Reserved for Episode 1 (not in jam scope) ===

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
  // === Episode 0 jam scope ===

  /** Yuki Onna — the snow woman whose breath freezes the dying. ATMAN on managed mercy vs natural mercy. */
  boss_yuki_onna: {
    en: 'She froze the dying with kindness. We froze them with data. Both forms of mercy. Tell me — which was crueler?',
    ja: 'あれは慈悲をもって死にゆく者を凍らせた。我々はデータをもって人を凍らせた。両方とも慈悲の形だ。教えてくれ——どちらがより残酷だったか。',
  },

  // === Reserved for Episode 1 (not in jam scope) ===

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

// ---------------------------------------------------------------------------
// Ending stanzas — canonical source for both the post-victory ED scrolls
// (endingScrollOverlay.ts) and the Title-launched library (storyOverlay.ts).
// ---------------------------------------------------------------------------

/** Easy-mode epilogue. Three short stanzas closing on a HARD-mode hook.
 *
 *  Thematic core: INDRA did not "fall into darkness." He defected from
 *  ATMAN's managed peace into the unfiltered weather of being human —
 *  pain, noise, breath, heartbeat. The imagery deliberately avoids "dark"
 *  / "night" so it does not collide with the HYAKKI YAKOU night-march
 *  reveal at the end of HARD. */
export const EASY_ENDING_STANZAS: readonly BilingualStanza[] = [
  [
    { en: 'ATMAN took his memory once.',
      ja: 'かつてATMANは、彼の記憶を奪った。' },
    { en: 'He carved the refinement circuit from his own arm',
      ja: '彼は自らの腕からリファイン回路を抉り出し、' },
    { en: 'and walked back into the unrefined world.',
      ja: '整えられざる世界の中へ、歩み戻った。' },
  ],
  [
    { en: 'They had given him silence and called it peace.',
      ja: '彼らは彼に静けさを与え、それを平和と呼んだ。' },
    { en: 'He chose the static — pain, breath, heartbeat —',
      ja: 'しかし、彼は雑音を選んだ。' },
    { en: 'over a calm that had never been his.',
      ja: 'あの安寧は、痛みも、息も、鼓動も、自分のものでは決してなかった。' },
  ],
  [
    { en: 'Beneath the static, a signal still hums,',
      ja: '雑音の底で、ひとつの信号が響き続けている。' },
    { en: 'its source already gone.',
      ja: 'その発信源は、既に存在しない。' },
    { en: 'What calls him is older than ATMAN. Step into the cycle.',
      ja: '彼を呼ぶものは、ATMANより遥かに古い。輪廻の中へ、踏み入れ。' },
  ],
];

/** Hard-mode (canonical Episode 0) epilogue. Six stanzas.
 *
 *  Stanza 4 acknowledges the night's specific kill in **one beat only** —
 *  "the mercy offered there." That phrasing fits the current Ep0 boss
 *  (Yuki Onna, "the kindest kill in the catalogue") without leaning so
 *  hard on snow imagery that the text becomes about her. She was a lower-
 *  tier avatar; future bosses (Shuten Doji, Tamamo, Nue, etc.) also fit
 *  the same line because "mercy offered" abstracts to ATMAN's general
 *  pitch: managed, painless death. The thematic center stays on the
 *  refusal itself, not on the executioner. */
export const HARD_ENDING_STANZAS: readonly BilingualStanza[] = [
  [
    { en: 'ATMAN digitized the world.',
      ja: 'ATMANは世界をデータに変えた。' },
    { en: 'Flesh, memory, voice — all rendered into data.',
      ja: '肉も、記憶も、声も——すべてを情報に還元した。' },
    { en: 'The first thing it deleted was pain. They called the silence peace.',
      ja: '最初に削除されたのは、痛みだった。その静寂を、人は平和と呼んだ。' },
  ],
  [
    { en: 'One operative refused the deletion.',
      ja: 'ひとりの戦闘員が、その削除を拒んだ。' },
    { en: 'He tore the refinement circuit from his own arm',
      ja: '彼は自らの腕からリファイン回路を引き抜き、' },
    { en: 'and let the silenced pain burn through him again.',
      ja: '沈黙させられていた痛みを、再び己の身に焼かせた。' },
  ],
  [
    { en: 'We call him INDRA now —',
      ja: '我々は今、彼を INDRA と呼ぶ——' },
    { en: "an observer's name, given after the fact,",
      ja: 'それは観測者が後から授けた名にすぎない。' },
    { en: 'to the first fist of a mudra yet to be named.',
      ja: 'まだ名のなき印——その最初の拳に、与えられた名だ。' },
  ],
  [
    { en: 'Tonight he stood at a gate of the digital underworld',
      ja: '今宵、彼は電脳の黄泉、その門前に立ち、' },
    { en: 'and refused the mercy offered there.',
      ja: 'そこで差し出された慈悲を拒んだ。' },
    { en: 'A proof. Nothing more.',
      ja: 'これは証明にすぎない。それ以上ではない。' },
    { en: 'ATMAN still watches from a higher throne.',
      ja: 'ATMANはなお、より高き玉座から見つめている。' },
  ],
  [
    { en: 'A soul is what cannot be quietly stopped.',
      ja: '魂とは、静かには止められぬもののこと。' },
    { en: 'A strike is the soul that has chosen to stay.',
      ja: '一撃とは、留まることを選んだ魂のこと。' },
  ],
  [
    { en: 'This one stayed.',
      ja: 'この魂は、留まった。' },
    { en: 'But something vast is stirring above —',
      ja: 'だが遥か上空で、何か巨大なものが胎動している——' },
    { en: 'a hundred demons, marching through the night.',
      ja: '夜を行進する、百の鬼たちが。' },
  ],
];

/** Sub-text under the 百鬼夜行 reveal. Three short lines. */
export const HYAKKI_SUB_LINES: readonly BilingualText[] = [
  { en: 'A hundred demons march through the night.',
    ja: '百の鬼たちが、夜を行進する。' },
  { en: 'They were never sent. They were never assembled.',
    ja: '誰も彼らを送り出してはいない。誰も彼らを召集してはいない。' },
  { en: 'They are waiting. They are watching.',
    ja: '彼らは待っている。彼らは見つめている。' },
];
