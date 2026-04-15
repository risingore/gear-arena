import { Scene } from 'phaser';
import type { GameObjects } from 'phaser';

import gameOptions from '../helper/gameOptions';
import {
  PARTS,
  ROBOTS,
  ECONOMY,
  type PartKey,
  type RobotKey,
  type SlotDef
} from '@/data';
import { getRunState, setRunState } from '../systems/runState';
import { PALETTE, CATEGORY_COLORS, CATEGORY_LABEL } from '../systems/palette';
import { computeLoadoutStats } from '../systems/stats';
import { generateShopOffer } from '../systems/shop';
import { attemptBuy, attemptSell, attemptReroll } from '../systems/loadout';
import { playSfx } from '../systems/audio';
import { fadeInCurrent, fadeToScene } from '../systems/transition';
import { t } from '../systems/i18n';
import { playMusic, MUSIC_KEYS } from '../systems/music';
import { applyHiDpiToScene } from '../helper/hiDpiText';

const BLUEPRINT_BOX_W = 420;
const BLUEPRINT_BOX_H = 580;
const SLOT_RADIUS = 18;
const SHOP_CARD_W = 120;
const SHOP_CARD_H = 90;
const SHOP_CARD_GAP = 10;
const SHOP_COLS = 2;
const SHOP_AREA_X = 470;

interface SlotVisual {
  readonly slot: SlotDef;
  circle: GameObjects.Arc;
  label: GameObjects.Text;
  icon: GameObjects.Rectangle | null;
}

export class Build extends Scene {
  private slotVisuals: SlotVisual[] = [];
  private shopContainers: GameObjects.Container[] = [];
  private goldText!: GameObjects.Text;
  private statsText!: GameObjects.Text;
  private previewText!: GameObjects.Text;
  private roundText!: GameObjects.Text;
  private blueprintOriginX = 0;
  private blueprintOriginY = 0;
  private blueprintScale = 1;
  private hoverShopIndex: number | null = null;

  constructor() {
    super('Build');
  }

  create(): void {
    const { textStyles } = gameOptions;
    const state = getRunState(this);
    if (!state.robotKey) {
      this.scene.start('Select');
      return;
    }
    if (state.shopOffer.length === 0) {
      const next = { ...state, shopOffer: generateShopOffer() };
      setRunState(this, next);
    }

    this.cameras.main.setBackgroundColor(PALETTE.bg);
    fadeInCurrent(this);
    playMusic(this, MUSIC_KEYS.build);

    // Header (compact — body size, not title, to save vertical space)
    this.roundText = this.add
      .text(20, 16, '', textStyles.body)
      .setOrigin(0, 0);

    this.add
      .text(20, 44, t('BUILD your machine — click shop or press 1-5 to buy, click slots to sell'), textStyles.small)
      .setOrigin(0, 0)
      .setAlpha(0.5);

    // Blueprint panel (left, large)
    this.drawBlueprintPanel(state.robotKey);

    // Gold + stats (far right column, x=750)
    const rightX = 750;
    this.goldText = this.add
      .text(rightX, 72, '', textStyles.body)
      .setOrigin(0, 0)
      .setColor('#ffd94a');

    this.statsText = this.add
      .text(rightX, 110, '', textStyles.small)
      .setOrigin(0, 0);

    this.previewText = this.add
      .text(rightX, 310, '', textStyles.small)
      .setOrigin(0, 0)
      .setColor('#3ab0ff');

    // Reroll + Ready buttons (far right, bottom)
    this.drawButton(rightX + 100, 540, 180, 44, `${t('REROLL')} (${ECONOMY.rerollCost}g)`, () => {
      const s = getRunState(this);
      const rerolled = attemptReroll(s, generateShopOffer());
      if (rerolled) {
        setRunState(this, rerolled);
        this.refreshShop();
        this.refreshHud();
        playSfx('reroll');
      } else {
        playSfx('click');
      }
    });

    this.drawButton(rightX + 100, 610, 180, 50, t('READY  ▶'), () => {
      playSfx('click');
      fadeToScene(this, 'Battle');
    });

    // Shop (bottom)
    this.drawShopArea();

    // Global R restart
    this.input.keyboard?.on('keydown-R', () => fadeToScene(this, 'Title'));
    this.input.keyboard?.on('keydown-SPACE', () => {
      playSfx('click');
      fadeToScene(this, 'Battle');
    });

    // Number keys 1-5 buy from shop slot i-1
    const numberKeys = ['ONE', 'TWO', 'THREE', 'FOUR', 'FIVE'] as const;
    numberKeys.forEach((key, i) => {
      this.input.keyboard?.on(`keydown-${key}`, () => this.handleShopClick(i));
    });

    this.refreshAll();

    applyHiDpiToScene(this);
  }

