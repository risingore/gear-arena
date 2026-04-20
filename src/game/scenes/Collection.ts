import { Scene } from 'phaser';
import type { GameObjects } from 'phaser';

import gameOptions from '../helper/gameOptions';
import { createButton, createPanel } from '../helper/uiFactory';
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
import { getEarnedAchievements } from '../systems/achievements';
import { ACHIEVEMENTS } from '@/data/achievements';
import { SKILLS } from '@/data';
import { applyHiDpiToScene, showDebugBadge } from '../helper/hiDpiText';
import { runVisualChecks } from '../systems/visualDebugger';
import { setupLayoutDebug } from '../systems/layoutDebug';
import { isDebugEnabled } from '../systems/debug';
import { mountFrameOverlay } from '../overlays/overlayBase';

type TabName = 'machines' | 'parts' | 'enemies' | 'titles';

const CARD_W = 160;
const CARD_H = 120;
const CARD_GAP = 14;
const GRID_COLS = 6;

const SCROLL_TOP = 140;
const SCROLL_BOTTOM = 650;
const SCROLL_HEIGHT = SCROLL_BOTTOM - SCROLL_TOP;

export class Collection extends Scene {
  private activeTab: TabName = 'machines';
  private tabButtons: { tab: TabName; bg: GameObjects.Rectangle; label: GameObjects.Text }[] = [];
  private contentObjects: GameObjects.GameObject[] = [];
  private scrollY = 0;
  private contentHeight = 0;
  private countText!: GameObjects.Text;

  constructor() {
    super('Collection');
  }

  create(): void {
    this.tabButtons = [];
    this.contentObjects = [];
    this.scrollY = 0;

    const { gameWidth, gameHeight, textStyles } = gameOptions;
    this.cameras.main.setBackgroundColor(PALETTE.bg);
    fadeInCurrent(this);

    const unmountFrame = mountFrameOverlay({
      tagLeft: '<b>SS</b>-<b>050</b> / ARCHIVE <span class="bar"></span> COLLECTION',
      tagRight: 'UNLOCK STATUS <span class="bar"></span> <b>INDEX</b>',
    });
    this.events.once('shutdown', unmountFrame);
    this.events.once('destroy', unmountFrame);

    // Tab buttons
    const tabs: { tab: TabName; label: string }[] = [
      { tab: 'machines', label: t('CYBORGS') },
      { tab: 'parts',    label: t('PARTS') },
      { tab: 'enemies',  label: t('ENEMIES') },
      { tab: 'titles',   label: t('TITLES') }
    ];
    const tabW = 150;
    const tabH = 36;
    const tabGap = 12;
    const totalTabW = tabs.length * tabW + (tabs.length - 1) * tabGap;
    const tabStartX = gameWidth / 2 - totalTabW / 2 + tabW / 2;
    const tabY = 86;

    this.tabButtons = tabs.map((def, i) => {
      const x = tabStartX + i * (tabW + tabGap);
      const btn = createButton(this, x, tabY, tabW, tabH, def.label, () => {
        this.activeTab = def.tab;
        playSfx('click');
        this.refreshTabs();
        this.drawContent();
      }, { fontSize: '16px' });
      return { tab: def.tab, bg: btn.bg, label: btn.text };
    });

    // Count text (fixed, between tabs and scroll area)
    this.countText = this.add
      .text(gameWidth / 2, 120, '', textStyles.small)
      .setOrigin(0.5).setAlpha(0.7);

    // Back button (bottom-left)
    const backBtnResult = createButton(this, 80, gameHeight - 28, 120, 36, t('BACK'), () => {
      playSfx('click'); fadeToScene(this, 'Title');
    });
    const backBtn = backBtnResult.bg;

    this.input.keyboard?.on('keydown-ESC', () => fadeToScene(this, 'Title'));
    this.input.keyboard?.on('keydown-R', () => fadeToScene(this, 'Title'));

    // Mouse wheel scroll
    this.input.on('wheel', (_p: unknown, _g: unknown, _dx: number, dy: number) => {
      this.scrollBy(dy * 0.5);
    });

    // Clip mask: cover top and bottom outside scroll area with bg-colored rectangles
    this.add.rectangle(gameWidth / 2, SCROLL_TOP / 2, gameWidth, SCROLL_TOP, PALETTE.bg, 1).setDepth(50);
    this.add.rectangle(gameWidth / 2, (SCROLL_BOTTOM + gameHeight) / 2, gameWidth, gameHeight - SCROLL_BOTTOM, PALETTE.bg, 1).setDepth(50);

    // Re-draw fixed UI on top of the clip masks
    this.add.text(gameWidth / 2, 36, t('COLLECTION'), textStyles.title).setOrigin(0.5).setDepth(51);
    this.tabButtons.forEach(({ bg, label }) => { bg.setDepth(51); label.setDepth(51); });
    this.countText.setDepth(51);
    backBtn.setDepth(51);
    backBtnResult.text.setDepth(51);

    this.refreshTabs();
    this.drawContent();
    applyHiDpiToScene(this);
    showDebugBadge(this, isDebugEnabled());
    runVisualChecks(this);
    setupLayoutDebug(this);
  }

