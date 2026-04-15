import { Scene } from 'phaser';
import type { GameObjects } from 'phaser';

import gameOptions from '../helper/gameOptions';
import { ROBOTS, ALL_ROBOT_KEYS, type RobotKey } from '@/data';
import { getRunState, setRunState, resetRunState } from '../systems/runState';
import { PALETTE, ROBOT_COLORS } from '../systems/palette';
import { generateShopOffer } from '../systems/shop';
import { playSfx } from '../systems/audio';
import { fadeInCurrent, fadeToScene } from '../systems/transition';
import { t } from '../systems/i18n';
import { applyHiDpiToScene } from '../helper/hiDpiText';

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
      .text(gameWidth / 2, 100, t('← →  to browse    ENTER  to confirm'), textStyles.body)
      .setOrigin(0.5)
      .setAlpha(0.7);

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
        this.selectedIndex = i;
        this.refresh();
      });
      card.on('pointerover', () => {
        this.selectedIndex = i;
        this.refresh();
      });
      this.cards.push(card);

      // Archetype-colored silhouette placeholder for this robot.
      const silhouetteColor = ROBOT_COLORS[robot.archetype];
      this.add
        .rectangle(x, cardY - 40, CARD_WIDTH * 0.45, CARD_HEIGHT * 0.45, silhouetteColor, 1)
        .setStrokeStyle(2, PALETTE.textPrimary);

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
    });

    this.detailText = this.add
      .text(gameWidth / 2, gameHeight - 80, '', textStyles.body)
      .setOrigin(0.5)
      .setAlpha(0.9);

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

    // Double-click / second pointerdown confirms selection.
    this.cards.forEach((card, i) => {
      card.on('pointerdown', () => {
        if (this.selectedIndex === i) {
          // Confirm on second click of same card (or on explicit Enter).
        }
      });
    });

    applyHiDpiToScene(this);
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
    playSfx('buy');
    const robotKey: RobotKey = this.keys[this.selectedIndex]!;
    const fresh = resetRunState(this);
    const next = { ...fresh, robotKey, shopOffer: generateShopOffer() };
    setRunState(this, next);
    // Ensure run state is freshly armed.
    getRunState(this);
    fadeToScene(this, 'Build');
  }
}