  // --------------------------------------------------------------------------
  // Blueprint + slots
  // --------------------------------------------------------------------------

  private drawBlueprintPanel(robotKey: RobotKey): void {
    const { textStyles } = gameOptions;
    const robot = ROBOTS[robotKey];
    const panelX = 20;
    const panelY = 66;

    this.add
      .rectangle(panelX, panelY, BLUEPRINT_BOX_W, BLUEPRINT_BOX_H, PALETTE.blueprintBg, 1)
      .setOrigin(0, 0)
      .setStrokeStyle(2, PALETTE.blueprintLine);

    this.add
      .text(panelX + 12, panelY + 10, `${t(robot.name)}  :  ${t('BLUEPRINT')}`, textStyles.small)
      .setColor('#aeeaff');

    // Placeholder robot silhouette (rectangle) centered inside the panel.
    const silhouetteX = panelX + BLUEPRINT_BOX_W / 2;
    const silhouetteY = panelY + BLUEPRINT_BOX_H / 2 + 10;
    this.add
      .rectangle(silhouetteX, silhouetteY, BLUEPRINT_BOX_W * 0.55, BLUEPRINT_BOX_H * 0.72, 0x000000, 0)
      .setStrokeStyle(2, PALETTE.blueprintLine);

    // Slot coordinates in robot data are authored in a 192x220 virtual space.
    // Map them into the blueprint panel.
    const virtualW = 192;
    const virtualH = 220;
    const drawableW = BLUEPRINT_BOX_W * 0.75;
    const drawableH = BLUEPRINT_BOX_H * 0.8;
    this.blueprintScale = Math.min(drawableW / virtualW, drawableH / virtualH);
    this.blueprintOriginX = silhouetteX - (virtualW * this.blueprintScale) / 2;
    this.blueprintOriginY = silhouetteY - (virtualH * this.blueprintScale) / 2;

    this.slotVisuals = robot.slots.map((slot) => {
      const cx = this.blueprintOriginX + slot.x * this.blueprintScale;
      const cy = this.blueprintOriginY + slot.y * this.blueprintScale;
      const circle = this.add
        .circle(cx, cy, SLOT_RADIUS, PALETTE.slotEmpty, 1)
        .setStrokeStyle(2, PALETTE.slotEmptyStroke);
      circle.setInteractive({ useHandCursor: true });
      circle.on('pointerdown', () => this.handleSlotClick(slot.id));

      const label = this.add
        .text(cx, cy, CATEGORY_LABEL[slot.accepts], { ...gameOptions.textStyles.small, color: '#aeeaff' })
        .setOrigin(0.5);

      return { slot, circle, label, icon: null };
    });
  }

  private handleSlotClick(slotId: string): void {
    const state = getRunState(this);
    if (!state.equipped[slotId]) return;
    const next = attemptSell(state, slotId);
    setRunState(this, next);
    this.refreshSlots();
    this.refreshHud();
    playSfx('sell');
    this.flashSlot(slotId);
  }

  private flashSlot(slotId: string): void {
    const sv = this.slotVisuals.find((s) => s.slot.id === slotId);
    if (!sv) return;
    this.tweens.add({
      targets: sv.circle,
      scale: { from: 1.3, to: 1 },
      duration: 220,
      ease: 'Cubic.easeOut'
    });
  }

  private refreshSlots(): void {
    const state = getRunState(this);
    this.slotVisuals.forEach((sv) => {
      const partKey = state.equipped[sv.slot.id];
      if (sv.icon) {
        sv.icon.destroy();
        sv.icon = null;
      }
      if (partKey) {
        const part = PARTS[partKey];
        const color = CATEGORY_COLORS[part.category];
        sv.circle.setFillStyle(PALETTE.slotFilled, 1);
        sv.circle.setStrokeStyle(2, PALETTE.slotFilledStroke);
        sv.label.setText(CATEGORY_LABEL[part.category]).setColor('#ffffff');
        sv.icon = this.add
          .rectangle(sv.circle.x, sv.circle.y - SLOT_RADIUS - 10, 12, 12, color, 1)
          .setStrokeStyle(1, PALETTE.textPrimary);
      } else {
        sv.circle.setFillStyle(PALETTE.slotEmpty, 1);
        sv.circle.setStrokeStyle(2, PALETTE.slotEmptyStroke);
        sv.label.setText(CATEGORY_LABEL[sv.slot.accepts]).setColor('#aeeaff');
      }
    });
  }

