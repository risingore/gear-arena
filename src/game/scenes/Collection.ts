import { Scene } from 'phaser';

import { ROBOTS, JAM_ROBOT_KEYS, PARTS, ALL_PART_KEYS, SKILLS } from '@/data';
import {
  NORMAL_ENEMIES,
  MID_BOSSES,
  BIG_BOSSES,
  JAM_ENEMY_IDS,
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
    const machines: CollectionMachine[] = JAM_ROBOT_KEYS.map((key) => {
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

    // Filter to the Episode 0 jam allow-list (JAM_ENEMY_IDS = 13 normal
    // mobs + 3 mid-bosses + YUKIME-Ω). Daitengu (super) and the dormant
    // Ep1 mid/big bosses live in data but must not be listed as
    // collectible — they cannot be encountered in this build.
    const defeated = new Set(save.defeatedEnemies);
    const jamIds = new Set(JAM_ENEMY_IDS);
    const allEnemies = [...NORMAL_ENEMIES, ...MID_BOSSES, ...BIG_BOSSES]
      .filter((e) => jamIds.has(e.id));
    const enemies: CollectionEnemy[] = allEnemies.map((enemy) => {
      const borderColor =
        enemy.category === 'bigBoss' ? PALETTE.accentRed
        : enemy.category === 'midBoss' ? PALETTE.accentBlue
        : PALETTE.cardStroke;
      const categoryLabel =
        enemy.category === 'bigBoss' ? 'BOSS'
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

    // Episode 0 jam scope: only the mid-boss tier (6 skills) is reachable
    // — the big-boss tier is gated by Result.ts's `isSuperRoute` check
    // (`generatedRounds.length > 10`), and neither Easy (5 rounds) nor
    // Hard (10 rounds) ships a route long enough to satisfy it. Hide the
    // 4 unreachable big-boss skills so the count doesn't read as 6/10.
    const acquiredSkills = new Set(save.acquiredSkillsEver);
    const skills: CollectionSkill[] = SKILLS
      .filter((skill) => skill.tier === 'midBoss')
      .map((skill) => ({
        name: t(skill.name),
        description: t(skill.description),
        acquired: acquiredSkills.has(skill.id),
      }));

    this.unmountOverlay = mountCollectionOverlay({
      title: t('COLLECTION'),
      tabLabels: {
        machines: t('MACHINES'),
        parts: t('PARTS'),
        enemies: t('ENEMIES'),
        titles: t('TITLES'),
      },
      countTemplates: {
        machines: (u, total) => `${u} / ${total} ${t('unlocked')}`,
        parts: (d, total) => `${d} / ${total} ${t('discovered')}`,
        enemies: (d, total) => `${d} / ${total} ${t('defeated')}`,
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
