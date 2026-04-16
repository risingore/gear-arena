/**
 * GEAR ARENA — permanent run skills (v0.1, 2026-04-16).
 *
 * Acquired after mid-boss (R4, R7) and big-boss (R10, super-boss route only).
 * Player picks 1 from 3 random options. Max 3 per run.
 * These are NOT sold in the shop — boss rewards only.
 *
 * Heika is free to edit numbers, names, and descriptions.
 * Kima must NOT overwrite without explicit instruction.
 */

export type SkillEffectKind =
  | 'bonus_hp'
  | 'bonus_damage'
  | 'cooldown_mult'
  | 'damage_reduction_pct'
  | 'repair'
  | 'overdrive_boost';

export interface SkillDef {
  readonly id: string;
  readonly name: string;
  readonly description: string;
  readonly tier: 'midBoss' | 'bigBoss';
  readonly effectKind: SkillEffectKind;
  readonly magnitude: number;
}

export const SKILLS: readonly SkillDef[] = [
  // Mid-boss tier (offered at R4, R7)
  { id: 'skill_iron_will',     name: 'Iron Will',          description: '+15 max HP.',                    tier: 'midBoss', effectKind: 'bonus_hp',              magnitude: 15 },
  { id: 'skill_quick_draw',    name: 'Quick Draw',         description: '-10% weapon cooldown.',           tier: 'midBoss', effectKind: 'cooldown_mult',         magnitude: 0.9 },
  { id: 'skill_hard_shell',    name: 'Hard Shell',         description: '+5% damage reduction.',           tier: 'midBoss', effectKind: 'damage_reduction_pct',  magnitude: 0.05 },
  { id: 'skill_power_surge',   name: 'Power Surge',        description: '+3 weapon damage.',               tier: 'midBoss', effectKind: 'bonus_damage',          magnitude: 3 },
  { id: 'skill_nano_repair',   name: 'Nano Repair',        description: 'Heal 2 HP every 5 seconds.',     tier: 'midBoss', effectKind: 'repair',                magnitude: 2 },
  { id: 'skill_reflex',        name: 'Reflex Boost',       description: '-15% weapon cooldown.',           tier: 'midBoss', effectKind: 'cooldown_mult',         magnitude: 0.85 },
  // Big-boss tier (offered at R10, super-boss route only)
  { id: 'skill_vital_core',    name: 'Vital Core',         description: '+30 max HP.',                    tier: 'bigBoss', effectKind: 'bonus_hp',              magnitude: 30 },
  { id: 'skill_piercing_eye',  name: 'Piercing Eye',       description: '+6 weapon damage.',               tier: 'bigBoss', effectKind: 'bonus_damage',          magnitude: 6 },
  { id: 'skill_titan_frame',   name: 'Titan Frame',        description: '+8% damage reduction.',           tier: 'bigBoss', effectKind: 'damage_reduction_pct',  magnitude: 0.08 },
  { id: 'skill_overdrive_pro', name: 'Overdrive Protocol', description: '+25% attack speed below 30% HP.', tier: 'bigBoss', effectKind: 'overdrive_boost',       magnitude: 0.25 },
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
