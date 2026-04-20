/**
 * SOUL STRIKE UI Design System
 *
 * Unified factory functions for panels, buttons, labels, dividers, and glow
 * text. Every scene should use these instead of raw rectangles/text so that
 * visual identity stays consistent across the entire game.
 *
 * Design Rules:
 * - Panel bg: 0x12121e, border: 0x334466 (2px)
 * - Button bg: 0x1a2a44, hover: 0x2a3a55, border: 0x4466aa
 * - Danger button: 0x441a1a, hover: 0x552a2a, border: 0xaa4444
 * - Accent button: uses character/context color as fill, text is dark (#0a0a10)
 * - Spacing: 8px minimum between elements
 * - All interactive: useHandCursor, hover scale 1.03
 * - Text shadow on important labels: 2px offset, black 50% alpha
 * - Consistent depth layering: bg=0, panels=1, content=2, buttons=3, popups=10+
 */

import { GameObjects } from 'phaser';
import type { Scene } from 'phaser';

import gameOptions from './gameOptions';
import { TEXT_DPR } from './hiDpiText';

// ---------------------------------------------------------------------------
// Color constants
// ---------------------------------------------------------------------------

const PANEL_BG = 0x16203a;
const PANEL_BORDER = 0x5a8ec4;

const BUTTON_BG = 0x1a2a44;
const BUTTON_HOVER = 0x2a3a55;
const BUTTON_BORDER = 0x4466aa;
const BUTTON_PRESS_SCALE = 0.97;

const DANGER_BG = 0x441a1a;
const DANGER_HOVER = 0x552a2a;
const DANGER_BORDER = 0xaa4444;

const HOVER_SCALE = 1.03;

// ---------------------------------------------------------------------------
// Panel options
// ---------------------------------------------------------------------------

export interface PanelOptions {
  /** Fill color override (default: PANEL_BG). */
  fillColor?: number;
  /** Fill alpha (default: 1). */
  fillAlpha?: number;
  /** Border color override (default: PANEL_BORDER). */
  borderColor?: number;
  /** Border width (default: 2). */
  borderWidth?: number;
  /** Depth layer (default: -1, behind content). */
  depth?: number;
}

/**
 * Create a styled panel. Uses the UI texture if loaded, falls back to rectangle.
 */
export function createPanel(
  scene: Scene,
  x: number,
  y: number,
  w: number,
  h: number,
  options?: PanelOptions
): GameObjects.Rectangle {
  const fill = options?.fillColor ?? PANEL_BG;
  const fillAlpha = options?.fillAlpha ?? 1;
  const border = options?.borderColor ?? PANEL_BORDER;
  const borderW = options?.borderWidth ?? 2;
  const depth = options?.depth ?? -1;

  return scene.add
    .rectangle(x, y, w, h, fill, fillAlpha)
    .setStrokeStyle(borderW, border)
    .setDepth(depth);
}

// ---------------------------------------------------------------------------
// Button options
// ---------------------------------------------------------------------------

export type ButtonVariant = 'default' | 'accent' | 'danger';

export interface ButtonOptions {
  variant?: ButtonVariant;
  /** Accent / fill color used for the 'accent' variant. */
  accentColor?: number;
  /** Depth layer (default: 3). */
  depth?: number;
  /** Base alpha for the text (default: 1). */
  textAlpha?: number;
  /** Font size override. */
  fontSize?: string;
}

export interface ButtonResult {
  bg: GameObjects.Rectangle;
  text: GameObjects.Text;
}

/**
 * Create a styled button with hover / press states.
 */
