import { Scene } from 'phaser';
import type { GameObjects } from 'phaser';

import gameOptions from '../helper/gameOptions';
import { createButton, createPanel } from '../helper/uiFactory';
import {
  PARTS,
  ROBOTS,
  ECONOMY,
  ITEMS,
  isItemKey,
  findSkillDef,
  type PartKey,
  type RobotKey,
  type ItemKey,
  type SlotDef,
} from '@/data';
import { getRunState, setRunState, type RunState } from '../systems/runState';
import { PALETTE, CATEGORY_COLORS, CATEGORY_LABEL } from '../systems/palette';
import { computeLoadoutStats } from '../systems/stats';
import { generateShopOffer } from '../systems/shop';
import { attemptSell, attemptReroll, getRerollCost } from '../systems/loadout';
import { playSfx } from '../systems/audio';
import { fadeInCurrent, fadeToScene } from '../systems/transition';
import { t } from '../systems/i18n';
import { playMusic, MUSIC_KEYS } from '../systems/music';
import { applyHiDpiToScene, showDebugBadge } from '../helper/hiDpiText';
import { runVisualChecks } from '../systems/visualDebugger';
import { isDebugEnabled } from '../systems/debug';

// ---------------------------------------------------------------------------
// Layout constants
// ---------------------------------------------------------------------------

const SKILL_COL_W = 72;
const BLUEPRINT_BOX_W = 370;
const BLUEPRINT_BOX_H = 570;
const SLOT_RADIUS = 18;
const SHOP_CARD_W = 130;
const SHOP_CARD_H = 90;
const SHOP_CARD_GAP = 8;
const SHOP_COLS = 2;
const STATS_W = 240;
const COL_GAP = 35;
const SHOP_W = SHOP_COLS * SHOP_CARD_W + (SHOP_COLS - 1) * SHOP_CARD_GAP;
const TOTAL_W = SKILL_COL_W + COL_GAP + BLUEPRINT_BOX_W + COL_GAP + SHOP_W + COL_GAP + STATS_W;
const LEFT_MARGIN = Math.floor((1280 - TOTAL_W) / 2);
const SKILL_COL_X = LEFT_MARGIN;
const BLUEPRINT_X = SKILL_COL_X + SKILL_COL_W + COL_GAP;
const SHOP_AREA_X = BLUEPRINT_X + BLUEPRINT_BOX_W + COL_GAP;
const STATS_X = SHOP_AREA_X + SHOP_W + COL_GAP;

/** Blueprint panel top offset. */
const BP_TOP = 58;
/** Buff slot row Y relative to blueprint bottom. */
const BUFF_SLOT_Y_OFFSET = 20;
const BUFF_SLOT_RADIUS = 16;
const BUFF_SLOT_GAP = 44;

/** Trash / basket zone below blueprint. */
const ZONE_Y = BP_TOP + BLUEPRINT_BOX_H + 14;
const ZONE_W = 80;
const ZONE_H = 50;
const BASKET_ITEM_W = 56;
const BASKET_ITEM_H = 28;
const BASKET_GAP = 4;

// ---------------------------------------------------------------------------
// Drag source enum
// ---------------------------------------------------------------------------

const enum DragSource {
  None = 0,
  Shop = 1,
  Slot = 2,
  BuffSlot = 3,
  Basket = 4,
}

// ---------------------------------------------------------------------------
// Interfaces
// ---------------------------------------------------------------------------

interface SlotVisual {
  readonly slot: SlotDef;
  circle: GameObjects.Arc;
  label: GameObjects.Text;
  icon: GameObjects.Rectangle | null;
}

interface BuffSlotVisual {
  readonly index: number;
  circle: GameObjects.Arc;
  label: GameObjects.Text;
}

// ---------------------------------------------------------------------------
// Scene
// ---------------------------------------------------------------------------

export class Build extends Scene {
  private slotVisuals: SlotVisual[] = [];
  private buffSlotVisuals: BuffSlotVisual[] = [];
  private shopContainers: GameObjects.Container[] = [];
  private goldText!: GameObjects.Text;
  private statsText!: GameObjects.Text;
  private previewText!: GameObjects.Text;
  private roundText!: GameObjects.Text;
  private rerollBtnText!: GameObjects.Text;
  private blueprintOriginX = 0;
  private blueprintOriginY = 0;
  private blueprintScale = 1;
  private hoverShopIndex: number | null = null;

  // Trash & basket zones
  private trashZone!: GameObjects.Rectangle;
  private basketZone!: GameObjects.Rectangle;
  private basketItems: GameObjects.Container[] = [];