  private refreshTabs(): void {
    this.tabButtons.forEach(({ tab, bg }) => {
      bg.setFillStyle(tab === this.activeTab ? 0x2a3a55 : 0x1a2a44, 1);
      bg.setStrokeStyle(2, tab === this.activeTab ? PALETTE.accentOrange : 0x4466aa);
    });
  }

  private scrollBy(dy: number): void {
    const maxScroll = Math.max(0, this.contentHeight - SCROLL_HEIGHT);
    this.scrollY = Math.max(0, Math.min(maxScroll, this.scrollY + dy));
    this.repositionContent();
  }

  private repositionContent(): void {
    const offsetY = -this.scrollY;
    for (const obj of this.contentObjects) {
      const data = (obj as any).__baseY as number | undefined;
      if (data !== undefined) {
        (obj as any).setY(data + offsetY);
      }
    }
  }

  private drawContent(): void {
    for (const obj of this.contentObjects) obj.destroy();
    this.contentObjects = [];
    this.scrollY = 0;

    switch (this.activeTab) {
      case 'machines': this.drawMachinesTab(); break;
      case 'parts': this.drawPartsTab(); break;
      case 'enemies': this.drawEnemiesTab(); break;
      case 'titles': this.drawTitlesTab(); break;
    }
    applyHiDpiToScene(this);
  }

  /** Add a game object to the scrollable content area. y is absolute screen position. */
  private addScrollable(obj: GameObjects.GameObject & { y: number }): void {
    (obj as any).__baseY = obj.y;
    this.contentObjects.push(obj);
  }

  // --------------------------------------------------------------------------
  // Machines tab
  // --------------------------------------------------------------------------

  private drawMachinesTab(): void {
    const { gameWidth, textStyles } = gameOptions;
    const save = loadSaveData();
    const unlocked = new Set(save.unlockedRobots);
    let count = 0;
    const baseY = SCROLL_TOP + 10;

    ALL_ROBOT_KEYS.forEach((key, i) => {
      const robot = ROBOTS[key];
      const isUnlocked = unlocked.has(key);
      if (isUnlocked) count += 1;
      const x = gameWidth / 2 - (ALL_ROBOT_KEYS.length * (CARD_W + CARD_GAP) - CARD_GAP) / 2 + i * (CARD_W + CARD_GAP) + CARD_W / 2;
      const y = baseY + CARD_H / 2;

      this.addScrollable(
        createPanel(this, x, y, CARD_W, CARD_H, {
          fillColor: isUnlocked ? PALETTE.cardBg : 0x111118,
          borderColor: isUnlocked ? ROBOT_COLORS[robot.archetype] : PALETTE.cardStroke
        })
      );
      if (isUnlocked) {
        const clears = save.perRobotClears[key] ?? 0;
        this.addScrollable(this.add.text(x, y - 28, t(robot.name), textStyles.body).setOrigin(0.5));
        this.addScrollable(this.add.text(x, y, robot.archetype.toUpperCase(), textStyles.small).setOrigin(0.5).setAlpha(0.7));
        this.addScrollable(this.add.text(x, y + 20, `HP ${robot.baseHp}  |  ${robot.slots.length} slots`, textStyles.small).setOrigin(0.5).setAlpha(0.7));
        this.addScrollable(this.add.text(x, y + 40, `${clears} ${t('clears')}`, textStyles.small).setOrigin(0.5).setColor('#ffd94a'));
      } else {
        this.addScrollable(this.add.text(x, y - 10, 'LOCKED', textStyles.body).setOrigin(0.5).setColor('#ff4444'));
        this.addScrollable(this.add.text(x, y + 16, '???', textStyles.small).setOrigin(0.5).setAlpha(0.4));
      }
    });

    this.countText.setText(`${count} / ${ALL_ROBOT_KEYS.length} ${t('unlocked')}`);
    this.contentHeight = CARD_H + 60;
  }

