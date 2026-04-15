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

const gameOptions: GameOptions = {
  gameTitle: 'GEAR ARENA',
  gameWidth: 1280,
  gameHeight: 720,
  backgroundColor: '#0a0a10',
  textStyles: {
    title: {
      fontFamily: 'system-ui, sans-serif',
      fontSize: '64px',
      color: '#ffffff',
      fontStyle: 'bold'
    },
    body: {
      fontFamily: 'system-ui, sans-serif',
      fontSize: '24px',
      color: '#ffffff'
    },
    small: {
      fontFamily: 'system-ui, sans-serif',
      fontSize: '16px',
      color: '#888899'
    }
  },
  colors: {
    accent: 0xff7a00,
    muted: 0x555566,
    white: 0xffffff
  }
};

export default gameOptions;