  // --------------------------------------------------------------------------
  // Shop
  // --------------------------------------------------------------------------

  private drawShopArea(): void {
    const { textStyles } = gameOptions;
    // 2-column grid to the right of the blueprint panel.
    const gridLeft = SHOP_AREA_X;
    const gridTop = 108;

    this.add
      .text(gridLeft + (SHOP_COLS * (SHOP_CARD_W + SHOP_CARD_GAP)) / 2 - SHOP_CARD_GAP / 2, gridTop - 24, t('SHOP'), textStyles.body)
      .setOrigin(0.5)
      .setAlpha(0.8);

    this.shopContainers = [];
    for (let i = 0; i < ECONOMY.shopSlotCount; i += 1) {
      const col = i % SHOP_COLS;
      const row = Math.floor(i / SHOP_COLS);
      const x = gridLeft + col * (SHOP_CARD_W + SHOP_CARD_GAP) + SHOP_CARD_W / 2;
      const y = gridTop + row * (SHOP_CARD_H + SHOP_CARD_GAP) + SHOP_CARD_H / 2;
      const container = this.add.container(x, y);
      const bg = this.add
        .rectangle(0, 0, SHOP_CARD_W, SHOP_CARD_H, PALETTE.cardBg, 1)
        .setStrokeStyle(2, PALETTE.cardStroke);
      bg.setInteractive({ useHandCursor: true });
      bg.on('pointerdown', () => this.handleShopClick(i));
      bg.on('pointerover', () => {
        bg.setFillStyle(PALETTE.cardBgHover, 1);
        this.hoverShopIndex = i;
        this.refreshHud();
      });
      bg.on('pointerout', () => {
        bg.setFillStyle(PALETTE.cardBg, 1);
        if (this.hoverShopIndex === i) {
          this.hoverShopIndex = null;
          this.refreshHud();
        }
      });
      container.add(bg);
      this.shopContainers.push(container);
    }
    this.refreshShop();
  }

  private handleShopClick(index: number): void {
    const state = getRunState(this);
    const result = attemptBuy(state, index);
    if (result.ok && result.next) {
      const before = Object.keys(state.equipped);
      const after = Object.keys(result.next.equipped);
      const newSlot = after.find((s) => !before.includes(s));
      setRunState(this, result.next);
      this.refreshSlots();
      this.refreshShop();
      this.refreshHud();
      playSfx('buy');
      if (newSlot) this.flashSlot(newSlot);
    } else {
      playSfx('click');
    }
  }

  private refreshShop(): void {
    const { textStyles } = gameOptions;
    const state = getRunState(this);
    this.shopContainers.forEach((container, i) => {
      // Strip previous dynamic children (everything except the bg at index 0).
      const bg = container.list[0] as GameObjects.Rectangle;
      container.list.slice(1).forEach((child) => child.destroy());
      const key = state.shopOffer[i] as PartKey | '' | undefined;
      if (!key) {
        bg.setFillStyle(PALETTE.buttonDisabled, 1);
        container.add(this.add.text(0, 0, t('SOLD'), textStyles.small).setOrigin(0.5));
        return;
      }
      bg.setFillStyle(PALETTE.cardBg, 1);
      const part = PARTS[key];
      const categoryBar = this.add
        .rectangle(0, -SHOP_CARD_H / 2 + 12, SHOP_CARD_W - 16, 6, CATEGORY_COLORS[part.category], 1);
      container.add(categoryBar);
      container.add(
        this.add
          .text(0, -SHOP_CARD_H / 2 + 28, CATEGORY_LABEL[part.category], textStyles.small)
          .setOrigin(0.5)
          .setColor('#aaaabb')
      );
      container.add(
        this.add.text(0, -10, t(part.name), textStyles.body).setOrigin(0.5)
      );
      container.add(
        this.add
          .text(0, 28, t(part.description), { ...textStyles.small, wordWrap: { width: SHOP_CARD_W - 20 } })
          .setOrigin(0.5, 0)
          .setAlpha(0.75)
      );
      container.add(
        this.add
          .text(0, SHOP_CARD_H / 2 - 22, `${part.price}g`, textStyles.body)
          .setOrigin(0.5)
          .setColor('#ffd94a')
      );
    });
  }

  // --------------------------------------------------------------------------
  // Buttons / HUD
  // --------------------------------------------------------------------------

