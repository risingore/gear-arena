/**
 * SOUL STRIKE — permanent run skills (v0.1, 2026-04-16).
 *
 * Acquired after mid-boss (R4, R7) and big-boss (R10, super-boss route only).
 * Player picks 1 from 3 random options. Max 3 per run.
 * These are NOT sold in the shop — boss rewards only.
 *
 * All values are tunable. Edit numbers, names, and descriptions.
 */

export type SkillEffectKind =
  | 'ult_damage'
  | 'ult_strikes'
  | 'ult_charge'
  | 'ult_lifesteal'
  | 'ult_armor_break'
  | 'bonus_hp';

export interface SkillDef {
  readonly id: string;
  readonly name: string;
  readonly description: string;
  readonly tier: 'midBoss' | 'bigBoss';
  readonly effectKind: SkillEffectKind;
  readonly magnitude: number;
}

export const SKILLS: readonly SkillDef[] = [
  // Mid-boss tier — enhance the ultimate
  { id: 'skill_impact_amp',    name: 'Impact Amp',         description: 'Ultimate damage +30%.',          tier: 'midBoss', effectKind: 'ult_damage',     magnitude: 0.3 },
  { id: 'skill_multi_loader',  name: 'Multi Loader',       description: 'Ultimate gains +1 strike.',     tier: 'midBoss', effectKind: 'ult_strikes',    magnitude: 1 },
  { id: 'skill_rapid_charge',  name: 'Rapid Charge',       description: 'Ultimate gauge fills 40% faster.', tier: 'midBoss', effectKind: 'ult_charge',  magnitude: 0.4 },
  { id: 'skill_drain_strike',  name: 'Drain Strike',       description: 'Ultimate heals 20% of damage dealt.', tier: 'midBoss', effectKind: 'ult_lifesteal', magnitude: 0.2 },
  { id: 'skill_iron_will',     name: 'Iron Will',          description: '+20 max HP. Survive to fire.',   tier: 'midBoss', effectKind: 'bonus_hp',       magnitude: 20 },
  { id: 'skill_shield_break',  name: 'Shield Breaker',     description: 'Ultimate ignores enemy DR.',     tier: 'midBoss', effectKind: 'ult_armor_break', magnitude: 1 },
  // Big-boss tier — major ultimate upgrades
  { id: 'skill_overcharge',    name: 'Overcharge',         description: 'Ultimate damage +60%.',          tier: 'bigBoss', effectKind: 'ult_damage',     magnitude: 0.6 },
  { id: 'skill_barrage',       name: 'Barrage Module',     description: 'Ultimate gains +2 strikes.',    tier: 'bigBoss', effectKind: 'ult_strikes',    magnitude: 2 },
  { id: 'skill_instant_charge',name: 'Instant Charge',     description: 'Ultimate gauge fills 80% faster.', tier: 'bigBoss', effectKind: 'ult_charge', magnitude: 0.8 },
  { id: 'skill_annihilate',    name: 'Annihilate',         description: 'Ultimate heals 40% of damage dealt.', tier: 'bigBoss', effectKind: 'ult_lifesteal', magnitude: 0.4 },
];

export const ALL_SKILL_IDS: readonly string[] = SKILLS.map((s) => s.id);

export const findSkillDef = (id: string): SkillDef | undefined =>
  SKILLS.find((s) => s.id === id);

/** Pick N random skills of the given tier, without duplicates or already-owned skills. */
export const rollSkillChoices = (
  tier: 'midBoss' | 'bigBoss',
  owned: readonly string[],
  count = 3
): SkillDef[] => {
  const pool = SKILLS.filter((s) => s.tier === tier && !owned.includes(s.id));
  const shuffled = [...pool].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
};
