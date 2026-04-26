/**
 * SOUL STRIKE — canonical consumable items data (v0.1, 2026-04-16).
 *
 * Items are single-use: either consumed immediately in the Build phase
 * (e.g. healing) or applied as a buff for the next battle only.
 *
 * Tunable — edit numbers, names, and descriptions.
 */

import type { ItemsRegistry } from './schema';

export const ITEMS = {
  // OFFENSE — attack_speed
  item_trace_stim: {
    id: 'item_trace_stim',
    name: 'Trace Stim',
    description: 'Next battle: +15% attack speed.',
    price: 400,
    timing: 'next_battle',
    effect: { kind: 'attack_speed', multiplier: 1.15 }
  },
  item_adrenaline: {
    id: 'item_adrenaline',
    name: 'Adrenaline Shot',
    description: 'Next battle: +30% attack speed.',
    price: 600,
    timing: 'next_battle',
    effect: { kind: 'attack_speed', multiplier: 1.3 }
  },
  item_berserker_surge: {
    id: 'item_berserker_surge',
    name: 'Berserker Surge',
    description: 'Next battle: +50% attack speed.',
    price: 1000,
    timing: 'next_battle',
    effect: { kind: 'attack_speed', multiplier: 1.5 }
  },

  // DEFENSE — damage_reduction
  item_reactive_plate: {
    id: 'item_reactive_plate',
    name: 'Reactive Plate',
    description: 'Next battle: +5% damage reduction.',
    price: 400,
    timing: 'next_battle',
    effect: { kind: 'damage_reduction', amount: 0.05 }
  },
  item_hardened_coating: {
    id: 'item_hardened_coating',
    name: 'Hardened Coating',
    description: 'Next battle: +10% damage reduction.',
    price: 600,
    timing: 'next_battle',
    effect: { kind: 'damage_reduction', amount: 0.1 }
  },
  item_aegis_lattice: {
    id: 'item_aegis_lattice',
    name: 'Aegis Lattice',
    description: 'Next battle: +20% damage reduction.',
    price: 900,
    timing: 'next_battle',
    effect: { kind: 'damage_reduction', amount: 0.2 }
  },

  // RECON — enemy_vulnerability
  item_spotter_pulse: {
    id: 'item_spotter_pulse',
    name: 'Spotter Pulse',
    description: 'Next battle: enemy takes +10% damage.',
    price: 500,
    timing: 'next_battle',
    effect: { kind: 'enemy_vulnerability', multiplier: 1.1 }
  },
  item_recon_scan: {
    id: 'item_recon_scan',
    name: 'Recon Scan',
    description: 'Next battle: enemy takes +20% damage.',
    price: 700,
    timing: 'next_battle',
    effect: { kind: 'enemy_vulnerability', multiplier: 1.2 }
  },
  item_targeting_override: {
    id: 'item_targeting_override',
    name: 'Targeting Override',
    description: 'Next battle: enemy takes +35% damage.',
    price: 1000,
    timing: 'next_battle',
    effect: { kind: 'enemy_vulnerability', multiplier: 1.35 }
  }
} as const satisfies ItemsRegistry;

export type ItemKey = keyof typeof ITEMS;

export const ALL_ITEM_KEYS: readonly ItemKey[] = Object.keys(ITEMS) as readonly ItemKey[];

export const isItemKey = (key: string): key is ItemKey => key in ITEMS;