  // --------------------------------------------------------------------------
  // Parts tab
  // --------------------------------------------------------------------------

  private drawPartsTab(): void {
    const { gameWidth, textStyles } = gameOptions;
    const save = loadSaveData();
    const used = new Set(save.usedParts);
    let count = 0;
    const baseY = SCROLL_TOP + 10;

    ALL_PART_KEYS.forEach((key, i) => {
      const part = PARTS[key];
      const isUsed = used.has(key);
      if (isUsed) count += 1;
      const col = i % GRID_COLS;
      const row = Math.floor(i / GRID_COLS);
      const totalW = GRID_COLS * (CARD_W + CARD_GAP) - CARD_GAP;
      const startX = gameWidth / 2 - totalW / 2 + CARD_W / 2;
      const x = startX + col * (CARD_W + CARD_GAP);
      const y = baseY + row * (CARD_H + CARD_GAP) + CARD_H / 2;

      this.addScrollable(
        createPanel(this, x, y, CARD_W, CARD_H, {
          fillColor: isUsed ? PALETTE.cardBg : 0x111118,
          borderColor: isUsed ? CATEGORY_COLORS[part.category] : PALETTE.cardStroke
        })
      );
      if (isUsed) {
        this.addScrollable(this.add.text(x, y - 30, CATEGORY_LABEL[part.category], textStyles.small).setOrigin(0.5).setColor('#aaaabb'));
        this.addScrollable(this.add.text(x, y + 2, t(part.name), { ...textStyles.small, color: '#ffffff', wordWrap: { width: CARD_W - 16 } }).setOrigin(0.5));
        this.addScrollable(this.add.text(x, y + 36, `${part.price} g`, textStyles.small).setOrigin(0.5).setColor('#ffd94a'));
      } else {
        this.addScrollable(this.add.text(x, y, '???', textStyles.body).setOrigin(0.5).setAlpha(0.3));
      }
    });

    const rows = Math.ceil(ALL_PART_KEYS.length / GRID_COLS);
    this.countText.setText(`${count} / ${ALL_PART_KEYS.length} ${t('discovered')}`);
    this.contentHeight = rows * (CARD_H + CARD_GAP) + 20;
  }

  // --------------------------------------------------------------------------
  // Enemies tab
  // --------------------------------------------------------------------------

  private drawEnemiesTab(): void {
    const { gameWidth, textStyles } = gameOptions;
    const save = loadSaveData();
    const defeated = new Set(save.defeatedEnemies);
    let count = 0;
    const baseY = SCROLL_TOP + 10;
    const allEnemies = [...NORMAL_ENEMIES, ...MID_BOSSES, ...BIG_BOSSES, SUPER_BOSS];

    allEnemies.forEach((enemy, i) => {
      const isDefeated = defeated.has(enemy.id);
      if (isDefeated) count += 1;
      const col = i % GRID_COLS;
      const row = Math.floor(i / GRID_COLS);
      const totalW = GRID_COLS * (CARD_W + CARD_GAP) - CARD_GAP;
      const startX = gameWidth / 2 - totalW / 2 + CARD_W / 2;
      const x = startX + col * (CARD_W + CARD_GAP);
      const y = baseY + row * (CARD_H + CARD_GAP) + CARD_H / 2;

      const borderColor = enemy.category === 'super' ? PALETTE.accentOrange
        : enemy.category === 'bigBoss' ? PALETTE.accentRed
        : enemy.category === 'midBoss' ? PALETTE.accentBlue
        : PALETTE.cardStroke;

      this.addScrollable(
        createPanel(this, x, y, CARD_W, CARD_H, {
          fillColor: isDefeated ? PALETTE.cardBg : 0x111118,
          borderColor: isDefeated ? borderColor : PALETTE.cardStroke
        })
      );
      if (isDefeated) {
        const categoryLabel = enemy.category === 'super' ? 'SUPER BOSS'
          : enemy.category === 'bigBoss' ? 'BOSS'
          : enemy.category === 'midBoss' ? 'MID-BOSS'
          : `TIER ${enemy.tier}`;
        this.addScrollable(this.add.text(x, y - 30, categoryLabel, textStyles.small).setOrigin(0.5).setAlpha(0.6));
        this.addScrollable(this.add.text(x, y - 6, t(enemy.name), textStyles.body).setOrigin(0.5));
        this.addScrollable(this.add.text(x, y + 20, `HP ${enemy.baseHp}  DMG ${enemy.baseDamage}`, textStyles.small).setOrigin(0.5).setAlpha(0.7));
      } else {
        this.addScrollable(this.add.text(x, y, '???', textStyles.body).setOrigin(0.5).setAlpha(0.3));
      }
    });

    const rows = Math.ceil(allEnemies.length / GRID_COLS);
    this.countText.setText(`${count} / ${ALL_ENEMY_IDS.length} ${t('defeated')}`);
    this.contentHeight = rows * (CARD_H + CARD_GAP) + 20;
  }

