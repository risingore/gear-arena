import { Scene } from 'phaser';

import { ROBOTS, ALL_ROBOT_KEYS, PARTS, ALL_PART_KEYS, SKILLS } from '@/data';
import {
  NORMAL_ENEMIES,
  MID_BOSSES,
  BIG_BOSSES,
  SUPER_BOSS,
  ALL_ENEMY_IDS,
} from '@/data/enemies';
import { ACHIEVEMENTS } from '@/data/achievements';
import { loadSaveData } from '../systems/savedata';
import { PALETTE, ROBOT_COLORS, CATEGORY_COLORS, CATEGORY_LABEL } from '../systems/palette';
import { playSfx } from '../systems/audio';
import { fadeInCurrent, fadeToScene } from '../systems/transition';
import { t } from '../systems/i18n';
import { getEarnedAchievements } from '../systems/achievements';
import { showDebugBadge } from '../helper/hiDpiText';
import { isDebugEnabled } from '../systems/debug';
import {
  mountCollectionOverlay,
  type CollectionMachine,
  type CollectionPart,
  type CollectionEnemy,
  type CollectionTitle,
  type CollectionSkill,
} from '../overlays/collectionOverlay';

/**
 * Collection scene.
 *
 * The visible UI is rendered as an HTML overlay (collectionOverlay.ts)
 * matching the Title / Settings visual language. The Phaser scene only
 * collects savedata, wires the overlay, and handles keyboard shortcuts.
 */
export class Collection extends Scene {
  private unmountOverlay: (() => void) | null = null;

  constructor() {
    super('Collection');
  }

  create(): void {
    this.cameras.main.setBackgroundColor(PALETTE.bg);
    fadeInCurrent(this);

    const save = loadSaveData();

    const toHex = (n: number): string => '#' + n.toString(16).padStart(6, '0');

    const unlockedRobots = new Set(save.unlockedRobots);
    const machines: CollectionMachine[] = ALL_ROBOT_KEYS.map((key) => {
      const robot = ROBOTS[key];
      const isUnlocked = unlockedRobots.has(key);
      return {
        name: t(robot.name),
        archetype: robot.archetype.toUpperCase(),
        hp: robot.baseHp,
        slots: robot.slots.length,
        clears: save.perRobotClears[key] ?? 0,
        themeHex: toHex(ROBOT_COLORS[robot.archetype]),
        unlocked: isUnlocked,
      };
    });

    const usedParts = new Set(save.usedParts);
    const parts: CollectionPart[] = ALL_PART_KEYS.map((key) => {
      const part = PARTS[key];
      return {
        name: t(part.name),
        category: part.category,
        categoryLabel: CATEGORY_LABEL[part.category],
        price: part.price,
        themeHex: toHex(CATEGORY_COLORS[part.category]),
        used: usedParts.has(key),
      };
    });

    const defeated = new Set(save.defeatedEnemies);
    const allEnemies = [...NORMAL_ENEMIES, ...MID_BOSSES, ...BIG_BOSSES, SUPER_BOSS];
    const enemies: CollectionEnemy[] = allEnemies.map((enemy) => {
      const borderColor =
        enemy.category === 'super' ? PALETTE.accentOrange
        : enemy.category === 'bigBoss' ? PALETTE.accentRed
        : enemy.category === 'midBoss' ? PALETTE.accentBlue
        : PALETTE.cardStroke;
      const categoryLabel =
        enemy.category === 'super' ? 'SUPER BOSS'
        : enemy.category === 'bigBoss' ? 'BOSS'
        : enemy.category === 'midBoss' ? 'MID-BOSS'
        : `TIER ${enemy.tier}`;
      return {
        name: t(enemy.name),
        categoryLabel,
        hp: enemy.baseHp,
        damage: enemy.baseDamage,
        themeHex: toHex(borderColor),
        defeated: defeated.has(enemy.id),
      };
    });

    const earned = getEarnedAchievements(save);
    const earnedIds = new Set(earned.map((e) => e.def.id));
    const titles: CollectionTitle[] = ACHIEVEMENTS.map((ach) => ({
      name: ach.name,
      title: ach.title,
      description: ach.description,
      earned: earnedIds.has(ach.id),
    }));

    const acquiredSkills = new Set(save.acquiredSkillsEver);
    const skills: CollectionSkill[] = SKILLS.map((skill) => ({
      name: t(skill.name),
      description: t(skill.description),
      acquired: acquiredSkills.has(skill.id),
    }));

    this.unmountOverlay = mountCollectionOverlay({
      title: t('COLLECTION'),
      tabLabels: {
        machines: t('CYBORGS'),
        parts: t('PARTS'),
        enemies: t('ENEMIES'),
        titles: t('TITLES'),
      },
      countTemplates: {
        machines: (u, total) => `${u} / ${total} ${t('unlocked')}`,
        parts: (d, total) => `${d} / ${total} ${t('discovered')}`,
        enemies: (d) => `${d} / ${ALL_ENEMY_IDS.length} ${t('defeated')}`,
        titles: (e, total, sk, skTotal) => `${e} / ${total} ${t('earned')}  ·  ${sk} / ${skTotal} ${t('skills')}`,
      },
      lockedLabel: 'LOCKED',
      skillsHeading: t('SKILLS DISCOVERED'),
      clearsLabel: t('clears'),
      machines,
      parts,
      enemies,
      titles,
      skills,
      backLabel: t('BACK'),
      onBack: () => {
        playSfx('click');
        fadeToScene(this, 'Title');
      },
    });

    this.events.once('shutdown', () => {
      this.unmountOverlay?.();
      this.unmountOverlay = null;
    });
    this.events.once('destroy', () => {
      this.unmountOverlay?.();
      this.unmountOverlay = null;
    });

    this.input.keyboard?.on('keydown-ESC', () => fadeToScene(this, 'Title'));
    this.input.keyboard?.on('keydown-R', () => fadeToScene(this, 'Title'));

    showDebugBadge(this, isDebugEnabled());
  }
}
