import { Scene, Math as PhaserMath, Geom } from 'phaser';
import type { GameObjects } from 'phaser';

import gameOptions from '../helper/gameOptions';
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
import { BALANCE } from '@/data/balance';
import { ROUND_TRANSITION_MONOLOGUES } from '@/data/storyText';
import { getRunState, setRunState, type RunState, type EquippedEntry } from '../systems/runState';
import {
  PALETTE,
  CATEGORY_COLORS,
  CATEGORY_LABEL,
  SANCTUM_KIND_COLORS,
  type SanctumKind,
} from '../systems/palette';
import { computeLoadoutStats } from '../systems/stats';
import { getSynergyStatuses } from '../systems/synergyCheck';
import { generateShopOffer } from '../systems/shop';
import { attemptReroll, getRerollCost } from '../systems/loadout';
import { playSfx } from '../systems/audio';
import { fadeInCurrent, fadeToScene } from '../systems/transition';
import { t, bl } from '../systems/i18n';
import { playMusic, MUSIC_KEYS } from '../systems/music';
import { applyHiDpiToScene, showDebugBadge, TEXT_DPR } from '../helper/hiDpiText';
import { runVisualChecks } from '../systems/visualDebugger';
import { attachFpsMeter } from '../systems/fpsMeter';
import { setupLayoutDebug } from '../systems/layoutDebug';
import { isDebugEnabled } from '../systems/debug';
import { mountBuildOverlay, type BuildOverlayHandle } from '../overlays/buildOverlay';

// ---------------------------------------------------------------------------
// Layout constants
// ---------------------------------------------------------------------------

const STORAGE_COL_W = 100;

// Blueprint box sized to the PNG aspect (880:1168 ≈ 0.753) so the raw
// lineart renders without distortion.
const BLUEPRINT_BOX_W = 450;
const BLUEPRINT_BOX_H = 598;
// Capped at the largest radius that keeps every robot's slot layout
// non-overlapping. LILITH's vertical column has 32-unit spacing
// (≈ 63.7 px after scale), so center-to-center distance bounds 2r ≤ 63.7
// → r ≤ 31. Aim is "≈2x of the original 19 px"; 30 px lands ~1.6x while
// holding the no-overlap promise across all four machines.
const SLOT_RADIUS = 30;
const SHOP_CARD_W = 140;
const SHOP_CARD_H = 86;
const SHOP_CARD_GAP = 14;
/** Inter-element gap between REROLL and the first card row, and
 *  between the SHOP frame's bottom and the INTEL monitor's top. */
const SHOP_VGAP = 16;
/** Padding INSIDE the SHOP frame on the top edge (panel-head bottom →
 *  REROLL top) AND the bottom edge (last card bottom → frame bottom).
 *  Kept in a single constant so the two margins read identically and
 *  the cards never appear to kiss the chamfered frame edge. */
const SHOP_INNER_PAD = 24;
/** REROLL button center y — sits SHOP_INNER_PAD below the panel-head
 *  strip (which ends y=74), giving the column a generous top margin. */
const REROLL_CENTER_Y = 74 + SHOP_INNER_PAD + 22; // 120
/** TOP-edge y of the shop card grid (NOT center!). The card placement
 *  formula in drawShopArea is
 *    cardCenterY = SHOP_GRID_TOP + row * (CARD_H + GAP) + CARD_H / 2
 *  so SHOP_GRID_TOP itself is the top of row 0, not its center. Sits
 *  REROLL bottom (142) + SHOP_VGAP below the REROLL button. */
const SHOP_GRID_TOP = REROLL_CENTER_Y + 22 + SHOP_VGAP; // 158
/** REROLL button width — narrower than the shop column (294px) for visual
 *  breathing, but wide enough to hold "REROLL (NNN g)" without the gold
 *  cost overflowing once reroll escalation pushes the price into 3-digit
 *  territory. */
const REROLL_W = 220;
const SHOP_COLS = 2;
const STATS_W = 260;
const COL_GAP = 20;
const SHOP_W = SHOP_COLS * SHOP_CARD_W + (SHOP_COLS - 1) * SHOP_CARD_GAP;
const TOTAL_W = STORAGE_COL_W + COL_GAP + BLUEPRINT_BOX_W + COL_GAP + SHOP_W + COL_GAP + STATS_W;
const LEFT_MARGIN = Math.floor((1280 - TOTAL_W) / 2);
const STORAGE_COL_X = LEFT_MARGIN;
const BLUEPRINT_X = STORAGE_COL_X + STORAGE_COL_W + COL_GAP;
const SHOP_AREA_X = BLUEPRINT_X + BLUEPRINT_BOX_W + COL_GAP;
const STATS_X = SHOP_AREA_X + SHOP_W + COL_GAP;

/** Blueprint panel top offset — shifted so it sits below the 30-px tall
 *  DOM panel-head strip (which starts at frame top y=44 and ends y=74). */
const BP_TOP = 80;

/**
 * Stats-column children line up with the header `OUTPUT · SS-NN` text
 * above them by sharing the same left edge as the header's ident span.
 * The DOM `.panel-head` uses padding: 8 px and sits at STATS_X - 8
 * (the outer frame edge), so header text lands at STATS_X and any
 * child placed at STATS_X lines up perfectly — no per-child inset
 * constant needed.
 */

// --- Shop-card chrome matching SANCTUM's Consecrate-card taste -----------
// SANCTUM's cards sit on a darkened panel, so 0.85 alpha reads bright
// against the panel. Build cards sit directly on the pure-black scene
// bg (no column-fill), so we go fully opaque with a slightly brighter
// navy so they still feel "lit" against the void.
// Border: 0xaeeaff at 0.3 alpha — subtle cyan hairline, never competes
// with the state-driven equip / merge2 / merge3 loud strokes.
const SHOP_CARD_FILL = 0x1c2840;
const SHOP_CARD_FILL_ALPHA = 1;
const SHOP_CARD_BORDER = 0xaeeaff;
const SHOP_CARD_BORDER_ALPHA = 0.3;

// --- Owned-buffs column (leftmost, display-only) --------------------------
// Lists the buff items the player consecrated at SANCTUM and brought into
// this run. Purely decorative — the buffs auto-apply at battle start.
const BUFFS_TOP = BP_TOP;
const BUFFS_ITEM_W = STORAGE_COL_W - 10;
const BUFFS_ITEM_H = 44;
const BUFFS_ITEM_GAP = 6;
const BUFFS_MAX = 9;

// ---------------------------------------------------------------------------
// Interfaces
// ---------------------------------------------------------------------------

interface SlotVisual {
  readonly slot: SlotDef;
  circle: GameObjects.Arc;
  label: GameObjects.Text;
  /** Rotating dashed ring shown when star ≥ 2 (yellow at 2, orange at 3). */
  starRing: GameObjects.Graphics | null;
  starRingTween: Phaser.Tweens.Tween | null;
  starRingState: 0 | 2 | 3;
}

// ---------------------------------------------------------------------------
// Scene
// ---------------------------------------------------------------------------

