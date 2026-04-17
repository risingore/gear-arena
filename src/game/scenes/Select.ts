import { Scene } from 'phaser';
import type { GameObjects } from 'phaser';

import gameOptions from '../helper/gameOptions';
import { createButton, createPanel } from '../helper/uiFactory';
import { ROBOTS, ALL_ROBOT_KEYS, ROBOT_ULTIMATES, type RobotKey } from '@/data';
import { getRunState, setRunState, resetRunState } from '../systems/runState';
import { PALETTE, ROBOT_COLORS } from '../systems/palette';
import { generateShopOffer } from '../systems/shop';
import { generateRunEnemies } from '../systems/enemyPool';
import { isRobotUnlocked, isSuperBossUnlocked, loadSaveData } from '../systems/savedata';
import { playSfx } from '../systems/audio';
import { fadeInCurrent, fadeToScene } from '../systems/transition';
import { t } from '../systems/i18n';
import { applyHiDpiToScene, showDebugBadge } from '../helper/hiDpiText';
import { runVisualChecks } from '../systems/visualDebugger';
import { isDebugEnabled } from '../systems/debug';

export class Select extends Scene {
  private selectedIndex = 0;
  private readonly keys = ALL_ROBOT_KEYS;
  private contentGroup: GameObjects.GameObject[] = [];

  constructor() {
    super('Select');
  }

  create(): void {
    const { gameWidth, gameHeight, textStyles } = gameOptions;
    this.cameras.main.setBackgroundColor(PALETTE.bg);
    fadeInCurrent(this);
    this.contentGroup = [];

    // Left arrow
    const arrowL = this.add
      .text(40, gameHeight / 2, '◀', { ...textStyles.title, fontSize: '48px' })
      .setOrigin(0.5)
      .setAlpha(0.5)
      .setInteractive({ useHandCursor: true });
    arrowL.on('pointerdown', () => this.navigate(-1));
    arrowL.on('pointerover', () => { arrowL.setAlpha(1); arrowL.setScale(1.2); });
    arrowL.on('pointerout', () => { arrowL.setAlpha(0.5); arrowL.setScale(1); });

    // Right arrow
    const arrowR = this.add
      .text(gameWidth - 40, gameHeight / 2, '▶', { ...textStyles.title, fontSize: '48px' })
      .setOrigin(0.5)
      .setAlpha(0.5)
      .setInteractive({ useHandCursor: true });
    arrowR.on('pointerdown', () => this.navigate(1));
    arrowR.on('pointerover', () => { arrowR.setAlpha(1); arrowR.setScale(1.2); });
    arrowR.on('pointerout', () => { arrowR.setAlpha(0.5); arrowR.setScale(1); });

    // Back button (bottom-left)
    createButton(this, 80, gameHeight - 28, 120, 36, t('BACK'), () => {
      playSfx('click'); fadeToScene(this, 'Title');
    });

    // Keyboard
    this.input.keyboard?.on('keydown-LEFT', () => this.navigate(-1));
    this.input.keyboard?.on('keydown-RIGHT', () => this.navigate(1));
    this.input.keyboard?.on('keydown-ENTER', () => this.confirm());
    this.input.keyboard?.on('keydown-SPACE', () => this.confirm());
    this.input.keyboard?.on('keydown-R', () => fadeToScene(this, 'Title'));

    this.drawCharacter();
    applyHiDpiToScene(this);
    showDebugBadge(this, isDebugEnabled());
    runVisualChecks(this);
  }

  private navigate(dir: number): void {
    this.selectedIndex = (this.selectedIndex + dir + this.keys.length) % this.keys.length;
    playSfx('click');
    this.drawCharacter();
  }