  // --------------------------------------------------------------------------
  // Titles tab
  // --------------------------------------------------------------------------

  private drawTitlesTab(): void {
    const { gameWidth, textStyles } = gameOptions;
    const save = loadSaveData();
    const earned = getEarnedAchievements(save);
    const earnedIds = new Set(earned.map((e) => e.def.id));
    let y = SCROLL_TOP + 10 + 24;

    ACHIEVEMENTS.forEach((ach) => {
      const isEarned = earnedIds.has(ach.id);
      this.addScrollable(
        createPanel(this, gameWidth / 2, y, 700, 48, {
          fillColor: isEarned ? PALETTE.cardBg : 0x111118,
          borderColor: isEarned ? PALETTE.accentOrange : PALETTE.cardStroke
        })
      );
      if (isEarned) {
        this.addScrollable(this.add.text(gameWidth / 2 - 320, y, `★  ${ach.name}`, textStyles.body).setOrigin(0, 0.5).setColor('#ffd94a'));
        this.addScrollable(this.add.text(gameWidth / 2 + 320, y - 8, `"${ach.title}"`, textStyles.small).setOrigin(1, 0.5).setColor('#ffd94a'));
        this.addScrollable(this.add.text(gameWidth / 2 + 320, y + 10, ach.description, textStyles.small).setOrigin(1, 0.5).setAlpha(0.6));
      } else {
        this.addScrollable(this.add.text(gameWidth / 2 - 320, y, `☆  ${ach.name}`, textStyles.body).setOrigin(0, 0.5).setAlpha(0.4));
        this.addScrollable(this.add.text(gameWidth / 2 + 320, y, ach.description, textStyles.small).setOrigin(1, 0.5).setAlpha(0.3));
      }
      y += 54;
    });

    // Skills discovered section
    y += 16;
    this.addScrollable(
      this.add.text(gameWidth / 2, y, t('SKILLS DISCOVERED'), textStyles.body)
        .setOrigin(0.5).setAlpha(0.8)
    );
    y += 32;

    const acquiredSkills = new Set(save.acquiredSkillsEver);
    let skillCount = 0;
    SKILLS.forEach((skill) => {
      const isAcquired = acquiredSkills.has(skill.id);
      if (isAcquired) skillCount += 1;
      this.addScrollable(
        createPanel(this, gameWidth / 2, y, 700, 44, {
          fillColor: isAcquired ? PALETTE.cardBg : 0x111118,
          borderColor: isAcquired ? PALETTE.accentBlue : PALETTE.cardStroke
        })
      );
      if (isAcquired) {
        this.addScrollable(this.add.text(gameWidth / 2 - 320, y, t(skill.name), textStyles.body).setOrigin(0, 0.5).setColor('#3ab0ff'));
        this.addScrollable(this.add.text(gameWidth / 2 + 320, y, t(skill.description), textStyles.small).setOrigin(1, 0.5).setAlpha(0.6));
      } else {
        this.addScrollable(this.add.text(gameWidth / 2 - 320, y, '???', textStyles.body).setOrigin(0, 0.5).setAlpha(0.3));
      }
      y += 50;
    });

    this.countText.setText(`${earned.length} / ${ACHIEVEMENTS.length} ${t('earned')}  ·  ${skillCount} / ${SKILLS.length} ${t('skills')}`);
    this.contentHeight = (y - SCROLL_TOP) + 20;
  }
}