export class Build extends Scene {
  private slotVisuals: SlotVisual[] = [];
  private shopContainers: GameObjects.Container[] = [];
  private goldText!: GameObjects.Text;
  private goldDeltaText!: GameObjects.Text;
  private statsOffRows!: GameObjects.Text;
  private statsDefRows!: GameObjects.Text;
  private statsBuffRows!: GameObjects.Text;
  private statsSkillRows!: GameObjects.Text;
  private statsSynergyRows!: GameObjects.Text;
  private chargeBarFill!: GameObjects.Rectangle;
  private previewText!: GameObjects.Text;
  private buildOverlay: BuildOverlayHandle | null = null;
  private rerollBtnText!: GameObjects.Text;
  private blueprintOriginX = 0;
  private blueprintOriginY = 0;
  private blueprintScale = 1;
  private silhouetteRect!: GameObjects.Rectangle;
  private blueprintImg: GameObjects.Image | null = null;
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
      setRunState(this, { ...state, shopOffer: generateShopOffer(state.currentRound) });
    }

    this.cameras.main.setBackgroundColor(PALETTE.bg);
    fadeInCurrent(this);
    playMusic(this, MUSIC_KEYS.build);

    // Draw chamfered column frames first so content sits on top of them.
    // Geometry shared with the DOM panel-head strips in buildOverlay.ts —
    // the head rides the top of each frame.
    this.drawColumnFrames();

    this.drawBlueprintPanel(state.robotKey);

    this.drawBuffsColumn();

    // Right column — stats blocks (frame already drawn in drawColumnFrames).
    this.drawStatsBlocks(textStyles);

    // REROLL — sits at the TOP of the SHOP column (header → REROLL →
    // 6-card grid → preview). the owner 2026-04-25: this reads as "spend
    // gold to refresh the offer" before the offer itself, like a
    // toolbar above the table. The custom button keeps the cyan-
    // left-accent silhouette from the design brief.
    const rerollX = SHOP_AREA_X + SHOP_W / 2;
    this.drawRerollButton(rerollX, REROLL_CENTER_Y, () => {
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

    // READY — chamfered custom button matching the design brief. The
    // [SPACE] KBD pill sits inside the button silhouette on the right.
    // Pushed down to free vertical room for up to 9 BUFFS rows + the
    // hover-preview text in the stats column above.
    const btnX = STATS_X + STATS_W / 2;
    this.drawReadyButton(btnX, 626, () => {
      playSfx('click');
      fadeToScene(this, 'Battle');
    });

    // Shop grid
    this.drawShopArea();

    // Keyboard shortcuts
    this.input.keyboard?.on('keydown-R', () => fadeToScene(this, 'Title'));
    this.input.keyboard?.on('keydown-SPACE', () => {
      playSfx('click');
      fadeToScene(this, 'Battle');
    });
    const numberKeys = ['ONE', 'TWO', 'THREE', 'FOUR', 'FIVE', 'SIX'] as const;
    numberKeys.forEach((key, i) => {
      this.input.keyboard?.on(`keydown-${key}`, () => this.handleShopKeypress(i));
    });


    this.refreshAll();

    // Mount the DOM header overlay (ROUND label + monologue + hint).
    let monologue: string | undefined;
    if (state.currentRound !== 1 && state.robotKey) {
      const monologues = ROUND_TRANSITION_MONOLOGUES[state.robotKey];
      if (monologues && monologues.length > 0) {
        const idx = (state.currentRound - 2) % monologues.length;
        monologue = bl(monologues[idx]!);
      }
    }
    const totalRounds = state.generatedRounds?.length || 10;
    const pilotName = state.robotKey ? t(ROBOTS[state.robotKey].name) : undefined;
    this.buildOverlay = mountBuildOverlay({
      round: state.currentRound,
      totalRounds,
      roundLabel: t('ROUND'),
      pilotName,
      rerollCost: getRerollCost(state),
      monologue,
      tutorialHint: state.currentRound === 1 ? t('DRAG parts into slots  ·  MATCH types for synergy  ·  PRESS READY to fight') : undefined,
    });

    this.events.once('shutdown', () => {
      this.buildOverlay?.unmount();
      this.buildOverlay = null;
    });
    this.events.once('destroy', () => {
      this.buildOverlay?.unmount();
      this.buildOverlay = null;
    });

    applyHiDpiToScene(this);
    showDebugBadge(this, isDebugEnabled());
    runVisualChecks(this);
    setupLayoutDebug(this);
    attachFpsMeter(this);
  }

  // ==========================================================================
  // Stats panel (right column)
  // ==========================================================================

  /** Build the stats column: gold, SOUL STRIKE + DEFENSE blocks, preview. */
  private drawStatsBlocks(_textStyles: typeof gameOptions.textStyles): void {
    // Children align with the header's ident text — both sit at the
    // content-column left edge (STATS_X). The column frame adds its own
    // 8-px outer cushion; header padding (8 px) offsets the frame edge
    // back to STATS_X, so ident text and gold numerals share a vertical.
    const contentLeft = STATS_X;
    const contentRight = STATS_X + STATS_W;
    const contentWidth = STATS_W;
    const headingX = contentLeft + 14;   // after the diamond bullet
    // Diamond bullet sits flush with the content edge; drawBlockBullet
    // draws a 7-px rect at (x+4, y+6), so the diamond's visible center
    // is 4 px right of STATS_X — safely inside the frame (which starts
    // 8 px further left) but still reading as a leading bullet before
    // the heading text at headingX (= STATS_X + 14).
    const bulletX = contentLeft;

    // --- Gold row ---------------------------------------------------------
    this.goldText = this.add
      .text(contentLeft, 82, '', {
        fontFamily: '"Bebas Neue", system-ui, sans-serif',
        fontSize: '30px',
        color: '#ffd94a',
        resolution: TEXT_DPR,
      })
      .setOrigin(0, 0)
      .setLetterSpacing(1);
    this.goldDeltaText = this.add
      .text(contentRight, 92, '', {
        fontFamily: '"Rajdhani", system-ui, sans-serif',
        fontSize: '11px',
        color: '#3aff7a',
        resolution: TEXT_DPR,
        fontStyle: '600',
      })
      .setOrigin(1, 0)
      .setLetterSpacing(2);

    // Divider between gold row and SOUL STRIKE block.
    this.drawStatsDivider(118);

    // --- SOUL STRIKE block ----------------------------------------------
    this.drawBlockBullet(bulletX, 124);
    this.add
      .text(headingX, 122, t('SOUL STRIKE'), {
        fontFamily: '"Bebas Neue", system-ui, sans-serif',
        fontSize: '13px',
        color: '#aeeaff',
        resolution: TEXT_DPR,
      })
      .setOrigin(0, 0)
      .setLetterSpacing(4);
    this.statsOffRows = this.add
      .text(contentLeft, 144, '', {
        fontFamily: '"Rajdhani", system-ui, sans-serif',
        fontSize: '12px',
        color: '#cfd8e4',
        resolution: TEXT_DPR,
        fontStyle: '600',
        lineSpacing: 4,
      })
      .setOrigin(0, 0)
      .setLetterSpacing(1);

    // Charge bar — thin horizontal meter showing ult charge rate visually.
    const chargeBarY = 210;
    this.add
      .rectangle(contentLeft, chargeBarY, contentWidth, 6, 0x0b121e, 1)
      .setOrigin(0, 0)
      .setStrokeStyle(1, 0x39557c);
    this.chargeBarFill = this.add
      .rectangle(contentLeft + 1, chargeBarY + 1, 1, 4, 0xff7a00, 1)
      .setOrigin(0, 0);

    // Divider between SOUL STRIKE block and DEFENSE block.
    this.drawStatsDivider(226);

    // --- DEFENSE block --------------------------------------------------
    this.drawBlockBullet(bulletX, 232);
    this.add
      .text(headingX, 230, t('DEFENSE'), {
        fontFamily: '"Bebas Neue", system-ui, sans-serif',
        fontSize: '13px',
        color: '#aeeaff',
        resolution: TEXT_DPR,
      })
      .setOrigin(0, 0)
      .setLetterSpacing(4);
    this.statsDefRows = this.add
      .text(contentLeft, 252, '', {
        fontFamily: '"Rajdhani", system-ui, sans-serif',
        fontSize: '12px',
        color: '#cfd8e4',
        resolution: TEXT_DPR,
        fontStyle: '600',
        lineSpacing: 4,
      })
      .setOrigin(0, 0)
      .setLetterSpacing(1);

    // --- SKILLS + BUFFS blocks (side-by-side, DEFENSE-style chrome) -----
    // Two parallel mini-blocks under DEFENSE: each gets its own bullet,
    // heading, and rows — same UI vocabulary as DEFENSE, just split into
    // two half-width columns.
    this.drawStatsDivider(322);

    const outputColGap = 12;
    const outputColW = (contentWidth - outputColGap) / 2;
    const skillsBulletX = contentLeft;
    const skillsHeadingX = skillsBulletX + 14;
    const buffsBulletX = contentLeft + outputColW + outputColGap;
    const buffsHeadingX = buffsBulletX + 14;
    const headerY = 328;
    const bulletY = 330;
    const rowsY = 350;

    this.drawBlockBullet(skillsBulletX, bulletY);
    this.add
      .text(skillsHeadingX, headerY, t('SKILLS'), {
        fontFamily: '"Bebas Neue", system-ui, sans-serif',
        fontSize: '13px',
        color: '#aeeaff',
        resolution: TEXT_DPR,
      })
      .setOrigin(0, 0)
      .setLetterSpacing(4);
    this.statsSkillRows = this.add
      .text(skillsBulletX, rowsY, '', {
        fontFamily: '"Rajdhani", system-ui, sans-serif',
        fontSize: '12px',
        color: '#cfd8e4',
        resolution: TEXT_DPR,
        fontStyle: '600',
        lineSpacing: 4,
        wordWrap: { width: outputColW },
      })
      .setOrigin(0, 0)
      .setLetterSpacing(1);

    this.drawBlockBullet(buffsBulletX, bulletY);
    this.add
      .text(buffsHeadingX, headerY, t('BUFFS'), {
        fontFamily: '"Bebas Neue", system-ui, sans-serif',
        fontSize: '13px',
        color: '#aeeaff',
        resolution: TEXT_DPR,
      })
      .setOrigin(0, 0)
      .setLetterSpacing(4);
    this.statsBuffRows = this.add
      .text(buffsBulletX, rowsY, '', {
        fontFamily: '"Rajdhani", system-ui, sans-serif',
        fontSize: '12px',
        color: '#cfd8e4',
        resolution: TEXT_DPR,
        fontStyle: '600',
        lineSpacing: 4,
        wordWrap: { width: outputColW },
      })
      .setOrigin(0, 0)
      .setLetterSpacing(1);

    // SYNERGIES block. Sits at y=418 (lifted from the original y=458)
    // so the SHOP-column hover-preview block has breathing room below
    // the READY button. The SKILLS / BUFFS rows above only fill 2-4
    // lines for the INDRA-only / 5-round scope, so the previous 108 px
    // gap was visually wasteful. No divider line above — the bullet +
    // heading already mark the split.
    this.drawBlockBullet(bulletX, 426);
    this.add
      .text(headingX, 424, t('SYNERGIES'), {
        fontFamily: '"Bebas Neue", system-ui, sans-serif',
        fontSize: '13px',
        color: '#aeeaff',
        resolution: TEXT_DPR,
      })
      .setOrigin(0, 0)
      .setLetterSpacing(4);
    this.statsSynergyRows = this.add
      .text(contentLeft, 444, '', {
        fontFamily: '"Rajdhani", system-ui, sans-serif',
        fontSize: '11px',
        color: '#cfd8e4',
        resolution: TEXT_DPR,
        lineSpacing: 3,
        wordWrap: { width: contentWidth },
      })
      .setOrigin(0, 0)
      .setLetterSpacing(1);

    // The hover preview lives under the SHOP card grid (created in
    // drawShopArea) so the OUTPUT (stats) column shows ONLY the run
    // state, never ephemeral hover-tooltip text.
  }

  /** Diamond-shaped orange bullet for section headings. */
  private drawBlockBullet(x: number, y: number): void {
    this.add
      .rectangle(x + 4, y + 6, 7, 7, PALETTE.accentOrange, 1)
      .setAngle(45)
      .setStrokeStyle(1, 0xffd94a, 0.6);
  }

  /**
   * Return the 6-point polygon matching the project's asymmetric chamfer
   * (top-left + bottom-right square, top-right + bottom-left notched) —
   * same clip-path as `.ss-panel` / `.card` in the DOM overlays. Points
   * are a flat number array in local (0,0)..(w,h) space, suitable for
   * both `this.add.polygon()` and `new Geom.Polygon(points)`.
   */
  private chamferedPoints(w: number, h: number, cut: number): number[] {
    return [
      0, 0,
      w - cut, 0,
      w, cut,
      w, h,
      cut, h,
      0, h - cut,
    ];
  }

  /**
   * Chamfered column frames (matches Collection / Settings panel taste:
   * 14-px corner cuts, navy fill with cyan 25%-alpha border). The three
   * frames bracket the blueprint, shop, and stats columns and read as a
   * single workshop chassis instead of three unrelated regions.
   */
  private drawColumnFrames(): void {
    const frameTop = 44;
    const cornerCut = 14;

    // Frames hug the content columns exactly (no outer inset). This keeps
    // the COL_GAP (20 px) of clean black between adjacent frames, so the
    // four columns read as independent panels (like the reference mockup)
    // rather than one giant fused header stripe.
    const colHeight = BP_TOP + BLUEPRINT_BOX_H - frameTop;
    this.drawColumnFrame(STORAGE_COL_X, frameTop, STORAGE_COL_W, colHeight, cornerCut);
    this.drawColumnFrame(BLUEPRINT_X, frameTop, BLUEPRINT_BOX_W, colHeight, cornerCut);
    // SHOP frame is SHORTER than the others — it stops just under the
    // 6-card grid so the INTEL monitor below can read as its own
    // independent panel . Card-grid bottom +
    // SHOP_INNER_PAD inside the frame (matches the top margin), then
    // SHOP_VGAP of black between the frame's bottom and the INTEL
    // monitor's top.
    // SHOP_GRID_TOP = top of row 0 (not center). Last row's bottom is
    // SHOP_GRID_TOP + (rows-1)*(CARD_H + GAP) + CARD_H. Then add the
    // matching SHOP_INNER_PAD so top + bottom inner margins are equal.
    const shopFrameBottom = SHOP_GRID_TOP
      + (Math.ceil(ECONOMY.shopSlotCount / SHOP_COLS) - 1) * (SHOP_CARD_H + SHOP_CARD_GAP)
      + SHOP_CARD_H + SHOP_INNER_PAD;
    const shopFrameH = shopFrameBottom - frameTop;
    this.drawColumnFrame(SHOP_AREA_X, frameTop, SHOP_W, shopFrameH, cornerCut);
    // INTEL monitor — separate chamfered frame below the SHOP frame.
    // Its bottom lines up with the other three columns, so the
    // workshop chassis still reads as a single rectangle of activity.
    const monitorTop = shopFrameBottom + SHOP_VGAP;
    const monitorBottom = frameTop + colHeight;
    this.drawColumnFrame(SHOP_AREA_X, monitorTop, SHOP_W, monitorBottom - monitorTop, cornerCut);
    this.drawColumnFrame(STATS_X, frameTop, STATS_W, colHeight, cornerCut);
  }

  /**
   * Draw a single chamfered panel matching the Collection-screen taste.
   * The chamfer mirrors the design brief's clip-path:
   *   polygon(0 0, 100%-c 0, 100% c, 100% 100%, c 100%, 0 100%-c)
   * i.e. top-right and bottom-left are notched, the other two are square.
   */
  private drawColumnFrame(x: number, y: number, w: number, h: number, cut: number): void {
    const pts = [
      new PhaserMath.Vector2(x, y),
      new PhaserMath.Vector2(x + w - cut, y),
      new PhaserMath.Vector2(x + w, y + cut),
      new PhaserMath.Vector2(x + w, y + h),
      new PhaserMath.Vector2(x + cut, y + h),
      new PhaserMath.Vector2(x, y + h - cut),
    ];
    // Column frame = silhouette only, no fill darkening. Build hides the
    // shared ss-frame-grid (to avoid moiré with the blueprint PNG), so an
    // opaque frame fill over pure-black bg just muddies content stacked
    // on top (shop cards, stats text). Keep the cyan hairline at 22% to
    // mark the panel edges; let the actual content carry the visual
    // weight — SANCTUM's single-panel crispness over multi-column stacking.
    const gfx = this.add.graphics().setDepth(-1);
    gfx.lineStyle(1, 0xaeeaff, 0.22);
    gfx.strokePoints(pts, true);
  }

  /** Horizontal divider inside the stats column between blocks. */
  private drawStatsDivider(y: number): void {
    this.add
      .rectangle(STATS_X, y, STATS_W, 1, 0xaeeaff, 0.18)
      .setOrigin(0, 0);
  }

  /**
   * Custom REROLL button — chamfered polygon silhouette matching the
   * Collection panel's clip-path taste. Dark navy fill, thin cyan
   * border, 3-px cyan left accent bar, icon + label + gold cost.
   * Hit-test uses the polygon so clicks on the notched corners miss
   * cleanly instead of feeling rectangular.
   */
  private drawRerollButton(cx: number, cy: number, onClick: () => void): void {
    const w = REROLL_W;
    const h = 44;
    const cut = 10;
    const x = cx - w / 2;
    const y = cy - h / 2;
    const points = this.chamferedPoints(w, h, cut);
    const bg = this.add
      .polygon(x, y, points, 0x10204a, 0.85)
      .setOrigin(0, 0)
      .setStrokeStyle(1, 0xaeeaff, 0.35)
      .setDepth(2);
    bg.setInteractive(new Geom.Polygon(points), Geom.Polygon.Contains);
    bg.input!.cursor = 'pointer';

    // 3-px cyan accent that runs along the left edge from just under the
    // notched BL corner up to the top-left (the top-left is square so
    // the bar can start at y=0 here).
    this.add
      .rectangle(x, cy, 3, h - cut, 0xaeeaff, 1)
      .setOrigin(0, 0.5)
      .setDepth(3);

    const iconText = this.add
      .text(cx - w / 2 + 22, cy, '↻', {
        fontFamily: '"Bebas Neue", system-ui, sans-serif',
        fontSize: '22px',
        color: '#aeeaff',
        resolution: TEXT_DPR,
      })
      .setOrigin(0.5)
      .setDepth(3);
    this.rerollBtnText = this.add
      .text(cx, cy, `${t('REROLL')} (${getRerollCost(getRunState(this))} g)`, {
        fontFamily: '"Bebas Neue", system-ui, sans-serif',
        fontSize: '18px',
        color: '#ffffff',
        resolution: TEXT_DPR,
      })
      .setOrigin(0.5)
      .setLetterSpacing(3)
      .setDepth(3);
    bg.on('pointerover', () => {
      bg.setFillStyle(0x1f4d80, 1);
    });
    bg.on('pointerout', () => {
      bg.setFillStyle(0x10204a, 0.85);
    });
    bg.on('pointerdown', () => {
      this.rerollBtnText.setScale(0.98);
      iconText.setScale(0.98);
      onClick();
    });
    bg.on('pointerup', () => {
      this.rerollBtnText.setScale(1);
      iconText.setScale(1);
    });
  }

  /**
   * Chamfered READY button matching the design brief. Orange polygon
   * silhouette with gold border, outer orange glow, white hover state,
   * and a [SPACE] KBD pill on the right for the keyboard hint.
   */
  private drawReadyButton(cx: number, cy: number, onClick: () => void): void {
    const w = 200;
    const h = 50;
    const cut = 14;
    const x = cx - w / 2;
    const y = cy - h / 2;
    const points = this.chamferedPoints(w, h, cut);

    // Outer glow — wider, lower-alpha orange polygon behind the button.
    const glowCut = cut + 4;
    const glowPoints = this.chamferedPoints(w + 16, h + 16, glowCut);
    this.add
      .polygon(x - 8, y - 8, glowPoints, 0xff7a00, 0.28)
      .setOrigin(0, 0)
      .setDepth(2);

    // Main button fill.
    const bg = this.add
      .polygon(x, y, points, 0xff7a00, 1)
      .setOrigin(0, 0)
      .setStrokeStyle(2, 0xffd94a, 1)
      .setDepth(3);
    bg.setInteractive(new Geom.Polygon(points), Geom.Polygon.Contains);
    bg.input!.cursor = 'pointer';

    const label = this.add
      .text(cx - 24, cy, t('READY'), {
        fontFamily: '"Bebas Neue", system-ui, sans-serif',
        fontSize: '26px',
        color: '#0a0a10',
        resolution: TEXT_DPR,
      })
      .setOrigin(0.5)
      .setLetterSpacing(3)
      .setDepth(4);

    // [SPACE] pill — nested inside the button silhouette on the right.
    const pillX = cx + 60;
    const pillY = cy;
    this.add
      .rectangle(pillX, pillY, 56, 22, 0x0a0a10, 1)
      .setStrokeStyle(1, 0xffd94a, 0.6)
      .setDepth(4);
    this.add
      .text(pillX, pillY, 'SPACE', {
        fontFamily: '"Bebas Neue", system-ui, sans-serif',
        fontSize: '12px',
        color: '#ffd94a',
        resolution: TEXT_DPR,
      })
      .setOrigin(0.5)
      .setLetterSpacing(3)
      .setDepth(5);

    bg.on('pointerover', () => {
      bg.setFillStyle(0xff9a3a, 1);
    });
    bg.on('pointerout', () => {
      bg.setFillStyle(0xff7a00, 1);
    });
    bg.on('pointerdown', () => {
      bg.setScale(0.98);
      label.setScale(0.98);
      onClick();
    });
    bg.on('pointerup', () => {
      bg.setScale(1);
      label.setScale(1);
    });
  }

  // ==========================================================================
  // Blueprint + part slots
  // ==========================================================================

  private drawBlueprintPanel(robotKey: RobotKey): void {
    const { textStyles } = gameOptions;
    const robot = ROBOTS[robotKey];

    // Panel background removed — the scene's shared grid background shows
    // through around the blueprint image so the Build area reads as part of
    // the same frame as other scenes.

    // Blueprint heading is rendered by the DOM overlay panel-head strip
    // above the blueprint image (see overlays/buildOverlay.ts).

    const silhouetteX = BLUEPRINT_X + BLUEPRINT_BOX_W / 2;
    const silhouetteY = BP_TOP + BLUEPRINT_BOX_H / 2;

    // Blueprint image — scaled proportionally to fit the panel without
    // stretching. Distortion (which smears the internal grid and makes the
    // panel look dirty) is avoided at the cost of a small top/bottom margin
    // when the source aspect doesn't match the panel exactly.
    if (this.textures.exists(robot.blueprintAssetKey)) {
      const img = this.add.image(silhouetteX, silhouetteY, robot.blueprintAssetKey);
      const scale = Math.min(BLUEPRINT_BOX_W / img.width, BLUEPRINT_BOX_H / img.height);
      img.setScale(scale);
      this.blueprintImg = img;
    }

    // Outer frame — sized to the full panel. Invisible (no stroke) while
    // slots are unfilled; refreshSlots paints a gold glow stroke here once
    // every slot is equipped, signalling the mech is "awakened".
    this.silhouetteRect = this.add
      .rectangle(BLUEPRINT_X, BP_TOP, BLUEPRINT_BOX_W, BLUEPRINT_BOX_H, 0x000000, 0)
      .setOrigin(0, 0);

    // Coordinate mapping: virtual 192x240 -> panel
    const virtualW = 192;
    const virtualH = 240;
    const drawableW = BLUEPRINT_BOX_W * 0.85;
    const drawableH = BLUEPRINT_BOX_H * 0.85;
    this.blueprintScale = Math.min(drawableW / virtualW, drawableH / virtualH);
    this.blueprintOriginX = silhouetteX - (virtualW * this.blueprintScale) / 2;
    this.blueprintOriginY = silhouetteY - (virtualH * this.blueprintScale) / 2;

    this.slotVisuals = robot.slots.map((slot) => {
      const cx = this.blueprintOriginX + slot.x * this.blueprintScale;
      const cy = this.blueprintOriginY + slot.y * this.blueprintScale;
      // Empty-slot color = the accepted-category hue at low alpha, so
      // each socket telegraphs its part type before anything is fitted.
      const acceptColor = CATEGORY_COLORS[slot.accepts];
      const circle = this.add
        .circle(cx, cy, SLOT_RADIUS, acceptColor, 0.22)
        .setStrokeStyle(2, acceptColor);
      circle.setInteractive({ useHandCursor: true });
      // Equipped slots are display-only — hover still shows the tooltip
      // preview, but click-to-drag is removed. Parts are placed at
      // purchase time and stay until the run ends.
      circle.on('pointerover', () => this.showSlotTooltip(slot.id));
      circle.on('pointerout', () => {
        if (this.hoverShopIndex === null) this.previewText.setText('');
      });

      const label = this.add
        .text(cx, cy, CATEGORY_LABEL[slot.accepts], { ...textStyles.small, color: '#aeeaff' })
        .setOrigin(0.5);

      return { slot, circle, label, starRing: null, starRingTween: null, starRingState: 0 };
    });
  }

  // ==========================================================================
  // Owned-buffs column (leftmost) — display of buff items purchased at
  // SANCTUM and brought into this run. Auto-applied at battle start;
  // player cannot rearrange them.
  // ==========================================================================

  private drawBuffsColumn(): void {
    const { textStyles } = gameOptions;
    const state = getRunState(this);
    const colX = STORAGE_COL_X + 5;

    state.equippedBuffs.slice(0, BUFFS_MAX).forEach((itemKey, i) => {
      const item = ITEMS[itemKey];
      if (!item) return;
      const cx = colX + BUFFS_ITEM_W / 2;
      const cy = BUFFS_TOP + i * (BUFFS_ITEM_H + BUFFS_ITEM_GAP) + BUFFS_ITEM_H / 2;

      // Tint the card border by buff kind so OFFENSE / DEFENSE / RECON
      // are visually distinct at a glance — same palette as SANCTUM.
      const kind = item.effect.kind as SanctumKind;
      const kindColor = SANCTUM_KIND_COLORS[kind] ?? PALETTE.itemBar;

      const container = this.add.container(cx, cy);
      const points = this.chamferedPoints(BUFFS_ITEM_W, BUFFS_ITEM_H, 8);
      const bg = this.add
        .polygon(-BUFFS_ITEM_W / 2, -BUFFS_ITEM_H / 2, points, PALETTE.itemCardBg, 0.9)
        .setOrigin(0, 0)
        .setStrokeStyle(1, kindColor);
      bg.setInteractive(new Geom.Polygon(points), Geom.Polygon.Contains);
      bg.on('pointerover', () => {
        this.previewText.setText(`${t(item.name)}\n${t(item.description)}`);
      });
      bg.on('pointerout', () => {
        if (this.hoverShopIndex === null) this.previewText.setText('');
      });
      container.add(bg);

      // Left accent bar in the kind color — matches the SANCTUM card chrome.
      container.add(
        this.add
          .rectangle(-BUFFS_ITEM_W / 2, -BUFFS_ITEM_H / 2, 3, BUFFS_ITEM_H, kindColor, 1)
          .setOrigin(0, 0)
      );

      container.add(
        this.add
          .text(0, 0, t(item.name), {
            ...textStyles.small,
            fontSize: '10px',
            color: `#${kindColor.toString(16).padStart(6, '0')}`,
            wordWrap: { width: BUFFS_ITEM_W - 6 },
            align: 'center',
          })
          .setOrigin(0.5)
      );
    });
  }

  // ==========================================================================
  // Shop
  // ==========================================================================

  private drawShopArea(): void {
    const gridLeft = SHOP_AREA_X;
    const gridTop = SHOP_GRID_TOP;

    // INTEL monitor — its outer chamfered chassis is drawn by
    // drawColumnFrames, and its panel-head strip is mounted by the
    // DOM overlay (buildOverlay.ts) using the same OUTPUT-style
    // .panel-head vocabulary (orange tag + white val + green LED).
    // Here we only place the readout body text inside the monitor.
    const { textStyles } = gameOptions;
    const shopRowsCount = Math.ceil(ECONOMY.shopSlotCount / SHOP_COLS);
    // gridTop = top of row 0. Last card's bottom = gridTop + (rows-1)*pitch + CARD_H.
    const shopGridBottom = gridTop + (shopRowsCount - 1) * (SHOP_CARD_H + SHOP_CARD_GAP) + SHOP_CARD_H;
    const monX = gridLeft;
    // Mirror drawColumnFrames: cards → SHOP_INNER_PAD inside the frame,
    // then SHOP_VGAP of black, then the monitor.
    const monY = shopGridBottom + SHOP_INNER_PAD + SHOP_VGAP;
    const monW = SHOP_W;
    // DOM panel-head height = 30 px (see buildOverlay.ts .panel-head).
    const monHeadH = 30;

    // Preview text — readout body. Cyan tinted for the "data terminal"
    // feel. Padding keeps text off the chamfered chassis.
    const previewPadX = 12;
    const previewPadY = 10;
    this.previewText = this.add
      .text(monX + previewPadX, monY + monHeadH + previewPadY, '', {
        ...textStyles.small,
        wordWrap: { width: monW - previewPadX * 2 },
      })
      .setOrigin(0, 0)
      .setColor('#aeeaff')
      .setDepth(4);

    this.shopContainers = [];
    for (let i = 0; i < ECONOMY.shopSlotCount; i += 1) {
      const col = i % SHOP_COLS;
      const row = Math.floor(i / SHOP_COLS);
      const x = gridLeft + col * (SHOP_CARD_W + SHOP_CARD_GAP) + SHOP_CARD_W / 2;
      const y = gridTop + row * (SHOP_CARD_H + SHOP_CARD_GAP) + SHOP_CARD_H / 2;
      const container = this.add.container(x, y);
      const points = this.chamferedPoints(SHOP_CARD_W, SHOP_CARD_H, 10);
      // Container is centered at the card center; position the polygon's
      // top-left at (-w/2, -h/2) so points in (0..w, 0..h) local space
      // land correctly inside the container.
      const bg = this.add
        .polygon(-SHOP_CARD_W / 2, -SHOP_CARD_H / 2, points, SHOP_CARD_FILL, SHOP_CARD_FILL_ALPHA)
        .setOrigin(0, 0)
        .setStrokeStyle(1, SHOP_CARD_BORDER, SHOP_CARD_BORDER_ALPHA);
      bg.setInteractive(new Geom.Polygon(points), Geom.Polygon.Contains);
      bg.input!.cursor = 'pointer';
      bg.on('pointerup', () => this.handleShopKeypress(i));
      bg.on('pointerover', () => {
        // Subtle hover lift — bump fill alpha + switch border to solid cyan.
        bg.setFillStyle(SHOP_CARD_FILL, 1);
        this.hoverShopIndex = i;
        this.refreshHud();
      });
      bg.on('pointerout', () => {
        bg.setFillStyle(SHOP_CARD_FILL, SHOP_CARD_FILL_ALPHA);
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
   * Click / number-key shortcut: auto-buy from shop index. Parts auto-
   * place into the first free matching slot, or merge with an existing
   * same-key part. Buff items are no longer sold here — they come from
   * SANCTUM (via savedata.ownedBuffItems) and auto-apply at run start.
   */
  private handleShopKeypress(index: number): void {
    const state = getRunState(this);
    const key = state.shopOffer[index];
    if (!key) return;

    // Buff items shouldn't appear in-shop now that itemShopChance = 0;
    // guard against any stale offer and silently reject.
    if (isItemKey(key)) { playSfx('click'); return; }

    const partKey = key as PartKey;
    const part = PARTS[partKey];
    if (state.gold < part.price) { playSfx('click'); return; }
    if (!state.robotKey) return;
    // Try free slot first, then try merge slot
    const slotId = this.findFreeSlotFor(state.robotKey, partKey, state.equipped)
      ?? this.findMergeSlotFor(partKey, state.equipped);
    if (!slotId) { playSfx('click'); return; }
    this.executeBuyPart(index, partKey, slotId);
  }

  private refreshShop(): void {
    const state = getRunState(this);
    this.shopContainers.forEach((container, i) => {
      const bg = container.list[0] as GameObjects.Polygon;
      container.list.slice(1).forEach((child) => child.destroy());
      const key = state.shopOffer[i] as string | undefined;
      if (!key) {
        this.drawShopCardSold(container, bg);
        return;
      }
      if (isItemKey(key)) {
        this.drawShopCardItem(container, bg, ITEMS[key], state.gold);
        return;
      }
      this.drawShopCardPart(container, bg, key as PartKey, state);
    });
  }

  /**
   * SANCTUM-style card chrome: a 3-px category-colored accent bar on the
   * left edge + a small muted category label in the top-left corner.
   * Replaces the earlier top-slanted tag-row so the card reads vertically
   * (accent → name → price foot) like every Consecrate card in SANCTUM.
   */
  private drawShopCardAccentBar(
    container: GameObjects.Container,
    fillColor: number,
    label: string
  ): void {
    const top = -SHOP_CARD_H / 2;
    const left = -SHOP_CARD_W / 2;
    // Left bar — 3 px wide, spans most of the card height (leave 6-px
    // insets so the chamfered TL / BL corners aren't overdrawn).
    container.add(
      this.add
        .rectangle(left + 1, top + 6, 3, SHOP_CARD_H - 12, fillColor, 1)
        .setOrigin(0, 0)
    );
    // Category label — muted 9-px Rajdhani in the top-left corner.
    container.add(
      this.add
        .text(left + 10, top + 8, label, {
          fontFamily: '"Rajdhani", system-ui, sans-serif',
          fontSize: '9px',
          color: '#8da0ba',
          fontStyle: '600',
          resolution: TEXT_DPR,
        })
        .setOrigin(0, 0)
        .setLetterSpacing(3)
    );
  }

  /**
   * Star-tier indicator in the card's bottom-right foot, paired with
   * the gold price on the left so the two read as a single status row
   * (like SANCTUM's `foot` with price + Consecrate button).
   */
  private drawShopCardStars(container: GameObjects.Container, placeState: string): void {
    const stars = placeState === 'merge3' ? '★★★'
      : placeState === 'merge2' ? '★★'
      : placeState === 'equip' ? '★'
      : null;
    if (!stars) return;

    // Star-2 = yellow, Star-3 = orange (swapped from earlier scheme).
    const color = placeState === 'merge3' ? '#ff7a00'
      : placeState === 'merge2' ? '#ffd94a'
      : '#aeeaff';

    container.add(
      this.add
        .text(SHOP_CARD_W / 2 - 8, SHOP_CARD_H / 2 - 12, stars, {
          fontFamily: '"Bebas Neue", system-ui, sans-serif',
          fontSize: '12px',
          color,
          resolution: TEXT_DPR,
        })
        .setOrigin(1, 0.5)
        .setLetterSpacing(1)
    );
  }

  /** Full-cover SOLD overlay: dark plate + big red SOLD text. */
  private drawShopCardSold(container: GameObjects.Container, bg: GameObjects.Polygon): void {
    if (container.getData('placeState') !== 'sold') {
      this.tweens.killTweensOf(container);
      container.setData('placeState', 'sold');
    }
    bg.setFillStyle(PALETTE.buttonDisabled, SHOP_CARD_FILL_ALPHA);
    bg.setStrokeStyle(1, SHOP_CARD_BORDER, SHOP_CARD_BORDER_ALPHA);
    container.setAlpha(0.55);
    container.add(
      this.add.rectangle(0, 0, SHOP_CARD_W, SHOP_CARD_H, 0x000000, 0.45)
    );
    container.add(
      this.add
        .text(0, 0, t('SOLD'), {
          fontFamily: '"Bebas Neue", system-ui, sans-serif',
          fontSize: '22px',
          color: '#ff3a3a',
          resolution: TEXT_DPR,
        })
        .setOrigin(0.5)
        .setLetterSpacing(4)
    );
  }

  /** Buff item card (non-part). SANCTUM-style: left accent + name + foot. */
  private drawShopCardItem(
    container: GameObjects.Container,
    bg: GameObjects.Polygon,
    item: (typeof ITEMS)[ItemKey],
    gold: number
  ): void {
    const canAfford = gold >= item.price;
    const itemState = canAfford ? 'item' : 'item-locked';
    if (container.getData('placeState') !== itemState) {
      this.tweens.killTweensOf(container);
      container.setData('placeState', itemState);
    }
    bg.setFillStyle(canAfford ? SHOP_CARD_FILL : PALETTE.buttonDisabled, SHOP_CARD_FILL_ALPHA);
    bg.setStrokeStyle(1, canAfford ? SHOP_CARD_BORDER : PALETTE.cardStroke, SHOP_CARD_BORDER_ALPHA);
    container.setAlpha(canAfford ? 1 : 0.45);
    this.drawShopCardAccentBar(container, PALETTE.itemBar, t('BUFF'));
    container.add(
      this.add
        .text(2, -2, t(item.name), {
          fontFamily: '"Bebas Neue", system-ui, sans-serif',
          fontSize: '14px',
          color: '#ffffff',
          wordWrap: { width: SHOP_CARD_W - 20 },
          resolution: TEXT_DPR,
          align: 'center',
        })
        .setOrigin(0.5)
        .setLetterSpacing(1)
    );
    container.add(this.buildPriceText(item.price, canAfford));
  }

  /**
   * Part card. SANCTUM layout: left accent bar (category color) + tiny
   * muted category label top-left + Bebas Neue name centered + foot row
   * with price (bottom-left) and merge-tier stars (bottom-right).
   * Border state signals placement outcome (equip / merge2 / merge3).
   */
  private drawShopCardPart(
    container: GameObjects.Container,
    bg: GameObjects.Polygon,
    partKey: PartKey,
    state: RunState
  ): void {
    const part = PARTS[partKey];
    const canAfford = state.gold >= part.price;
    bg.setFillStyle(canAfford ? SHOP_CARD_FILL : PALETTE.buttonDisabled, SHOP_CARD_FILL_ALPHA);

    let placeState: 'equip' | 'merge2' | 'merge3' | 'full' = 'full';
    if (canAfford && state.robotKey) {
      const free = this.findFreeSlotFor(state.robotKey, partKey, state.equipped);
      if (free) {
        placeState = 'equip';
      } else {
        const mSlotId = this.findMergeSlotFor(partKey, state.equipped);
        if (mSlotId) {
          const resultStar = (state.equipped[mSlotId]?.star ?? 0) + 1;
          placeState = resultStar >= BALANCE.maxStarLevel ? 'merge3' : 'merge2';
        }
      }
    }
    const effectiveState = canAfford ? placeState : 'locked';
    const prevState = container.getData('placeState') as string | undefined;
    if (prevState !== effectiveState) {
      this.tweens.killTweensOf(container);
      container.setData('placeState', effectiveState);
    }

    if (!canAfford) {
      bg.setStrokeStyle(1, SHOP_CARD_BORDER, SHOP_CARD_BORDER_ALPHA);
      container.setAlpha(0.45);
    } else if (placeState === 'merge3') {
      // Star-3: orange border (was gold).
      bg.setStrokeStyle(3, PALETTE.accentOrange, 1);
      if (prevState !== effectiveState) {
        container.setAlpha(1);
        this.tweens.add({
          targets: container,
          alpha: { from: 0.68, to: 1 },
          duration: 420,
          yoyo: true,
          repeat: -1,
          ease: 'Sine.easeInOut',
        });
      }
    } else if (placeState === 'merge2') {
      // Star-2: yellow/gold border (was orange).
      bg.setStrokeStyle(2, PALETTE.goldText, 1);
      if (prevState !== effectiveState) {
        container.setAlpha(1);
        this.tweens.add({
          targets: container,
          alpha: { from: 0.82, to: 1 },
          duration: 620,
          yoyo: true,
          repeat: -1,
          ease: 'Sine.easeInOut',
        });
      }
    } else if (placeState === 'equip') {
      bg.setStrokeStyle(1, SHOP_CARD_BORDER, SHOP_CARD_BORDER_ALPHA);
      container.setAlpha(1);
    } else {
      bg.setStrokeStyle(1, 0x555577, 0.6);
      container.setAlpha(0.45);
    }

    this.drawShopCardAccentBar(container, CATEGORY_COLORS[part.category], CATEGORY_LABEL[part.category]);
    this.drawShopCardStars(container, effectiveState);

    container.add(
      this.add
        .text(2, 2, t(part.name), {
          fontFamily: '"Bebas Neue", system-ui, sans-serif',
          fontSize: '15px',
          color: '#ffffff',
          wordWrap: { width: SHOP_CARD_W - 20 },
          resolution: TEXT_DPR,
          align: 'center',
        })
        .setOrigin(0.5)
        .setLetterSpacing(1)
    );

    container.add(this.buildPriceText(part.price, canAfford));
  }

  /**
   * Shared gold-price element: big Bebas number + small darker G suffix.
   * Sits in the card's foot-left (paired with star-tier on the foot-right
   * to mirror SANCTUM's "price — buy" foot row).
   */
  private buildPriceText(price: number, canAfford: boolean): GameObjects.Container {
    // Center-aligned price block at the card foot — the owner 2026-04-25:
    // foot-left placement read as off-balance vs. centered name above
    // it. We measure (number + 'G') total width and offset the
    // container so its content centers on x = 0 (= card center).
    const priceNumber = this.add
      .text(0, 0, String(price), {
        fontFamily: '"Bebas Neue", system-ui, sans-serif',
        fontSize: '18px',
        color: canAfford ? '#ffd94a' : '#ff4444',
        resolution: TEXT_DPR,
      })
      .setOrigin(0, 0.5)
      .setLetterSpacing(1);
    const gOffset = priceNumber.width + 2;
    const g = this.add
      .text(gOffset, 1, 'G', {
        fontFamily: '"Bebas Neue", system-ui, sans-serif',
        fontSize: '11px',
        color: canAfford ? '#b89c3a' : '#6a2020',
        resolution: TEXT_DPR,
      })
      .setOrigin(0, 0.5)
      .setLetterSpacing(2);
    const totalW = gOffset + g.width;
    const wrap = this.add.container(-totalW / 2, SHOP_CARD_H / 2 - 12);
    wrap.add([priceNumber, g]);
    return wrap;
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

    const existing = state.equipped[slotId];
    let next: RunState = state;

    if (existing) {
      // Star merge: same part key and star < max -> upgrade
      if (existing.key === partKey && existing.star < BALANCE.maxStarLevel) {
        const merged: EquippedEntry = { key: existing.key, star: existing.star + 1 };
        const nextEquipped = { ...next.equipped, [slotId]: merged };
        const nextOffer = [...next.shopOffer];
        nextOffer[shopIndex] = '';
        next = { ...next, gold: next.gold - part.price, equipped: nextEquipped, shopOffer: nextOffer };
        setRunState(this, next);
        this.refreshAll();
        playSfx('buy');
        this.flashSlot(slotId);
        return;
      }
      // Occupied with different part or max star -> reject
      playSfx('click');
      return;
    }

    const entry: EquippedEntry = { key: partKey, star: 1 };
    const nextEquipped = { ...next.equipped, [slotId]: entry };
    const nextOffer = [...next.shopOffer];
    nextOffer[shopIndex] = '';
    next = { ...next, gold: next.gold - part.price, equipped: nextEquipped, shopOffer: nextOffer };

    setRunState(this, next);
    this.refreshAll();
    playSfx('buy');
    this.flashSlot(slotId);
  }

  private findFreeSlotFor(
    robotKey: RobotKey,
    partKey: PartKey,
    equipped: Readonly<Record<string, EquippedEntry>>
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

  /** Find a slot with the same part that can be star-merged. */
  private findMergeSlotFor(
    partKey: PartKey,
    equipped: Readonly<Record<string, EquippedEntry>>
  ): string | null {
    for (const slotId of Object.keys(equipped)) {
      const entry = equipped[slotId];
      if (!entry) continue;
      if (entry.key === partKey && entry.star < BALANCE.maxStarLevel) return slotId;
    }
    return null;
  }

  // ==========================================================================
  // Slot visuals
  // ==========================================================================

  private showSlotTooltip(slotId: string): void {
    const state = getRunState(this);
    const entry = state.equipped[slotId];
    if (!entry) return;
    const part = PARTS[entry.key];
    if (!part) return;
    const starLabel = entry.star > 1 ? ` ${'★'.repeat(entry.star)}` : '';
    const lines = [`${t(part.name)}${starLabel} (${CATEGORY_LABEL[part.category]})`];
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
    const sm = BALANCE.starMultipliers[entry.star] ?? 1;
    lines.push(`Sell: ${Math.floor(part.price * sm * ECONOMY.sellRefundRatio)} g`);
    this.previewText.setText(lines.join('\n'));
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
      const entry = state.equipped[sv.slot.id];
      const acceptColor = CATEGORY_COLORS[sv.slot.accepts];
      if (entry) {
        const part = PARTS[entry.key];
        const partColor = CATEGORY_COLORS[part.category];
        // Filled slot: part-category color, kept semi-transparent so the
        // blueprint lineart underneath still reads through the disc.
        sv.circle.setFillStyle(partColor, 0.55);
        sv.circle.setStrokeStyle(2, partColor);
        const starStr = entry.star > 1 ? '★'.repeat(entry.star) : CATEGORY_LABEL[part.category];
        sv.label
          .setText(starStr)
          .setColor(entry.star >= 3 ? '#ff7a00' : entry.star === 2 ? '#ffd94a' : '#ffffff');
      } else {
        // Empty slot: faint accept-category hue + matching outline.
        sv.circle.setFillStyle(acceptColor, 0.22);
        sv.circle.setStrokeStyle(2, acceptColor);
        sv.label.setText(CATEGORY_LABEL[sv.slot.accepts]).setColor('#aeeaff');
      }

      // --- Star ring (rotating dashed orbit at star ≥ 2) -------------
      const targetRing: 0 | 2 | 3 = !entry
        ? 0
        : entry.star >= 3 ? 3 : entry.star === 2 ? 2 : 0;
      if (targetRing !== sv.starRingState) {
        if (sv.starRingTween) {
          sv.starRingTween.stop();
          sv.starRingTween = null;
        }
        if (sv.starRing) {
          sv.starRing.destroy();
          sv.starRing = null;
        }
        if (targetRing !== 0) {
          const color = targetRing === 3 ? PALETTE.accentOrange : PALETTE.goldText;
          const built = this.drawStarRing(sv.circle.x, sv.circle.y, color);
          sv.starRing = built.g;
          sv.starRingTween = built.tween;
        }
        sv.starRingState = targetRing;
      }
    });

    // Awakened glow: all slots filled → blueprint goes orange.
    const allFilled = this.slotVisuals.every((sv) => !!state.equipped[sv.slot.id]);
    if (allFilled && this.slotVisuals.length > 0) {
      // Tint the machine lineart orange so the entire blueprint reads
      // "fully assembled / weapon hot".
      this.blueprintImg?.setTint(PALETTE.accentOrange);
      // Outer-frame awakened glow — thick orange stroke around the panel.
      this.silhouetteRect.setStrokeStyle(4, PALETTE.accentOrange);
      // Subtle alpha pulse for "shining" feel. Only start the tween once.
      if (!this.silhouetteRect.getData('awakenedTweenStarted')) {
        this.silhouetteRect.setData('awakenedTweenStarted', true);
        this.tweens.add({
          targets: this.silhouetteRect,
          alpha: { from: 1, to: 0.55 },
          duration: 900,
          yoyo: true,
          repeat: -1,
          ease: 'Sine.easeInOut',
        });
      }
    } else {
      // Reset to invisible + stop any pulse tween + clear blueprint tint.
      this.blueprintImg?.clearTint();
      this.silhouetteRect.setStrokeStyle();
      this.silhouetteRect.setAlpha(1);
      if (this.silhouetteRect.getData('awakenedTweenStarted')) {
        this.tweens.killTweensOf(this.silhouetteRect);
        this.silhouetteRect.setData('awakenedTweenStarted', false);
      }
    }
  }

  /**
   * Build a rotating dashed orbit ring for a star ≥ 2 slot.
   * The ring sits just outside the slot circle and spins in place.
   */
  private drawStarRing(
    cx: number,
    cy: number,
    color: number
  ): { g: GameObjects.Graphics; tween: Phaser.Tweens.Tween } {
    const ringRadius = SLOT_RADIUS + 6;
    const dashCount = 12;
    const sliceArc = (Math.PI * 2) / dashCount;
    const dashArc = sliceArc * 0.45; // 45% dash, 55% gap
    const g = this.add.graphics({ x: cx, y: cy });
    g.lineStyle(2, color, 0.95);
    for (let i = 0; i < dashCount; i += 1) {
      const a = i * sliceArc;
      g.beginPath();
      g.arc(0, 0, ringRadius, a, a + dashArc, false);
      g.strokePath();
    }
    const tween = this.tweens.add({
      targets: g,
      rotation: Math.PI * 2,
      duration: 3500,
      repeat: -1,
      ease: 'Linear',
    });
    return { g, tween };
  }

  // ==========================================================================
  // Buttons & HUD
  // ==========================================================================

  private refreshHud(): void {
    const state = getRunState(this);
    const overlayTotal = state.generatedRounds?.length || 10;
    this.buildOverlay?.update(state.currentRound, overlayTotal);

    const newRerollCost = getRerollCost(state);
    this.rerollBtnText.setText(`${t('REROLL')} (${newRerollCost} g)`);
    this.buildOverlay?.setRerollCost(newRerollCost);

    this.goldText.setText(`${state.gold} G`);
    this.goldText.setColor(state.gold >= 15 ? '#ff7a00' : '#ffd94a');
    const roundReward = ECONOMY.roundRewardBase + state.currentRound * ECONOMY.roundRewardPerRound;
    this.goldDeltaText.setText(`+${roundReward} G / ROUND`);

    if (!state.robotKey) return;
    const robot = ROBOTS[state.robotKey];
    const stats = computeLoadoutStats(robot, state.equipped, state.acquiredSkills);

    // Offense rows
    const strikeWord = stats.ultimateStrikes === 1 ? t('STRIKE') : t('STRIKES');
    const chargeExtras: string[] = [];
    if (stats.ultimateLifesteal > 0) chargeExtras.push(`DRAIN ${Math.round(stats.ultimateLifesteal * 100)}%`);
    if (stats.ultimateArmorBreak) chargeExtras.push(t('ARMOR BREAK'));
    const chargeLine = `CHARGE    \u00d7${stats.ultimateChargeRate.toFixed(1)}` +
      (chargeExtras.length > 0 ? `  |  ${chargeExtras.join(' \u00b7 ')}` : '');
    this.statsOffRows.setText([
      `${strikeWord.padEnd(10, ' ')}${stats.ultimateStrikes} \u00d7 ${stats.ultimateDamagePerStrike} DMG`,
      `TOTAL     ${stats.ultimateTotalDamage}`,
      chargeLine,
    ].join('\n'));

    // Charge bar - scale by charge rate, cap display at 3x for layout safety.
    const chargeFrac = Math.min(stats.ultimateChargeRate / 3, 1);
    const maxBarW = STATS_W - 10;
    this.chargeBarFill.setSize(Math.max(1, Math.round(maxBarW * chargeFrac)), 4);
    this.chargeBarFill.setFillStyle(
      stats.ultimateChargeRate >= 2 ? 0xffd94a : stats.ultimateChargeRate >= 1.5 ? 0xff7a00 : 0xff3a3a,
      1
    );

    // Defense rows
    const evasionPct = Math.round(stats.evasionChance * 100);
    this.statsDefRows.setText([
      `MAX HP    ${stats.maxHp}`,
      `DR        ${stats.damageReductionFlat} + ${(stats.damageReductionPct * 100).toFixed(0)}%`,
      `SHIELD    ${stats.shieldCharges}\u00d7`,
      evasionPct > 0 ? `DODGE     ${evasionPct}%` : 'DODGE     \u2014',
    ].join('\n'));

    // SKILLS column rows (heading is permanent \u2014 drawn once in drawStatsBlocks)
    const emptyDash = '\u2014';
    this.statsSkillRows.setText(
      state.acquiredSkills.length > 0
        ? state.acquiredSkills
            .map((id) => {
              const def = findSkillDef(id);
              return def ? `\u00b7 ${t(def.name)}` : '';
            })
            .filter(Boolean)
            .join('\n')
        : emptyDash
    );

    // BUFFS column rows (heading is permanent)
    const activeBuffs = [...state.battleBuffs, ...state.equippedBuffs];
    this.statsBuffRows.setText(
      activeBuffs.length > 0
        ? activeBuffs
            .map((k) => {
              const item = ITEMS[k as keyof typeof ITEMS];
              return item ? `\u00b7 ${t(item.name)}` : '';
            })
            .filter(Boolean)
            .join('\n')
        : emptyDash
    );

    // SYNERGIES rows \u2014 both placement (slot-based) + category (count-
    // based) bundled. Active first, then any "near miss" placement
    // synergies (1 part short of triggering) so the player can see
    // which buy would tip the loadout into a synergy without having
    // to memorise every rule.
    const synLines: string[] = [];
    for (const ps of stats.placementSynergies.active) {
      synLines.push(`\u2713 ${t(ps.name)}`);
    }
    const catStatuses = getSynergyStatuses(state.equipped);
    for (const cs of catStatuses) {
      if (cs.active) synLines.push(`\u2713 ${t(cs.name)}`);
    }
    this.statsSynergyRows.setText(
      synLines.length > 0 ? synLines.join('\n') : emptyDash,
    );
    this.statsSynergyRows.setColor(synLines.length > 0 ? '#ffd94a' : '#5a6878');

    // Hover preview
    if (this.hoverShopIndex !== null) {
      const hoveredKey = state.shopOffer[this.hoverShopIndex] as string | '' | undefined;
      if (hoveredKey && isItemKey(hoveredKey)) {
        const item = ITEMS[hoveredKey];
        this.previewText.setText(`${t('ITEM')}: ${t(item.name)}\n  ${t(item.description)}`);
      } else if (hoveredKey) {
        const partKey = hoveredKey as PartKey;
        const part = PARTS[partKey];
        const freeSlotId = this.findFreeSlotFor(state.robotKey, partKey, state.equipped);
        const mergeSlotId = this.findMergeSlotFor(partKey, state.equipped);
        const targetSlotId = freeSlotId ?? mergeSlotId;
        if (targetSlotId) {
          const existing = state.equipped[targetSlotId];
          const previewEntry: EquippedEntry = existing
            ? { key: existing.key, star: existing.star + 1 }
            : { key: partKey, star: 1 };
          const nextEquipped = { ...state.equipped, [targetSlotId]: previewEntry };
          const nextStats = computeLoadoutStats(robot, nextEquipped, state.acquiredSkills);
          const mergeLabel = existing ? ` (★${previewEntry.star} merge)` : '';
          const lines: string[] = [`${t('PREVIEW')}: ${t('buy')} ${t(part.name)} (${part.price}g)${mergeLabel}`];
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
    this.refreshShop();
    this.refreshHud();
  }
}
