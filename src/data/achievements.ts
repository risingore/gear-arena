/**
 * SOUL STRIKE — achievement definitions (v0.1, 2026-04-16).
 *
 * Achievements are derived from save data — no extra storage needed.
 * Each achievement has a check function that runs against SaveData.
 */

export interface AchievementDef {
  readonly id: string;
  readonly name: string;
  readonly description: string;
  readonly title: string;
  readonly tier: number;
}

// Episode 0 jam scope: only INDRA ships, the 4-machines and Daitengu
// achievements are unreachable so we drop them. The remaining titles
// are all earnable inside the 17-enemy / 25-part Ep0 build.
export const ACHIEVEMENTS: readonly AchievementDef[] = [
  { id: 'ach_first_win',     name: 'First Victory',    description: 'Clear any run.',                    title: 'Rookie Pilot',       tier: 1 },
  { id: 'ach_5_wins',        name: 'Seasoned',          description: 'Win 5 total runs.',                 title: 'Veteran Pilot',      tier: 2 },
  { id: 'ach_10_wins',       name: 'War Machine',       description: 'Win 10 total runs.',                title: 'War Machine',        tier: 3 },
  { id: 'ach_all_parts',     name: 'Full Arsenal',      description: 'Use all 25 parts at least once.',   title: 'Chief Engineer',     tier: 3 },
  { id: 'ach_all_weapons',   name: 'Weaponsmith',       description: 'Use all 5 weapon modules.',          title: 'Weaponsmith',        tier: 2 },
  { id: 'ach_all_enemies',   name: 'Hunter',            description: 'Defeat all 17 enemy types.',        title: 'Apex Hunter',        tier: 4 },
  { id: 'ach_round_5',       name: 'Halfway There',     description: 'Reach round 5.',                    title: 'Cadet',              tier: 1 },
  { id: 'ach_collector',     name: 'Collector',         description: 'Defeat 10 different enemy types.',  title: 'Collector',          tier: 2 },
  // Top-tier completionist title — granted only when every other Ep0
  // collection is at 100 % (1 machine cleared, 25 parts used, 17 enemy
  // types defeated, all 6 mid-boss skills acquired). Tier 5 so it takes
  // priority over Apex Hunter on the Title screen banner.
  { id: 'ach_collect_king',  name: 'Collection King',   description: 'Complete every collection — machines, parts, enemies, and skills.', title: 'Collection King', tier: 5 },
];
