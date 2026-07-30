/**
 * Per-character audio profile — ultimate SFX pitch multipliers.
 *
 * Feeds audio.ts `playSfx('ultimate', pitch)` so each machine has a
 * recognizable vocal range for their strike:
 *   INDRA    — standard (1.0)
 *   GOLIATH  — deep bass (0.75), matches the giant frame
 *   LILITH   — high register (1.25), UMA/elegant
 *   MUMEI    — ethereal high (1.5), the "soul" manifestation
 *
 * Tune without touching code — edit the map below.
 */

import type { RobotKey } from './robots';

export const ULT_PITCH_BY_ROBOT: Readonly<Record<RobotKey, number>> = {
  robot_knight: 1.0,
  robot_goliath: 0.75,
  robot_striker: 1.25,
  robot_oracle: 1.5,
};
