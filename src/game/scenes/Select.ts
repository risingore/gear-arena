import { Scene } from 'phaser';
import type { GameObjects } from 'phaser';

import gameOptions from '../helper/gameOptions';
import { ROBOTS, ALL_ROBOT_KEYS, ROBOT_ULTIMATES, type RobotKey } from '@/data';
import { getRunState, setRunState, resetRunState } from '../systems/runState';
import { PALETTE, ROBOT_COLORS } from '../systems/palette';
import { generateShopOffer } from '../systems/shop';
import { generateRunEnemies } from '../systems/enemyPool';
import { isRobotUnlocked, isSuperBossUnlocked } from '../systems/savedata';
import { playSfx } from '../systems/audio';
import { fadeInCurrent, fadeToScene } from '../systems/transition';
import { t } from '../systems/i18n';
import { applyHiDpiToScene, showDebugBadge } from '../helper/hiDpiText';
import { isDebugEnabled } from '../systems/debug';
import { CATEGORY_COLORS } from '../systems/palette';

const CARD_WIDTH = 200;
const CARD_HEIGHT = 360;
const CARD_GAP = 40;
const CARD_STROKE = 3;

export class Select extends Scene {
  private selectedIndex = 0;
  private cards: GameObjects.Rectangle[] = [];
  private detailText!: GameObjects.Text;
  private readonly keys = ALL_ROBOT_KEYS;

  constructor() {
    super('Select');
  }

