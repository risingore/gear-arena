import type { Types } from 'phaser';

/**
 * Central configuration for gameplay-wide constants.
 *
 * Rule (Kima): no magic numbers in scenes. Every scene reads width / height /
 * colors / text styles from here so a Jam can be retuned from a single file.
 */

type GameOptions = {
  readonly gameTitle: string;
  readonly gameWidth: number;
  readonly gameHeight: number;
  readonly backgroundColor: string;
  readonly textStyles: {
    readonly title: Readonly<Types.GameObjects.Text.TextStyle>;
    readonly body: Readonly<Types.GameObjects.Text.TextStyle>;
    readonly small: Readonly<Types.GameObjects.Text.TextStyle>;
  };
  readonly colors: {
    readonly accent: number;
    readonly muted: number;
    readonly white: number;
  };
};

/**
 * Match the canvas text rendering to the device pixel ratio. Without this
 * Phaser rasterizes text at the logical 1x size and then scales the canvas
 * up, which produces fuzzy / muddy glyphs on Retina and 4K displays.
 *
 * Capped at 3 to keep the glyph cache reasonable on extreme DPI screens.
 */
const TEXT_RESOLUTION =
  typeof window !== 'undefined'
    ? Math.max(2, Math.min(window.devicePixelRatio || 1, 3))
    : 2;

const gameOptions: GameOptions = {
  gameTitle: 'SOUL STRIKE',
  gameWidth: 1280,
  gameHeight: 720,
  backgroundColor: '#0a0a10',
  textStyles: {
    title: {
      fontFamily: '"Bebas Neue", system-ui, sans-serif',
      fontSize: '64px',
      color: '#ffffff',
      fontStyle: 'bold',
      resolution: TEXT_RESOLUTION
    },
    body: {
      fontFamily: '"Rajdhani", system-ui, sans-serif',
      fontSize: '24px',
      color: '#ffffff',
      fontStyle: '600',
      resolution: TEXT_RESOLUTION
    },
    small: {
      fontFamily: '"Rajdhani", system-ui, sans-serif',
      fontSize: '16px',
      color: '#888899',
      resolution: TEXT_RESOLUTION
    }
  },
  colors: {
    accent: 0xff7a00,
    muted: 0x555566,
    white: 0xffffff
  }
};

export default gameOptions;
