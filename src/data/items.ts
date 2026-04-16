/**
 * GEAR ARENA — canonical consumable items data (v0.1, 2026-04-16).
 *
 * Items are single-use: either consumed immediately in the Build phase
 * (e.g. healing) or applied as a buff for the next battle only.
 *
 * Heika is free to edit numbers, names, and descriptions.
 * Kima must NOT overwrite without explicit instruction.
 */

import type { ItemsRegistry } from './schema';

export const ITEMS = {
  item_repair_spray: {
    id: 'item_repair_spray',
    name: 'Repair Spray',
    description: 'Restore 20 HP immediately.',
    price: 3,
    timing: 'immediate',
    effect: { kind: 'heal', amount: 20 }
  },
  item_emergency_patch: {
    id: 'item_emergency_patch',
    name: 'Emergency Patch',
    description: 'Restore 40 HP immediately.',
    price: 6,
    timing: 'immediate',
    effect: { kind: 'heal', amount: 40 }
  },
  item_adrenaline: {
    id: 'item_adrenaline',
    name: 'Adrenaline Shot',
    description: 'Next battle: +30% attack speed.',
    price: 5,
    timing: 'next_battle',
    effect: { kind: 'attack_speed', multiplier: 1.3 }
  },
  item_hardened_coating: {
    id: 'item_hardened_coating',
    name: 'Hardened Coating',
    description: 'Next battle: +10% damage reduction.',
    price: 4,
    timing: 'next_battle',
    effect: { kind: 'damage_reduction', amount: 0.1 }
  },
  item_recon_scan: {
    id: 'item_recon_scan',
    name: 'Recon Scan',
    description: 'Next battle: enemy takes +20% damage.',
    price: 7,
    timing: 'next_battle',
    effect: { kind: 'enemy_vulnerability', multiplier: 1.2 }
  }
} as const satisfies ItemsRegistry;

export type ItemKey = keyof typeof ITEMS;

export const ALL_ITEM_KEYS: readonly ItemKey[] = Object.keys(ITEMS) as readonly ItemKey[];

export const isItemKey = (key: string): key is ItemKey => key in ITEMS;
