/**
 * GEAR ARENA — achievement definitions (v0.1, 2026-04-16).
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

export const ACHIEVEMENTS: readonly AchievementDef[] = [
  { id: 'ach_first_win',     name: 'First Victory',    description: 'Clear any run.',                    title: 'Rookie Pilot',       tier: 1 },
  { id: 'ach_5_wins',        name: 'Seasoned',          description: 'Win 5 total runs.',                 title: 'Veteran Pilot',      tier: 2 },
  { id: 'ach_10_wins',       name: 'War Machine',       description: 'Win 10 total runs.',                title: 'War Machine',        tier: 3 },
  { id: 'ach_all_robots',    name: 'Machine Master',    description: 'Clear with all 4 robots.',          title: 'Machine Master',     tier: 4 },
  { id: 'ach_all_parts',     name: 'Full Arsenal',      description: 'Use all 25 parts at least once.',   title: 'Chief Engineer',     tier: 3 },
  { id: 'ach_all_weapons',   name: 'Weaponsmith',       description: 'Use all 5 weapon types.',           title: 'Weaponsmith',        tier: 2 },
  { id: 'ach_all_enemies',   name: 'Hunter',            description: 'Defeat every enemy type.',          title: 'Apex Hunter',        tier: 4 },
  { id: 'ach_apex',          name: 'Apex Predator',     description: 'Defeat the APEX MACHINE.',          title: 'Apex Predator',      tier: 5 },
  { id: 'ach_round_5',       name: 'Halfway There',     description: 'Reach round 5.',                    title: 'Cadet',              tier: 1 },
  { id: 'ach_collector',     name: 'Collector',         description: 'Defeat 10 different enemy types.',  title: 'Collector',          tier: 2 },
];
