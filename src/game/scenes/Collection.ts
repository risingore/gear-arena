import { Scene } from 'phaser';
import type { GameObjects } from 'phaser';

import gameOptions from '../helper/gameOptions';
import { ROBOTS, ALL_ROBOT_KEYS, PARTS, ALL_PART_KEYS } from '@/data';
import {
  NORMAL_ENEMIES,
  MID_BOSSES,
  BIG_BOSSES,
  SUPER_BOSS,
  ALL_ENEMY_IDS
} from '@/data/enemies';
import { loadSaveData } from '../systems/savedata';
import { PALETTE, ROBOT_COLORS, CATEGORY_COLORS, CATEGORY_LABEL } from '../systems/palette';
import { playSfx } from '../systems/audio';
import { fadeInCurrent, fadeToScene } from '../systems/transition';
import { t } from '../systems/i18n';
import { applyHiDpiToScene, showDebugBadge } from '../helper/hiDpiText';
import { isDebugEnabled } from '../systems/debug';

type TabName = 'machines' | 'parts' | 'enemies';

const CARD_W = 160;
const CARD_H = 120;
const CARD_GAP = 14;
const GRID_TOP = 140;
const GRID_COLS = 6;

export class Collection extends Scene {
  private activeTab: TabName = 'machines';
  private contentGroup: GameObjects.Group | null = null;
  private tabButtons: { tab: TabName; bg: GameObjects.Rectangle; label: GameObjects.Text }[] = [];

  constructor() {
    super('Collection');
  }