  private drawCharacter(): void {
    // Clear previous
    for (const obj of this.contentGroup) obj.destroy();
    this.contentGroup = [];

    const { gameWidth, gameHeight, textStyles } = gameOptions;
    const key = this.keys[this.selectedIndex]!;
    const robot = ROBOTS[key];
    const ult = ROBOT_ULTIMATES[key];
    const locked = !isRobotUnlocked(key);
    const color = ROBOT_COLORS[robot.archetype];

    // --- Background color wash (character theme color) ---
    const bgWash = this.add
      .rectangle(gameWidth * 0.65, gameHeight / 2, gameWidth * 0.7, gameHeight, color, 0.08);
    this.contentGroup.push(bgWash);

    // --- Character portrait (right side, large) ---
    const portraitX = gameWidth * 0.72;
    const portraitY = gameHeight * 0.48;
    const battleKey = robot.battleAssetKey;

    if (this.textures.exists(battleKey)) {
      const img = this.add.image(portraitX, portraitY, battleKey)
        .setScale(1.2)
        .setAlpha(locked ? 0.3 : 0.9);
      this.contentGroup.push(img);
    } else {
      // Placeholder silhouette
      const sil = this.add
        .rectangle(portraitX, portraitY, 320, 440, color, locked ? 0.15 : 0.3)
        .setStrokeStyle(3, color);
      this.contentGroup.push(sil);
    }

    // --- Info panel (left side) ---
    const infoX = 120;
    const infoPanelBg = createPanel(this, infoX + 200, gameHeight / 2 - 20, 440, 400, { fillAlpha: 0.5, depth: 0 });
    this.contentGroup.push(infoPanelBg);

    // Character selector icons (bottom center)
    const iconSize = 56;
    const iconGap = 16;
    const totalIconW = this.keys.length * iconSize + (this.keys.length - 1) * iconGap;
    const iconStartX = gameWidth / 2 - totalIconW / 2 + iconSize / 2;
    const iconY = gameHeight - 50;

    for (let i = 0; i < this.keys.length; i++) {
      const k = this.keys[i]!;
      const r = ROBOTS[k];
      const c = ROBOT_COLORS[r.archetype];
      const isCurrent = i === this.selectedIndex;
      const isUnlocked = isRobotUnlocked(k);
      const ix = iconStartX + i * (iconSize + iconGap);

      // Icon background
      const iconBg = createPanel(this, ix, iconY, iconSize, iconSize, {
        fillColor: isCurrent ? c : 0x1a1a28,
        borderColor: isCurrent ? 0xffffff : 0x444455,
        borderWidth: isCurrent ? 3 : 2,
        depth: 2
      });
      iconBg.setInteractive({ useHandCursor: true });
      this.contentGroup.push(iconBg);

      // Face placeholder (first letter of name)
      const iconLabel = this.add
        .text(ix, iconY, isUnlocked ? r.name.charAt(0) : '?', {
          ...textStyles.body,
          fontSize: isCurrent ? '28px' : '22px',
          fontStyle: 'bold'
        })
        .setOrigin(0.5)
        .setColor(isCurrent ? '#0a0a10' : (isUnlocked ? '#888899' : '#333344'));
      this.contentGroup.push(iconLabel);

      // Click to switch
      iconBg.on('pointerdown', () => {
        if (this.selectedIndex !== i) {
          this.selectedIndex = i;
          playSfx('click');
          this.drawCharacter();
        } else {
          this.confirm();
        }
      });
      iconBg.on('pointerover', () => {
        if (!isCurrent) iconBg.setStrokeStyle(2, 0xaaaaaa);
      });
      iconBg.on('pointerout', () => {
        if (!isCurrent) iconBg.setStrokeStyle(2, 0x444455);
      });
    }

    // Name (large)
    const nameText = this.add
      .text(infoX, 120, t(robot.name), { ...textStyles.title, fontSize: '56px' })
      .setOrigin(0, 0)
      .setColor(locked ? '#555555' : '#ffffff');
    this.contentGroup.push(nameText);

    // Archetype badge
    const archText = this.add
      .text(infoX, 185, robot.archetype.toUpperCase(), textStyles.body)
      .setOrigin(0, 0)
      .setAlpha(0.6);
    this.contentGroup.push(archText);

    // Accent line under name
    const line = this.add
      .rectangle(infoX + 120, 210, 240, 3, color, 0.8)
      .setOrigin(0.5, 0);
    this.contentGroup.push(line);

    // Description
    const descText = this.add
      .text(infoX, 230, t(robot.description), { ...textStyles.body, wordWrap: { width: 450 } })
      .setOrigin(0, 0)
      .setAlpha(0.85);
    this.contentGroup.push(descText);

    // Passive
    const passiveText = this.add
      .text(infoX, 290, t(robot.passiveText), textStyles.small)
      .setOrigin(0, 0)
      .setAlpha(0.6);
    this.contentGroup.push(passiveText);

    // Stats
    const statsY = 340;
    const statsLines = [
      `HP  ${robot.baseHp}`,
      `Slots  ${robot.slots.length}`,
      `Buff Slots  ${robot.buffSlots}`,
    ];
    const statsText = this.add
      .text(infoX, statsY, statsLines.join('    '), textStyles.body)
      .setOrigin(0, 0)
      .setAlpha(0.7);
    this.contentGroup.push(statsText);

    // Ultimate name
    if (ult) {
      const ultText = this.add
        .text(infoX, statsY + 40, `ULT: ${ult.name}`, textStyles.body)
        .setOrigin(0, 0)
        .setColor('#ffd94a');
      this.contentGroup.push(ultText);
    }

    // --- EMBARK button or LOCKED ---
    if (locked) {
      const lockText = this.add
        .text(infoX, gameHeight - 120, 'LOCKED', { ...textStyles.title, fontSize: '40px' })
        .setOrigin(0, 0.5)
        .setColor('#ff4444')
        .setAlpha(0.8);
      this.contentGroup.push(lockText);

      const lockHint = this.add
        .text(infoX, gameHeight - 80, t('Clear the previous character to unlock'), textStyles.small)
        .setOrigin(0, 0.5)
        .setAlpha(0.4);
      this.contentGroup.push(lockHint);
    } else {
      const embark = createButton(this, infoX + 120, gameHeight - 100, 280, 56,
        t('EMBARK'), () => this.confirm(),
        { variant: 'accent', accentColor: color }
      );
      this.contentGroup.push(embark.bg);
      this.contentGroup.push(embark.text);
    }

    applyHiDpiToScene(this);
  }

  private confirm(): void {
    const robotKey: RobotKey = this.keys[this.selectedIndex]!;
    if (!isRobotUnlocked(robotKey)) {
      playSfx('click');
      return;
    }
    playSfx('buy');
    const fresh = resetRunState(this);
    const save = loadSaveData();
    const isKnightFirstRun = robotKey === 'robot_knight' && (save.perRobotClears[robotKey] ?? 0) === 0;
    const generatedRounds = generateRunEnemies(isSuperBossUnlocked(), undefined, isKnightFirstRun);
    const debugGold = isDebugEnabled() ? 100000 : fresh.gold;
    const next = { ...fresh, robotKey, gold: debugGold, shopOffer: generateShopOffer(), generatedRounds };
    setRunState(this, next);
    getRunState(this);
    fadeToScene(this, 'Build');
  }
}