  create(): void {
    const { gameWidth, gameHeight, textStyles } = gameOptions;
    this.cameras.main.setBackgroundColor(PALETTE.bg);
    fadeInCurrent(this);

    this.add
      .text(gameWidth / 2, 48, t('SELECT YOUR MACHINE'), textStyles.title)
      .setOrigin(0.5);

    this.add
      .text(gameWidth / 2, 100, t('Click a machine to deploy'), textStyles.small)
      .setOrigin(0.5)
      .setAlpha(0.5);

    const totalWidth = this.keys.length * CARD_WIDTH + (this.keys.length - 1) * CARD_GAP;
    const startX = gameWidth / 2 - totalWidth / 2 + CARD_WIDTH / 2;
    const cardY = gameHeight / 2 - 20;

    this.keys.forEach((key, i) => {
      const robot = ROBOTS[key];
      const x = startX + i * (CARD_WIDTH + CARD_GAP);

      const card = this.add
        .rectangle(x, cardY, CARD_WIDTH, CARD_HEIGHT, PALETTE.cardBg, 1)
        .setStrokeStyle(CARD_STROKE, PALETTE.cardStroke);
      card.setInteractive({ useHandCursor: true });
      card.on('pointerdown', () => {
        if (this.selectedIndex === i) {
          // Second click on same card confirms immediately.
          this.confirm();
        } else {
          this.selectedIndex = i;
          playSfx('click');
          this.refresh();
        }
      });
      card.on('pointerover', () => {
        if (this.selectedIndex !== i) {
          this.selectedIndex = i;
          this.refresh();
        }
      });
      this.cards.push(card);

      // Robot preview: blueprint slot layout (shows slot positions in miniature)
      // or archetype-colored silhouette as fallback.
      const previewCx = x;
      const previewCy = cardY - 40;
      const previewW = CARD_WIDTH * 0.45;
      const previewH = CARD_HEIGHT * 0.45;

      if (isDebugEnabled() || true) {
        // Mini blueprint: dark bg + slot circles scaled to fit the preview area
        this.add
          .rectangle(previewCx, previewCy, previewW, previewH, PALETTE.blueprintBg, 1)
          .setStrokeStyle(2, PALETTE.blueprintLine);
        const virtualW = 192;
        const virtualH = 220;
        const scale = Math.min(previewW * 0.85 / virtualW, previewH * 0.85 / virtualH);
        const ox = previewCx - (virtualW * scale) / 2;
        const oy = previewCy - (virtualH * scale) / 2;
        const miniRadius = Math.max(4, Math.round(8 * scale));
        for (const slot of robot.slots) {
          const sx = ox + slot.x * scale;
          const sy = oy + slot.y * scale;
          this.add
            .circle(sx, sy, miniRadius, CATEGORY_COLORS[slot.accepts], 1)
            .setStrokeStyle(1, PALETTE.blueprintLine);
        }
      } else {
        const silhouetteColor = ROBOT_COLORS[robot.archetype];
        this.add
          .rectangle(previewCx, previewCy, previewW, previewH, silhouetteColor, 1)
          .setStrokeStyle(2, PALETTE.textPrimary);
      }

      this.add
        .text(x, cardY + 80, t(robot.name), textStyles.body)
        .setOrigin(0.5)
        .setColor('#ffffff');

      this.add
        .text(x, cardY + 108, robot.archetype.toUpperCase(), textStyles.small)
        .setOrigin(0.5);

      this.add
        .text(x, cardY + 132, `HP ${robot.baseHp}  |  Slots ${robot.slots.length}`, textStyles.small)
        .setOrigin(0.5);

      // Ultimate ability name
      const ult = ROBOT_ULTIMATES[key];
      if (ult) {
        this.add
          .text(x, cardY + 152, `ULT: ${ult.name}`, textStyles.small)
          .setOrigin(0.5)
          .setColor('#ffd94a')
          .setAlpha(0.7);
      }

      // Lock overlay for unearned robots
      if (!isRobotUnlocked(key)) {
        this.add.rectangle(x, cardY, CARD_WIDTH, CARD_HEIGHT, 0x000000, 0.7);
        this.add
          .text(x, cardY, 'LOCKED', textStyles.body)
          .setOrigin(0.5)
          .setColor('#ff4444');
      }
    });

    this.detailText = this.add
      .text(gameWidth / 2, gameHeight - 64, '', textStyles.small)
      .setOrigin(0.5)
      .setAlpha(0.8);

    this.refresh();

    this.input.keyboard?.on('keydown-LEFT', () => {
      this.selectedIndex = (this.selectedIndex - 1 + this.keys.length) % this.keys.length;
      playSfx('click');
      this.refresh();
    });
    this.input.keyboard?.on('keydown-RIGHT', () => {
      this.selectedIndex = (this.selectedIndex + 1) % this.keys.length;
      playSfx('click');
      this.refresh();
    });
    this.input.keyboard?.on('keydown-ENTER', () => this.confirm());
    this.input.keyboard?.on('keydown-SPACE', () => this.confirm());
    this.input.keyboard?.on('keydown-R', () => fadeToScene(this, 'Title'));

    // BACK button
    const backText = this.add
      .text(80, gameHeight - 28, t('← BACK'), textStyles.body)
      .setOrigin(0.5)
      .setAlpha(0.7)
      .setInteractive({ useHandCursor: true });
    backText.on('pointerover', () => { backText.setAlpha(1); backText.setScale(1.05); });
    backText.on('pointerout', () => { backText.setAlpha(0.7); backText.setScale(1); });
    backText.on('pointerdown', () => { playSfx('click'); fadeToScene(this, 'Title'); });

    applyHiDpiToScene(this);
    showDebugBadge(this, isDebugEnabled());
  }

  private refresh(): void {
    this.cards.forEach((card, i) => {
      card.setStrokeStyle(
        CARD_STROKE,
        i === this.selectedIndex ? PALETTE.cardStrokeSelected : PALETTE.cardStroke
      );
      card.setFillStyle(i === this.selectedIndex ? PALETTE.cardBgHover : PALETTE.cardBg);
    });
    const robot = ROBOTS[this.keys[this.selectedIndex]!];
    this.detailText.setText(`${t(robot.name)}  —  ${t(robot.description)}\n${t(robot.passiveText)}`);
  }

  private confirm(): void {
    this.startRun();
  }

  private startRun(seed?: number): void {
    const robotKey: RobotKey = this.keys[this.selectedIndex]!;
    if (!isRobotUnlocked(robotKey)) {
      playSfx('click');
      return;
    }
    playSfx('buy');
    const fresh = resetRunState(this);
    const generatedRounds = generateRunEnemies(isSuperBossUnlocked(), seed);
    const debugGold = isDebugEnabled() ? 100000 : fresh.gold;
    const next = { ...fresh, robotKey, gold: debugGold, shopOffer: generateShopOffer(), generatedRounds };
    setRunState(this, next);
    getRunState(this);
    fadeToScene(this, 'Build');
  }
}