  private drawButton(
    x: number,
    y: number,
    w: number,
    h: number,
    label: string,
    onClick: () => void
  ): GameObjects.Rectangle {
    const bg = this.add
      .rectangle(x, y, w, h, PALETTE.buttonBg, 1)
      .setStrokeStyle(2, PALETTE.cardStroke);
    bg.setInteractive({ useHandCursor: true });
    bg.on('pointerover', () => bg.setFillStyle(PALETTE.buttonBgHover, 1));
    bg.on('pointerout', () => bg.setFillStyle(PALETTE.buttonBg, 1));
    bg.on('pointerdown', onClick);
    this.add.text(x, y, label, gameOptions.textStyles.body).setOrigin(0.5);
    return bg;
  }

  private refreshHud(): void {
    const state = getRunState(this);
    const totalRounds = state.generatedRounds?.length || 10;
    this.roundText.setText(`${t('ROUND')} ${state.currentRound} / ${totalRounds}`);

    // Gold display + overflow warning (large reserve is suspicious)
    this.goldText.setText(`${state.gold}g`);
    if (state.gold >= 15) this.goldText.setColor('#ff7a00');
    else this.goldText.setColor('#ffd94a');

    if (!state.robotKey) return;
    const robot = ROBOTS[state.robotKey];
    const stats = computeLoadoutStats(robot, state.equipped);
    const weaponSummary =
      stats.weapons.length === 0
        ? t('— no weapon equipped —')
        : stats.weapons
            .map((w) => `${t(w.name)}  ${w.damage}${t('dmg')} / ${w.cooldownSec.toFixed(2)}s`)
            .join('\n');
    this.statsText.setText(
      [
        `${t('MAX HP')}       ${stats.maxHp}`,
        `${t('DR flat')}      ${stats.damageReductionFlat}`,
        `${t('DR pct')}       ${(stats.damageReductionPct * 100).toFixed(0)}%`,
        '',
        t('WEAPONS'),
        weaponSummary
      ].join('\n')
    );

    // Hover preview: simulate buying the hovered shop card
    if (this.hoverShopIndex !== null) {
      const hoveredKey = state.shopOffer[this.hoverShopIndex] as PartKey | '' | undefined;
      if (hoveredKey) {
        const part = PARTS[hoveredKey];
        const slotId = this.findFreeSlotFor(state.robotKey, hoveredKey, state.equipped);
        if (slotId) {
          const nextEquipped = { ...state.equipped, [slotId]: hoveredKey };
          const nextStats = computeLoadoutStats(robot, nextEquipped);
          const lines: string[] = [`${t('PREVIEW')}: ${t('buy')} ${t(part.name)} (${part.price}g)`];
          const hpDelta = nextStats.maxHp - stats.maxHp;
          if (hpDelta !== 0) lines.push(`  ${t('MAX HP')}  ${stats.maxHp} → ${nextStats.maxHp}  (${hpDelta > 0 ? '+' : ''}${hpDelta})`);
          const drFlatDelta = nextStats.damageReductionFlat - stats.damageReductionFlat;
          if (drFlatDelta !== 0) lines.push(`  ${t('DR flat')} ${stats.damageReductionFlat} → ${nextStats.damageReductionFlat}`);
          const drPctDelta = nextStats.damageReductionPct - stats.damageReductionPct;
          if (Math.abs(drPctDelta) > 0.001)
            lines.push(`  ${t('DR pct')}  ${(stats.damageReductionPct * 100).toFixed(0)}% → ${(nextStats.damageReductionPct * 100).toFixed(0)}%`);
          const wDelta = nextStats.weapons.length - stats.weapons.length;
          if (wDelta !== 0) lines.push(`  ${t('Weapons')} ${stats.weapons.length} → ${nextStats.weapons.length}`);
          if (lines.length === 1) lines.push(`  ${t('(stats unchanged)')}`);
          this.previewText.setText(lines.join('\n'));
        } else {
          this.previewText.setText(`${t('PREVIEW')}: ${t(part.name)}\n  ${t('no matching free slot')}`);
        }
      } else {
        this.previewText.setText('');
      }
    } else {
      this.previewText.setText('');
    }
  }

  private findFreeSlotFor(
    robotKey: RobotKey,
    partKey: PartKey,
    equipped: Readonly<Record<string, PartKey>>
  ): string | null {
    const robot = ROBOTS[robotKey];
    const part = PARTS[partKey];
    for (const slot of robot.slots) {
      if (equipped[slot.id]) continue;
      if (!part.allowedSlots.some((s) => s === slot.slotType)) continue;
      return slot.id;
    }
    return null;
  }

  private refreshAll(): void {
    this.refreshSlots();
    this.refreshShop();
    this.refreshHud();
  }
}