  // Drag state
  private dragSource = DragSource.None;
  private dragShopIndex = -1;
  private dragSlotId = '';
  private dragBuffIndex = -1;
  private dragBasketIndex = -1;
  private dragGhost: GameObjects.Rectangle | null = null;
  private dragLabel: GameObjects.Text | null = null;

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
      setRunState(this, { ...state, shopOffer: generateShopOffer(state.currentRound) });
    }

    this.cameras.main.setBackgroundColor(PALETTE.bg);
    fadeInCurrent(this);
    playMusic(this, MUSIC_KEYS.build);

    // Header
    this.roundText = this.add
      .text(BLUEPRINT_X, 16, '', textStyles.body)
      .setOrigin(0, 0);

    // Left column — acquired skills
    this.drawSkillSlots(state.acquiredSkills);

    // Blueprint panel (slots + buff slots)
    this.drawBlueprintPanel(state.robotKey);

    // Trash & basket below blueprint
    this.drawTrashAndBasket();

    // Right column — stats panel background + gold + stats + preview
    createPanel(this, STATS_X + STATS_W / 2, 350, STATS_W + 16, 540, { fillAlpha: 0.5, depth: 0 });

    this.goldText = this.add
      .text(STATS_X, 72, '', textStyles.body)
      .setOrigin(0, 0)
      .setColor('#ffd94a');

    this.statsText = this.add
      .text(STATS_X, 110, '', textStyles.small)
      .setOrigin(0, 0);

    this.previewText = this.add
      .text(STATS_X, 310, '', textStyles.small)
      .setOrigin(0, 0)
      .setColor('#3ab0ff');

    // Buttons
    const btnX = STATS_X + STATS_W / 2;
    const rerollCost = getRerollCost(getRunState(this));
    const rerollBtn = createButton(this, btnX, 560, 200, 44, `${t('REROLL')} (${rerollCost}g)`, () => {
      const s = getRunState(this);
      const rerolled = attemptReroll(s, generateShopOffer(s.currentRound));
      if (rerolled) {
        setRunState(this, rerolled);
        this.refreshShop();
        this.refreshHud();
        playSfx('reroll');
      } else {
        playSfx('click');
      }
    });
    this.rerollBtnText = rerollBtn.text;

    createButton(this, btnX, 620, 200, 50, t('READY'), () => {
      playSfx('click');
      fadeToScene(this, 'Battle');
    }, { variant: 'accent', accentColor: 0x3aff7a });

    // Shop grid
    this.drawShopArea();

    // Keyboard shortcuts
    this.input.keyboard?.on('keydown-R', () => fadeToScene(this, 'Title'));
    this.input.keyboard?.on('keydown-SPACE', () => {
      playSfx('click');
      fadeToScene(this, 'Battle');
    });
    const numberKeys = ['ONE', 'TWO', 'THREE', 'FOUR', 'FIVE'] as const;
    numberKeys.forEach((key, i) => {
      this.input.keyboard?.on(`keydown-${key}`, () => this.handleShopKeypress(i));
    });

    // Scene-level drag tracking
    this.input.on('pointermove', (pointer: { x: number; y: number }) => {
      if (this.dragSource === DragSource.None) return;
      this.dragGhost?.setPosition(pointer.x, pointer.y);
      this.dragLabel?.setPosition(pointer.x, pointer.y - 20);
    });
    this.input.on('pointerup', (pointer: { x: number; y: number }) => {
      if (this.dragSource === DragSource.None) return;
      this.handleDrop(pointer.x, pointer.y);
    });

    this.refreshAll();

    if (state.currentRound === 1) {
      const hint = this.add
        .text(BLUEPRINT_X + BLUEPRINT_BOX_W / 2, gameOptions.gameHeight - 20,
          t('Drag parts from shop to blueprint slots'),
          { ...textStyles.small, color: '#88ccff' })
        .setOrigin(0.5, 1)
        .setAlpha(0.8);
      this.tweens.add({ targets: hint, alpha: 0, delay: 8000, duration: 2000 });
    }

    applyHiDpiToScene(this);
    showDebugBadge(this, isDebugEnabled());
    runVisualChecks(this);
  }

  // ==========================================================================
  // Blueprint + part slots
  // ==========================================================================

  private drawBlueprintPanel(robotKey: RobotKey): void {
    const { textStyles } = gameOptions;
    const robot = ROBOTS[robotKey];

    this.add
      .rectangle(BLUEPRINT_X, BP_TOP, BLUEPRINT_BOX_W, BLUEPRINT_BOX_H, PALETTE.blueprintBg, 1)
      .setOrigin(0, 0)
      .setStrokeStyle(2, PALETTE.blueprintLine);

    this.add
      .text(BLUEPRINT_X + 12, BP_TOP + 10, `${t(robot.name)}  :  ${t('BLUEPRINT')}`, textStyles.small)
      .setColor('#aeeaff');

    // Silhouette placeholder
    const silhouetteX = BLUEPRINT_X + BLUEPRINT_BOX_W / 2;
    const silhouetteY = BP_TOP + BLUEPRINT_BOX_H / 2 + 10;
    this.add
      .rectangle(silhouetteX, silhouetteY, BLUEPRINT_BOX_W * 0.55, BLUEPRINT_BOX_H * 0.72, 0x000000, 0)
      .setStrokeStyle(2, PALETTE.blueprintLine);

    // Coordinate mapping: virtual 192x220 -> panel
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
      circle.on('pointerdown', () => this.startDragFromSlot(slot.id));
      circle.on('pointerover', () => this.showSlotTooltip(slot.id));
      circle.on('pointerout', () => {
        if (this.hoverShopIndex === null) this.previewText.setText('');
      });

      const label = this.add
        .text(cx, cy, CATEGORY_LABEL[slot.accepts], { ...textStyles.small, color: '#aeeaff' })
        .setOrigin(0.5);

      return { slot, circle, label, icon: null };
    });

    // Buff slots at the bottom of the blueprint
    this.drawBuffSlots(robot.buffSlots);
  }

  private drawBuffSlots(count: number): void {
    const { textStyles } = gameOptions;
    const baseY = BP_TOP + BLUEPRINT_BOX_H - 40 - BUFF_SLOT_Y_OFFSET;
    const centerX = BLUEPRINT_X + BLUEPRINT_BOX_W / 2;
    const startX = centerX - ((count - 1) * BUFF_SLOT_GAP) / 2;

    this.buffSlotVisuals = [];
    for (let i = 0; i < count; i += 1) {
      const cx = startX + i * BUFF_SLOT_GAP;
      const cy = baseY;
      const circle = this.add
        .circle(cx, cy, BUFF_SLOT_RADIUS, PALETTE.slotEmpty, 1)
        .setStrokeStyle(2, PALETTE.itemBar);
      circle.setInteractive({ useHandCursor: true });
      circle.on('pointerdown', () => this.startDragFromBuffSlot(i));
      circle.on('pointerover', () => this.showBuffSlotTooltip(i));
      circle.on('pointerout', () => {
        if (this.hoverShopIndex === null) this.previewText.setText('');
      });

      const label = this.add
        .text(cx, cy, 'BUF', { ...textStyles.small, fontSize: '11px', color: PALETTE.itemText })
        .setOrigin(0.5);

      this.buffSlotVisuals.push({ index: i, circle, label });
    }
  }

  // ==========================================================================
  // Trash & Basket
  // ==========================================================================

  private drawTrashAndBasket(): void {
    const { textStyles } = gameOptions;
    const trashX = BLUEPRINT_X;
    const basketX = BLUEPRINT_X + ZONE_W + 16;

    // Trash zone
    this.trashZone = this.add
      .rectangle(trashX, ZONE_Y, ZONE_W, ZONE_H, 0x331515, 1)
      .setOrigin(0, 0)
      .setStrokeStyle(2, PALETTE.danger);
    this.add
      .text(trashX + ZONE_W / 2, ZONE_Y + ZONE_H / 2, t('SELL'), { ...textStyles.small, color: '#ff4444' })
      .setOrigin(0.5);

    // Basket zone
    const basketW = BLUEPRINT_BOX_W - ZONE_W - 16;
    this.basketZone = this.add
      .rectangle(basketX, ZONE_Y, basketW, ZONE_H, 0x1a1a28, 1)
      .setOrigin(0, 0)
      .setStrokeStyle(2, PALETTE.accentBlue);
    this.add
      .text(basketX + 4, ZONE_Y + 2, t('STORAGE'), { ...textStyles.small, fontSize: '11px', color: '#3ab0ff' })
      .setOrigin(0, 0);
  }

  private refreshBasketItems(): void {
    // Destroy old basket item visuals
    this.basketItems.forEach((c) => c.destroy());
    this.basketItems = [];

    const { textStyles } = gameOptions;
    const state = getRunState(this);
    const basketX = BLUEPRINT_X + ZONE_W + 16;
    const startX = basketX + 4;
    const startY = ZONE_Y + 18;

    state.storedParts.forEach((partKey, i) => {
      const part = PARTS[partKey];
      if (!part) return;
      const col = i % 4;
      const row = Math.floor(i / 4);
      const x = startX + col * (BASKET_ITEM_W + BASKET_GAP) + BASKET_ITEM_W / 2;
      const y = startY + row * (BASKET_ITEM_H + BASKET_GAP) + BASKET_ITEM_H / 2;

      const container = this.add.container(x, y);
      const bg = this.add
        .rectangle(0, 0, BASKET_ITEM_W, BASKET_ITEM_H, CATEGORY_COLORS[part.category], 0.3)
        .setStrokeStyle(1, CATEGORY_COLORS[part.category]);
      bg.setInteractive({ useHandCursor: true });
      bg.on('pointerdown', () => this.startDragFromBasket(i));
      bg.on('pointerover', () => {
        this.previewText.setText(`${t(part.name)} (${CATEGORY_LABEL[part.category]})\n${t(part.description)}`);
      });
      bg.on('pointerout', () => {
        if (this.hoverShopIndex === null) this.previewText.setText('');
      });
      container.add(bg);

      const lbl = this.add
        .text(0, 0, CATEGORY_LABEL[part.category], { ...textStyles.small, fontSize: '10px' })
        .setOrigin(0.5);
      container.add(lbl);

      this.basketItems.push(container);
    });
  }

  // ==========================================================================
  // Skill slots (left column)
  // ==========================================================================

  private drawSkillSlots(acquiredSkills: readonly string[]): void {
    const { textStyles } = gameOptions;
    const slotSize = SKILL_COL_W;
    const gap = 8;
    const centerX = SKILL_COL_X + SKILL_COL_W / 2;
    const startY = 80;
    const maxSlots = 3;

    this.add
      .text(centerX, startY - 18, t('SKILLS'), { ...textStyles.small, fontSize: '12px' })
      .setOrigin(0.5)
      .setAlpha(0.4);

    for (let i = 0; i < maxSlots; i += 1) {
      const y = startY + i * (slotSize + gap) + slotSize / 2;
      const skillId = acquiredSkills[i];
      const skill = skillId ? findSkillDef(skillId) : null;

      const bg = this.add
        .rectangle(centerX, y, slotSize, slotSize, skill ? 0x1a1a28 : 0x0d0d14, 1)
        .setStrokeStyle(skill ? 2 : 1, skill ? PALETTE.accentOrange : 0x333344);

      if (skill) {
        const words = skill.name.split(' ');
        this.add
          .text(centerX, y - 10, words[0]!, { ...textStyles.small, fontSize: '13px' })
          .setOrigin(0.5)
          .setColor('#ffd94a');
        if (words.length > 1) {
          this.add
            .text(centerX, y + 10, words.slice(1).join(' '), { ...textStyles.small, fontSize: '11px' })
            .setOrigin(0.5)
            .setColor('#ffd94a')
            .setAlpha(0.7);
        }
        bg.setInteractive({ useHandCursor: true });
        bg.on('pointerover', () => {
          this.previewText.setText(`${t('SKILL')}: ${t(skill.name)}\n  ${t(skill.description)}`);
          bg.setStrokeStyle(2, 0xffffff);
        });
        bg.on('pointerout', () => {
          this.previewText.setText('');
          bg.setStrokeStyle(2, PALETTE.accentOrange);
        });
      } else {
        this.add
          .rectangle(centerX, y, slotSize * 0.4, 2, 0x333344, 0.5);
      }
    }
  }

  // ==========================================================================
  // Shop
  // ==========================================================================

  private drawShopArea(): void {
    const { textStyles } = gameOptions;
    const gridLeft = SHOP_AREA_X;
    const gridTop = 108;

    this.add
      .text(
        gridLeft + (SHOP_COLS * (SHOP_CARD_W + SHOP_CARD_GAP)) / 2 - SHOP_CARD_GAP / 2,
        gridTop - 24,
        t('SHOP'),
        textStyles.body
      )
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
      bg.on('pointerdown', () => this.startDragFromShop(i));
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

  /**
   * Number key shortcut: auto-buy from shop index. For parts, finds first
   * free matching slot. For items, equips to first free buff slot.
   */
  private handleShopKeypress(index: number): void {
    const state = getRunState(this);
    const key = state.shopOffer[index];
    if (!key) return;

    if (isItemKey(key)) {
      this.buyItemToBuffSlot(index, key as ItemKey);
      return;
    }

    const partKey = key as PartKey;
    if (!state.robotKey) return;
    const slotId = this.findFreeSlotFor(state.robotKey, partKey, state.equipped);
    if (!slotId) { playSfx('click'); return; }
    this.executeBuyPart(index, partKey, slotId);
  }

  private refreshShop(): void {
    const { textStyles } = gameOptions;
    const state = getRunState(this);
    this.shopContainers.forEach((container, i) => {
      const bg = container.list[0] as GameObjects.Rectangle;
      container.list.slice(1).forEach((child) => child.destroy());
      const key = state.shopOffer[i] as string | undefined;
      if (!key) {
        bg.setFillStyle(PALETTE.buttonDisabled, 1);
        container.add(this.add.text(0, 0, t('SOLD'), textStyles.small).setOrigin(0.5));
        return;
      }
      if (isItemKey(key)) {
        const item = ITEMS[key];
        bg.setFillStyle(PALETTE.itemCardBg, 1);
        container.add(
          this.add.rectangle(0, -SHOP_CARD_H / 2 + 6, SHOP_CARD_W - 8, 4, PALETTE.itemBar, 1)
        );
        container.add(
          this.add
            .text(0, -SHOP_CARD_H / 2 + 18, t('BUFF'), textStyles.small)
            .setOrigin(0.5)
            .setColor(PALETTE.itemText)
        );
        container.add(
          this.add.text(0, 2, t(item.name), { ...textStyles.small, color: '#ffffff', wordWrap: { width: SHOP_CARD_W - 12 } }).setOrigin(0.5)
        );
        container.add(
          this.add
            .text(0, SHOP_CARD_H / 2 - 16, `${item.price}g`, textStyles.body)
            .setOrigin(0.5)
            .setColor('#ffd94a')
        );
        return;
      }

      bg.setFillStyle(PALETTE.cardBg, 1);
      const part = PARTS[key as PartKey];
      container.add(
        this.add.rectangle(0, -SHOP_CARD_H / 2 + 6, SHOP_CARD_W - 8, 4, CATEGORY_COLORS[part.category], 1)
      );
      container.add(
        this.add
          .text(0, -SHOP_CARD_H / 2 + 18, CATEGORY_LABEL[part.category], textStyles.small)
          .setOrigin(0.5)
          .setColor('#aaaabb')
      );
      container.add(
        this.add.text(0, 2, t(part.name), { ...textStyles.small, color: '#ffffff', wordWrap: { width: SHOP_CARD_W - 12 } }).setOrigin(0.5)
      );
      container.add(
        this.add
          .text(0, SHOP_CARD_H / 2 - 16, `${part.price}g`, textStyles.body)
          .setOrigin(0.5)
          .setColor('#ffd94a')
      );
    });
  }

  // ==========================================================================
  // Drag & Drop — start
  // ==========================================================================

  private startDragFromShop(shopIndex: number): void {
    const state = getRunState(this);
    const key = state.shopOffer[shopIndex];
    if (!key) return;

    this.dragSource = DragSource.Shop;
    this.dragShopIndex = shopIndex;
    const itemMode = isItemKey(key);
    const color = itemMode ? PALETTE.itemBar : PALETTE.accentBlue;
    const name = itemMode ? ITEMS[key].name : PARTS[key as PartKey].name;
    const ptr = this.input.activePointer;
    this.createGhost(ptr.x, ptr.y, color, name);
    this.highlightDropTargetsForShop(shopIndex);
  }

  private startDragFromSlot(slotId: string): void {
    const state = getRunState(this);
    const partKey = state.equipped[slotId];
    if (!partKey) return;
    const part = PARTS[partKey];
    if (!part) return;

    this.dragSource = DragSource.Slot;
    this.dragSlotId = slotId;
    const ptr = this.input.activePointer;
    this.createGhost(ptr.x, ptr.y, CATEGORY_COLORS[part.category], part.name);
    this.highlightTrashAndBasket();
  }

  private startDragFromBuffSlot(_buffIndex: number): void {
    // Buffs cannot be removed once equipped. Block drag.
  }

  private startDragFromBasket(basketIndex: number): void {
    const state = getRunState(this);
    const partKey = state.storedParts[basketIndex];
    if (!partKey) return;
    const part = PARTS[partKey];
    if (!part) return;

    this.dragSource = DragSource.Basket;
    this.dragBasketIndex = basketIndex;
    const ptr = this.input.activePointer;
    this.createGhost(ptr.x, ptr.y, CATEGORY_COLORS[part.category], part.name);
    this.highlightDropTargetsForPart(partKey);
  }

  private createGhost(x: number, y: number, color: number, name: string): void {
    this.dragGhost = this.add
      .rectangle(x, y, 36, 36, color, 0.7)
      .setStrokeStyle(2, 0xffffff)
      .setDepth(200);
    this.dragLabel = this.add
      .text(x, y - 20, t(name), gameOptions.textStyles.small)
      .setOrigin(0.5, 1)
      .setDepth(200);
  }

  // ==========================================================================
  // Drag & Drop — drop
  // ==========================================================================

  private handleDrop(x: number, y: number): void {
    const source = this.dragSource;
    const shopIdx = this.dragShopIndex;
    const slotId = this.dragSlotId;
    const buffIdx = this.dragBuffIndex;
    const basketIdx = this.dragBasketIndex;
    this.cancelDrag();

    switch (source) {
      case DragSource.Shop:
        this.dropFromShop(shopIdx, x, y);
        break;
      case DragSource.Slot:
        this.dropFromSlot(slotId, x, y);
        break;
      case DragSource.BuffSlot:
        this.dropFromBuffSlot(buffIdx, x, y);
        break;
      case DragSource.Basket:
        this.dropFromBasket(basketIdx, x, y);
        break;
    }
  }

  private dropFromShop(shopIndex: number, x: number, y: number): void {
    const state = getRunState(this);
    const key = state.shopOffer[shopIndex];
    if (!key) return;

    // Item -> buff slot
    if (isItemKey(key)) {
      const targetBuffIdx = this.findBuffSlotUnder(x, y);
      if (targetBuffIdx >= 0) {
        this.buyItemToBuffSlot(shopIndex, key as ItemKey);
      }
      return;
    }

    // Part -> blueprint slot
    const targetSlot = this.findSlotUnder(x, y);
    if (targetSlot) {
      this.executeBuyPart(shopIndex, key as PartKey, targetSlot.slot.id);
    }
  }

  private dropFromSlot(slotId: string, x: number, y: number): void {
    // Check trash zone
    if (this.isInsideRect(x, y, this.trashZone)) {
      this.executeSell(slotId);
      return;
    }
    // Check basket zone
    if (this.isInsideRect(x, y, this.basketZone)) {
      this.executeStore(slotId);
      return;
    }
    // Dropped nowhere valid -> snap back (no-op)
  }

  private dropFromBuffSlot(_buffIndex: number, _x: number, _y: number): void {
    // Buffs cannot be removed once equipped. No-op.
  }

  private dropFromBasket(basketIndex: number, x: number, y: number): void {
    const state = getRunState(this);
    const partKey = state.storedParts[basketIndex];
    if (!partKey) return;

    // Drop on a blueprint slot -> re-equip (no cost)
    const targetSlot = this.findSlotUnder(x, y);
    if (targetSlot) {
      this.executeReequip(basketIndex, partKey, targetSlot.slot.id);
      return;
    }
    // Drop on trash -> sell from basket
    if (this.isInsideRect(x, y, this.trashZone)) {
      this.executeSellFromBasket(basketIndex);
      return;
    }
  }

  // ==========================================================================
  // Actions
  // ==========================================================================

  private executeBuyPart(shopIndex: number, partKey: PartKey, slotId: string): void {
    const state = getRunState(this);
    if (!state.robotKey) return;
    const part = PARTS[partKey];
    if (!part) return;
    if (state.gold < part.price) { playSfx('click'); return; }

    const robot = ROBOTS[state.robotKey];
    const slot = robot.slots.find((s) => s.id === slotId);
    if (!slot) { playSfx('click'); return; }
    if (part.category !== slot.accepts) { playSfx('click'); return; }

    // Slot must be empty — reject if occupied
    if (state.equipped[slotId]) { playSfx('click'); return; }
    let next: RunState = state;

    const nextEquipped = { ...next.equipped, [slotId]: partKey };
    const nextOffer = [...next.shopOffer];
    nextOffer[shopIndex] = '';
    next = { ...next, gold: next.gold - part.price, equipped: nextEquipped, shopOffer: nextOffer };

    setRunState(this, next);
    this.refreshAll();
    playSfx('buy');
    this.flashSlot(slotId);
  }

  private buyItemToBuffSlot(shopIndex: number, itemKey: ItemKey): void {
    const state = getRunState(this);
    const item = ITEMS[itemKey as keyof typeof ITEMS];
    if (!item) return;
    if (state.gold < item.price) { playSfx('click'); return; }

    // Find first free buff slot
    const robot = state.robotKey ? ROBOTS[state.robotKey] : null;
    const maxBuffs = robot?.buffSlots ?? 0;
    if (state.equippedBuffs.length >= maxBuffs) { playSfx('click'); return; }

    const next: RunState = {
      ...state,
      gold: state.gold - item.price,
      shopOffer: state.shopOffer.map((s, i) => (i === shopIndex ? '' : s)),
      equippedBuffs: [...state.equippedBuffs, itemKey],
    };
    setRunState(this, next);
    this.refreshAll();
    playSfx('buy');
  }

  private executeSell(slotId: string): void {
    const state = getRunState(this);
    if (!state.equipped[slotId]) return;
    const next = attemptSell(state, slotId);
    setRunState(this, next);
    this.refreshAll();
    playSfx('sell');
    this.flashSlot(slotId);
  }

  private executeStore(slotId: string): void {
    const state = getRunState(this);
    const partKey = state.equipped[slotId];
    if (!partKey) return;
    const nextEquipped = { ...state.equipped };
    delete nextEquipped[slotId];
    const next: RunState = {
      ...state,
      equipped: nextEquipped,
      storedParts: [...state.storedParts, partKey],
    };
    setRunState(this, next);
    this.refreshAll();
    playSfx('click');
  }

  private executeReequip(basketIndex: number, partKey: PartKey, slotId: string): void {
    const state = getRunState(this);
    if (!state.robotKey) return;
    const part = PARTS[partKey];
    if (!part) return;
    const robot = ROBOTS[state.robotKey];
    const slot = robot.slots.find((s) => s.id === slotId);
    if (!slot) { playSfx('click'); return; }
    if (part.category !== slot.accepts) { playSfx('click'); return; }

    // Slot must be empty
    if (state.equipped[slotId]) { playSfx('click'); return; }

    const nextStored = [...state.storedParts];
    nextStored.splice(basketIndex, 1);
    const nextEquipped = { ...state.equipped, [slotId]: partKey };
    const next: RunState = { ...state, equipped: nextEquipped, storedParts: nextStored };

    setRunState(this, next);
    this.refreshAll();
    playSfx('buy');
    this.flashSlot(slotId);
  }

  private executeSellFromBasket(basketIndex: number): void {
    const state = getRunState(this);
    const partKey = state.storedParts[basketIndex];
    if (!partKey) return;
    const part = PARTS[partKey];
    if (!part) return;
    const refund = Math.floor(part.price * ECONOMY.sellRefundRatio);
    const nextStored = [...state.storedParts];
    nextStored.splice(basketIndex, 1);
    const next: RunState = {
      ...state,
      gold: state.gold + refund,
      storedParts: nextStored,
    };
    setRunState(this, next);
    this.refreshAll();
    playSfx('sell');
  }

  // ==========================================================================
  // Hit-testing
  // ==========================================================================

  private findSlotUnder(x: number, y: number): SlotVisual | undefined {
    return this.slotVisuals.find((sv) => {
      const dx = sv.circle.x - x;
      const dy = sv.circle.y - y;
      return Math.sqrt(dx * dx + dy * dy) <= SLOT_RADIUS * 1.8;
    });
  }

  private findBuffSlotUnder(x: number, y: number): number {
    for (const bsv of this.buffSlotVisuals) {
      const dx = bsv.circle.x - x;
      const dy = bsv.circle.y - y;
      if (Math.sqrt(dx * dx + dy * dy) <= BUFF_SLOT_RADIUS * 1.8) return bsv.index;
    }
    return -1;
  }

  private isInsideRect(x: number, y: number, rect: GameObjects.Rectangle): boolean {
    const rx = rect.x - rect.originX * rect.width;
    const ry = rect.y - rect.originY * rect.height;
    return x >= rx && x <= rx + rect.width && y >= ry && y <= ry + rect.height;
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
      if (part.category !== slot.accepts) continue;
      return slot.id;
    }
    return null;
  }

  // ==========================================================================
  // Drag visuals
  // ==========================================================================

  private highlightDropTargetsForShop(shopIndex: number): void {
    const state = getRunState(this);
    const key = state.shopOffer[shopIndex];
    if (!key) return;

    if (isItemKey(key)) {
      // Highlight buff slots
      this.buffSlotVisuals.forEach((bsv) => {
        if (bsv.index < (state.equippedBuffs?.length ?? 0)) return;
        bsv.circle.setStrokeStyle(3, PALETTE.accentGreen);
      });
      return;
    }
    this.highlightDropTargetsForPart(key as PartKey);
  }

  private highlightDropTargetsForPart(partKey: PartKey): void {
    const part = PARTS[partKey];
    if (!part) return;
    this.slotVisuals.forEach((sv) => {
      const valid = part.category === sv.slot.accepts;
      if (valid) {
        sv.circle.setStrokeStyle(3, PALETTE.accentGreen);
      }
    });
  }

  private highlightTrashAndBasket(): void {
    this.trashZone.setStrokeStyle(3, 0xffffff);
    this.basketZone.setStrokeStyle(3, 0xffffff);
  }

  private cancelDrag(): void {
    this.dragSource = DragSource.None;
    this.dragShopIndex = -1;
    this.dragSlotId = '';
    this.dragBuffIndex = -1;
    this.dragBasketIndex = -1;
    this.dragGhost?.destroy();
    this.dragGhost = null;
    this.dragLabel?.destroy();
    this.dragLabel = null;
    this.clearHighlights();
  }

  private clearHighlights(): void {
    const state = getRunState(this);
    this.slotVisuals.forEach((sv) => {
      sv.circle.setStrokeStyle(2, state.equipped[sv.slot.id] ? PALETTE.slotFilledStroke : PALETTE.slotEmptyStroke);
    });
    this.buffSlotVisuals.forEach((bsv) => {
      bsv.circle.setStrokeStyle(2, PALETTE.itemBar);
    });
    this.trashZone.setStrokeStyle(2, PALETTE.danger);
    this.basketZone.setStrokeStyle(2, PALETTE.accentBlue);
  }

  // ==========================================================================
  // Slot visuals
  // ==========================================================================

  private showSlotTooltip(slotId: string): void {
    const state = getRunState(this);
    const partKey = state.equipped[slotId];
    if (!partKey) return;
    const part = PARTS[partKey];
    if (!part) return;
    const lines = [`${t(part.name)} (${CATEGORY_LABEL[part.category]})`];
    lines.push(t(part.description));
    if (part.category === 'module') {
      const w = part as import('@/data').WeaponPart;
      lines.push(`DMG ${w.damage}  |  CD ${w.cooldownSec}s  |  ${w.range}`);
    }
    if (part.category === 'implant') {
      const a = part as import('@/data').ArmorPart;
      if (a.bonusHp) lines.push(`HP +${a.bonusHp}`);
      if (a.damageReduction) lines.push(`DR flat +${a.damageReduction}`);
      if (a.damageReductionPct) lines.push(`DR pct +${(a.damageReductionPct * 100).toFixed(0)}%`);
    }
    lines.push(`Sell: ${Math.floor(part.price * ECONOMY.sellRefundRatio)}g`);
    this.previewText.setText(lines.join('\n'));
  }

  private showBuffSlotTooltip(buffIndex: number): void {
    const state = getRunState(this);
    const itemKey = state.equippedBuffs[buffIndex];
    if (!itemKey) return;
    const item = ITEMS[itemKey as keyof typeof ITEMS];
    if (!item) return;
    this.previewText.setText(`${t(item.name)}\n  ${t(item.description)}\nSell: ${Math.floor(item.price * ECONOMY.sellRefundRatio)}g`);
  }

  private flashSlot(slotId: string): void {
    const sv = this.slotVisuals.find((s) => s.slot.id === slotId);
    if (!sv) return;

    this.tweens.add({
      targets: sv.circle,
      scale: { from: 1.5, to: 1 },
      duration: 300,
      ease: 'Back.easeOut',
    });

    const glow = this.add
      .circle(sv.circle.x, sv.circle.y, SLOT_RADIUS * 2, 0xffd94a, 0.5)
      .setDepth(100);
    this.tweens.add({
      targets: glow,
      scale: { from: 0.5, to: 2 },
      alpha: { from: 0.5, to: 0 },
      duration: 400,
      ease: 'Cubic.easeOut',
      onComplete: () => glow.destroy(),
    });

    for (let i = 0; i < 6; i += 1) {
      const angle = (i / 6) * Math.PI * 2 + Math.random() * 0.5;
      const spark = this.add
        .rectangle(sv.circle.x, sv.circle.y, 4, 4, 0xffd94a, 1)
        .setDepth(101);
      this.tweens.add({
        targets: spark,
        x: sv.circle.x + Math.cos(angle) * 40,
        y: sv.circle.y + Math.sin(angle) * 40,
        alpha: 0,
        scale: 0,
        duration: 350,
        ease: 'Cubic.easeOut',
        onComplete: () => spark.destroy(),
      });
    }
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

  private refreshBuffSlots(): void {
    const state = getRunState(this);
    this.buffSlotVisuals.forEach((bsv) => {
      const itemKey = state.equippedBuffs[bsv.index];
      if (itemKey) {
        const item = ITEMS[itemKey as keyof typeof ITEMS];
        bsv.circle.setFillStyle(PALETTE.itemCardBg, 1);
        bsv.label.setText(item ? item.name.substring(0, 3).toUpperCase() : 'BUF');
      } else {
        bsv.circle.setFillStyle(PALETTE.slotEmpty, 1);
        bsv.label.setText('BUF');
      }
    });
  }

  // ==========================================================================
  // Buttons & HUD
  // ==========================================================================

  private refreshHud(): void {
    const state = getRunState(this);
    const totalRounds = state.generatedRounds?.length || 10;
    this.roundText.setText(`${t('ROUND')} ${state.currentRound} / ${totalRounds}`);

    const newRerollCost = getRerollCost(state);
    this.rerollBtnText.setText(`${t('REROLL')} (${newRerollCost}g)`);

    this.goldText.setText(`${state.gold}g`);
    if (state.gold >= 15) this.goldText.setColor('#ff7a00');
    else this.goldText.setColor('#ffd94a');

    if (!state.robotKey) return;
    const robot = ROBOTS[state.robotKey];
    const stats = computeLoadoutStats(robot, state.equipped, state.acquiredSkills);
    const hpDisplay = `${t('MAX HP')}  ${stats.maxHp}`;
    const buffLines =
      state.battleBuffs.length > 0 || state.equippedBuffs.length > 0
        ? [
            '',
            t('BUFFS'),
            ...state.battleBuffs.map((k) => {
              const item = ITEMS[k as keyof typeof ITEMS];
              return item ? `  ${t(item.name)}` : '';
            }).filter(Boolean),
            ...state.equippedBuffs.map((k) => {
              const item = ITEMS[k as keyof typeof ITEMS];
              return item ? `  ${t(item.name)} (slot)` : '';
            }).filter(Boolean),
          ]
        : [];

    const evasionPct = Math.round(stats.evasionChance * 100);
    this.statsText.setText(
      [
        '\u2605 ULTIMATE \u2605',
        `  ${stats.ultimateStrikes} strikes \u00d7 ${stats.ultimateDamagePerStrike} dmg`,
        `  = ${stats.ultimateTotalDamage} total`,
        `  Charge: x${stats.ultimateChargeRate.toFixed(1)}` +
          (stats.ultimateLifesteal > 0 ? `  |  Drain ${Math.round(stats.ultimateLifesteal * 100)}%` : '') +
          (stats.ultimateArmorBreak ? '  |  ARMOR BREAK' : ''),
        '',
        `${t('DEFENSE')}`,
        `  ${hpDisplay}`,
        `  DR ${stats.damageReductionFlat} + ${(stats.damageReductionPct * 100).toFixed(0)}%`,
        `  Shield ${stats.shieldCharges}x` + (evasionPct > 0 ? `  |  Evasion ${evasionPct}%` : ''),
        ...buffLines,
      ].join('\n')
    );

    // Hover preview
    if (this.hoverShopIndex !== null) {
      const hoveredKey = state.shopOffer[this.hoverShopIndex] as string | '' | undefined;
      if (hoveredKey && isItemKey(hoveredKey)) {
        const item = ITEMS[hoveredKey];
        this.previewText.setText(`${t('ITEM')}: ${t(item.name)}\n  ${t(item.description)}`);
      } else if (hoveredKey) {
        const partKey = hoveredKey as PartKey;
        const part = PARTS[partKey];
        const slotId = this.findFreeSlotFor(state.robotKey, partKey, state.equipped);
        if (slotId) {
          const nextEquipped = { ...state.equipped, [slotId]: partKey };
          const nextStats = computeLoadoutStats(robot, nextEquipped, state.acquiredSkills);
          const lines: string[] = [`${t('PREVIEW')}: ${t('buy')} ${t(part.name)} (${part.price}g)`];
          const hpDelta = nextStats.maxHp - stats.maxHp;
          if (hpDelta !== 0) lines.push(`  ${t('MAX HP')}  ${stats.maxHp} \u2192 ${nextStats.maxHp}  (${hpDelta > 0 ? '+' : ''}${hpDelta})`);
          const drFlatDelta = nextStats.damageReductionFlat - stats.damageReductionFlat;
          if (drFlatDelta !== 0) lines.push(`  ${t('DR flat')} ${stats.damageReductionFlat} \u2192 ${nextStats.damageReductionFlat}`);
          const drPctDelta = nextStats.damageReductionPct - stats.damageReductionPct;
          if (Math.abs(drPctDelta) > 0.001)
            lines.push(`  ${t('DR pct')}  ${(stats.damageReductionPct * 100).toFixed(0)}% \u2192 ${(nextStats.damageReductionPct * 100).toFixed(0)}%`);
          const wDelta = nextStats.weapons.length - stats.weapons.length;
          if (wDelta !== 0) lines.push(`  ${t('Weapons')} ${stats.weapons.length} \u2192 ${nextStats.weapons.length}`);
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

  // ==========================================================================
  // Refresh all
  // ==========================================================================

  private refreshAll(): void {
    this.refreshSlots();
    this.refreshBuffSlots();
    this.refreshShop();
    this.refreshBasketItems();
    this.refreshHud();
  }
}
