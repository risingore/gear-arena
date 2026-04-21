/**
 * Canonical credits data.
 *
 * Single source of truth shared by the Credits scene (grouped column
 * layout) and the Victory ending scroll (flat line-per-entry roll).
 * Any rewording or reordering must happen here.
 */

export interface CreditsSection {
  readonly heading: string;
  readonly lines: readonly string[];
}

export const CREDITS: readonly CreditsSection[] = [
  {
    heading: 'GAME DESIGN / CODE',
    lines: ['Risingore'],
  },
  {
    heading: 'DEVELOPMENT TOOLS',
    lines: [
      'Cursor',
      'Claude Code',
      'Claude Design',
    ],
  },
  {
    heading: 'ENGINE / STACK',
    lines: [
      'Phaser 4.0',
      'Vite 6 + TypeScript 5.7',
      'Bun',
    ],
  },
  {
    heading: 'AI-ASSISTED ASSETS',
    lines: [
      'Grok',
      'Suno',
      'Piskel',
    ],
  },
  {
    heading: 'AUDIO',
    lines: ['Web Audio API'],
  },
  {
    heading: 'LORE / INSPIRATION',
    lines: [
      'Kongō-kai / Taizō-kai mandala',
      'Yōkai folklore',
      'Cyberpunk genre conventions',
      'Echo Theory (original thought by Risingore)',
    ],
  },
  {
    heading: 'LICENSE',
    lines: [
      'Code: MIT',
      'Assets: CC BY-NC 4.0',
    ],
  },
];