export function createButton(
  scene: Scene,
  x: number,
  y: number,
  w: number,
  h: number,
  label: string,
  onClick: () => void,
  options?: ButtonOptions
): ButtonResult {
  const variant = options?.variant ?? 'default';
  const depth = options?.depth ?? 3;
  const fontSize = options?.fontSize ?? undefined;

  let bgColor: number;
  let hoverColor: number;
  let borderColor: number;
  let textColor: string;

  switch (variant) {
    case 'accent': {
      const accent = options?.accentColor ?? 0xffd94a;
      bgColor = accent;
      hoverColor = accent;
      borderColor = 0xffffff;
      textColor = '#0a0a10';
      break;
    }
    case 'danger':
      bgColor = DANGER_BG;
      hoverColor = DANGER_HOVER;
      borderColor = DANGER_BORDER;
      textColor = '#ff4444';
      break;
    default:
      bgColor = BUTTON_BG;
      hoverColor = BUTTON_HOVER;
      borderColor = BUTTON_BORDER;
      textColor = '#ffffff';
      break;
  }

  const bg = scene.add
    .rectangle(x, y, w, h, bgColor, 1)
    .setStrokeStyle(2, borderColor)
    .setDepth(depth)
    .setInteractive({ useHandCursor: true });

  const style = { ...gameOptions.textStyles.body };
  if (fontSize) (style as Record<string, unknown>).fontSize = fontSize;

  const text = scene.add
    .text(x, y, label, style)
    .setOrigin(0.5)
    .setColor(textColor)
    .setDepth(depth + 1)
    .setResolution(TEXT_DPR);

  if (options?.textAlpha !== undefined) text.setAlpha(options.textAlpha);

  bg.on('pointerover', () => {
    bg.setScale(HOVER_SCALE);
    text.setScale(HOVER_SCALE);
    if (variant === 'accent') {
      bg.setStrokeStyle(3, 0xffffff);
    } else {
      bg.setFillStyle(hoverColor, 1);
    }
  });

  bg.on('pointerout', () => {
    bg.setScale(1);
    text.setScale(1);
    if (variant === 'accent') {
      bg.setStrokeStyle(2, borderColor);
    } else {
      bg.setFillStyle(bgColor, 1);
    }
  });

  bg.on('pointerdown', () => {
    bg.setScale(BUTTON_PRESS_SCALE);
    text.setScale(BUTTON_PRESS_SCALE);
    onClick();
  });

  bg.on('pointerup', () => {
    bg.setScale(1);
    text.setScale(1);
  });

  return { bg, text };
}

// ---------------------------------------------------------------------------
// Label / text helpers
// ---------------------------------------------------------------------------

export type LabelStyle = 'title' | 'body' | 'small' | 'accent';

/**
 * Create a styled text with consistent formatting.
 */
export function createLabel(
  scene: Scene,
  x: number,
  y: number,
  content: string,
  style: LabelStyle
): GameObjects.Text {
  const baseStyle =
    style === 'accent'
      ? { ...gameOptions.textStyles.body, color: '#ffd94a', fontStyle: 'bold' }
      : { ...gameOptions.textStyles[style] };

  const label = scene.add
    .text(x, y, content, baseStyle)
    .setOrigin(0.5)
    .setResolution(TEXT_DPR);

  return label;
}

// ---------------------------------------------------------------------------
// Divider
// ---------------------------------------------------------------------------

/**
 * Create a horizontal accent divider line with gradient alpha edges.
 */
export function createDivider(
  scene: Scene,
  x: number,
  y: number,
  width: number
): GameObjects.Rectangle {
  const line = scene.add
    .rectangle(x, y, width, 2, PANEL_BORDER, 0.6)
    .setDepth(2);

  return line;
}

// ---------------------------------------------------------------------------
// Glow text
// ---------------------------------------------------------------------------

/**
 * Create text with a subtle drop-shadow / glow effect for important labels.
 * Returns the foreground text (the shadow is managed internally).
 */
export function createGlowText(
  scene: Scene,
  x: number,
  y: number,
  content: string,
  color: string
): GameObjects.Text {
  // Shadow layer
  scene.add
    .text(x + 2, y + 2, content, {
      ...gameOptions.textStyles.body,
      color: '#000000'
    })
    .setOrigin(0.5)
    .setAlpha(0.5)
    .setResolution(TEXT_DPR);

  // Foreground
  const text = scene.add
    .text(x, y, content, {
      ...gameOptions.textStyles.body,
      color,
      fontStyle: 'bold'
    })
    .setOrigin(0.5)
    .setResolution(TEXT_DPR);

  return text;
}