  create(): void {
    const { gameWidth, gameHeight, textStyles } = gameOptions;
    this.cameras.main.setBackgroundColor(PALETTE.bg);
    fadeInCurrent(this);

    // Title
    this.add
      .text(gameWidth / 2, 36, t('COLLECTION'), textStyles.title)
      .setOrigin(0.5);

    // Tab buttons
    const tabs: { tab: TabName; label: string }[] = [
      { tab: 'machines', label: t('MACHINES') },
      { tab: 'parts',    label: t('PARTS') },
      { tab: 'enemies',  label: t('ENEMIES') }
    ];
    const tabW = 180;
    const tabH = 40;
    const tabGap = 20;
    const totalTabW = tabs.length * tabW + (tabs.length - 1) * tabGap;
    const tabStartX = gameWidth / 2 - totalTabW / 2 + tabW / 2;
    const tabY = 90;

    this.tabButtons = tabs.map((def, i) => {
      const x = tabStartX + i * (tabW + tabGap);
      const bg = this.add
        .rectangle(x, tabY, tabW, tabH, PALETTE.buttonBg, 1)
        .setStrokeStyle(2, PALETTE.cardStroke)
        .setInteractive({ useHandCursor: true });
      const label = this.add
        .text(x, tabY, def.label, textStyles.body)
        .setOrigin(0.5);
      bg.on('pointerdown', () => {
        this.activeTab = def.tab;
        playSfx('click');
        this.refreshTabs();
        this.drawContent();
      });
      return { tab: def.tab, bg, label };
    });

    // Back button
    const backBtn = this.add
      .text(gameWidth / 2, gameHeight - 40, t('BACK TO TITLE'), textStyles.body)
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });
    backBtn.on('pointerdown', () => {
      playSfx('click');
      fadeToScene(this, 'Title');
    });

    this.input.keyboard?.on('keydown-ESC', () => fadeToScene(this, 'Title'));
    this.input.keyboard?.on('keydown-R', () => fadeToScene(this, 'Title'));

    this.refreshTabs();
    this.drawContent();
    applyHiDpiToScene(this);
    showDebugBadge(this, isDebugEnabled());
  }

  private refreshTabs(): void {
    this.tabButtons.forEach(({ tab, bg }) => {
      bg.setFillStyle(tab === this.activeTab ? PALETTE.buttonBgHover : PALETTE.buttonBg, 1);
      bg.setStrokeStyle(2, tab === this.activeTab ? PALETTE.accentOrange : PALETTE.cardStroke);
    });
  }

  private drawContent(): void {
    if (this.contentGroup) {
      this.contentGroup.clear(true, true);
    }
    this.contentGroup = this.add.group();

    switch (this.activeTab) {
      case 'machines':
        this.drawMachinesTab();
        break;
      case 'parts':
        this.drawPartsTab();
        break;
      case 'enemies':
        this.drawEnemiesTab();
        break;
    }
    applyHiDpiToScene(this);
  }

  // --------------------------------------------------------------------------
  // Machines tab
  // --------------------------------------------------------------------------

  private drawMachinesTab(): void {
    const { gameWidth, textStyles } = gameOptions;
    const save = loadSaveData();
    const unlocked = new Set(save.unlockedRobots);
    let count = 0;

    ALL_ROBOT_KEYS.forEach((key, i) => {
      const robot = ROBOTS[key];
      const isUnlocked = unlocked.has(key);
      if (isUnlocked) count += 1;
      const x = gameWidth / 2 - (ALL_ROBOT_KEYS.length * (CARD_W + CARD_GAP) - CARD_GAP) / 2 + i * (CARD_W + CARD_GAP) + CARD_W / 2;
      const y = GRID_TOP + CARD_H / 2 + 40;

      const card = this.add
        .rectangle(x, y, CARD_W, CARD_H, isUnlocked ? PALETTE.cardBg : 0x111118, 1)
        .setStrokeStyle(2, isUnlocked ? ROBOT_COLORS[robot.archetype] : PALETTE.cardStroke);
      this.contentGroup!.add(card);

      if (isUnlocked) {
        const clears = save.perRobotClears[key] ?? 0;
        this.contentGroup!.add(
          this.add.text(x, y - 28, t(robot.name), textStyles.body).setOrigin(0.5)
        );
        this.contentGroup!.add(
          this.add.text(x, y, robot.archetype.toUpperCase(), textStyles.small).setOrigin(0.5).setAlpha(0.7)
        );
        this.contentGroup!.add(
          this.add.text(x, y + 20, `HP ${robot.baseHp}  |  ${robot.slots.length} slots`, textStyles.small).setOrigin(0.5).setAlpha(0.7)
        );
        this.contentGroup!.add(
          this.add.text(x, y + 40, `${clears} ${t('clears')}`, textStyles.small).setOrigin(0.5).setColor('#ffd94a')
        );
      } else {
        this.contentGroup!.add(
          this.add.text(x, y - 10, 'LOCKED', textStyles.body).setOrigin(0.5).setColor('#ff4444')
        );
        this.contentGroup!.add(
          this.add.text(x, y + 16, '???', textStyles.small).setOrigin(0.5).setAlpha(0.4)
        );
      }
    });

    this.contentGroup!.add(
      this.add.text(gameWidth / 2, GRID_TOP + CARD_H + 120, `${count} / ${ALL_ROBOT_KEYS.length} ${t('unlocked')}`, textStyles.body).setOrigin(0.5).setAlpha(0.8)
    );
  }

  // --------------------------------------------------------------------------
  // Parts tab
  // --------------------------------------------------------------------------

  private drawPartsTab(): void {
    const { gameWidth, textStyles } = gameOptions;
    const save = loadSaveData();
    const used = new Set(save.usedParts);
    let count = 0;

    ALL_PART_KEYS.forEach((key, i) => {
      const part = PARTS[key];
      const isUsed = used.has(key);
      if (isUsed) count += 1;
      const col = i % GRID_COLS;
      const row = Math.floor(i / GRID_COLS);
      const totalW = GRID_COLS * (CARD_W + CARD_GAP) - CARD_GAP;
      const startX = gameWidth / 2 - totalW / 2 + CARD_W / 2;
      const x = startX + col * (CARD_W + CARD_GAP);
      const y = GRID_TOP + row * (CARD_H + CARD_GAP) + CARD_H / 2;

      const card = this.add
        .rectangle(x, y, CARD_W, CARD_H, isUsed ? PALETTE.cardBg : 0x111118, 1)
        .setStrokeStyle(2, isUsed ? CATEGORY_COLORS[part.category] : PALETTE.cardStroke);
      this.contentGroup!.add(card);

      if (isUsed) {
        this.contentGroup!.add(
          this.add.text(x, y - 24, CATEGORY_LABEL[part.category], textStyles.small).setOrigin(0.5).setColor('#aaaabb')
        );
        this.contentGroup!.add(
          this.add.text(x, y + 2, t(part.name), textStyles.body).setOrigin(0.5)
        );
        this.contentGroup!.add(
          this.add.text(x, y + 28, `${part.price}g`, textStyles.small).setOrigin(0.5).setColor('#ffd94a')
        );
      } else {
        this.contentGroup!.add(
          this.add.text(x, y, '???', textStyles.body).setOrigin(0.5).setAlpha(0.3)
        );
      }
    });

    const totalParts = ALL_PART_KEYS.length;
    const bottomY = GRID_TOP + Math.ceil(totalParts / GRID_COLS) * (CARD_H + CARD_GAP) + 20;
    this.contentGroup!.add(
      this.add.text(gameWidth / 2, bottomY, `${count} / ${totalParts} ${t('discovered')}`, textStyles.body).setOrigin(0.5).setAlpha(0.8)
    );
  }

  // --------------------------------------------------------------------------
  // Enemies tab
  // --------------------------------------------------------------------------

  private drawEnemiesTab(): void {
    const { gameWidth, textStyles } = gameOptions;
    const save = loadSaveData();
    const defeated = new Set(save.defeatedEnemies);
    let count = 0;

    const allEnemies = [
      ...NORMAL_ENEMIES,
      ...MID_BOSSES,
      ...BIG_BOSSES,
      SUPER_BOSS
    ];

    allEnemies.forEach((enemy, i) => {
      const isDefeated = defeated.has(enemy.id);
      if (isDefeated) count += 1;
      const col = i % GRID_COLS;
      const row = Math.floor(i / GRID_COLS);
      const totalW = GRID_COLS * (CARD_W + CARD_GAP) - CARD_GAP;
      const startX = gameWidth / 2 - totalW / 2 + CARD_W / 2;
      const x = startX + col * (CARD_W + CARD_GAP);
      const y = GRID_TOP + row * (CARD_H + CARD_GAP) + CARD_H / 2;

      const borderColor = enemy.category === 'super' ? PALETTE.accentOrange
        : enemy.category === 'bigBoss' ? PALETTE.accentRed
        : enemy.category === 'midBoss' ? PALETTE.accentBlue
        : PALETTE.cardStroke;

      const card = this.add
        .rectangle(x, y, CARD_W, CARD_H, isDefeated ? PALETTE.cardBg : 0x111118, 1)
        .setStrokeStyle(2, isDefeated ? borderColor : PALETTE.cardStroke);
      this.contentGroup!.add(card);

      if (isDefeated) {
        const categoryLabel = enemy.category === 'super' ? 'SUPER BOSS'
          : enemy.category === 'bigBoss' ? 'BOSS'
          : enemy.category === 'midBoss' ? 'MID-BOSS'
          : `TIER ${enemy.tier}`;
        this.contentGroup!.add(
          this.add.text(x, y - 30, categoryLabel, textStyles.small).setOrigin(0.5).setAlpha(0.6)
        );
        this.contentGroup!.add(
          this.add.text(x, y - 6, t(enemy.name), textStyles.body).setOrigin(0.5)
        );
        this.contentGroup!.add(
          this.add.text(x, y + 20, `HP ${enemy.baseHp}  DMG ${enemy.baseDamage}`, textStyles.small).setOrigin(0.5).setAlpha(0.7)
        );
      } else {
        this.contentGroup!.add(
          this.add.text(x, y, '???', textStyles.body).setOrigin(0.5).setAlpha(0.3)
        );
      }
    });

    const totalEnemies = ALL_ENEMY_IDS.length;
    const rows = Math.ceil(allEnemies.length / GRID_COLS);
    const bottomY = GRID_TOP + rows * (CARD_H + CARD_GAP) + 20;
    this.contentGroup!.add(
      this.add.text(gameWidth / 2, bottomY, `${count} / ${totalEnemies} ${t('defeated')}`, textStyles.body).setOrigin(0.5).setAlpha(0.8)
    );
  }
}
