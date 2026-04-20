import { Scene } from 'phaser';

import gameOptions from '../helper/gameOptions';
import { createButton } from '../helper/uiFactory';
import { PALETTE } from '../systems/palette';
import { playSfx } from '../systems/audio';
import { fadeInCurrent, fadeToScene } from '../systems/transition';
import { t } from '../systems/i18n';
import { applyHiDpiToScene, showDebugBadge } from '../helper/hiDpiText';
import { isDebugEnabled } from '../systems/debug';
import { mountFrameOverlay } from '../overlays/overlayBase';

/**
 * Credits scene.
 *
 * Displayed from Title or at the end of the ED sequence. Lists the tools,
 * technologies, and creative credits so Jam judges can audit the
 * production stack at a glance. All entries are factual — every tool
 * listed is actually used in the project pipeline.
 */

interface CreditsRow {
  readonly heading: string;
  readonly lines: readonly string[];
}

const CREDITS: readonly CreditsRow[] = [
  {
    heading: 'GAME DESIGN / CODE',
    lines: ['Risingore'],
  },
  {
    heading: 'DEVELOPMENT TOOLS',
    lines: [
      'Cursor (editor)',
      'Claude Code (coding agent)',
      'Claude Design (Title screen)',
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
      'Grok (character art generation)',
      'rembg (background removal)',
      'Suno (music)',
      'Piskel (pixel edits)',
    ],
  },
  {
    heading: 'AUDIO',
    lines: [
      'Web Audio API (SFX synthesized at runtime)',
    ],
  },
  {
    heading: 'LORE / INSPIRATION',
    lines: [
      'Kongō-kai / Taizō-kai mandala systems (Shingon Buddhism)',
      'Yōkai folklore (yamata-no-orochi, hyakki yakō)',
      'Cyberpunk genre conventions',
    ],
  },
  {
    heading: 'THANKS',
    lines: [
      'Gamedev.js Jam 2026 organizers',
      'Phaser + Claude Code communities',
    ],
  },
];

export class Credits extends Scene {
  constructor() {
    super('Credits');
  }

  create(): void {
    const { gameWidth, gameHeight, textStyles } = gameOptions;
    this.cameras.main.setBackgroundColor(PALETTE.bg);
    fadeInCurrent(this);

    const unmountFrame = mountFrameOverlay({
      tagLeft: '<b>SS</b>-<b>100</b> / CREDITS <span class="bar"></span> ROSTER',
      tagRight: 'PRODUCTION <span class="bar"></span> <b>SOUL STRIKE</b>',
    });
    this.events.once('shutdown', unmountFrame);
    this.events.once('destroy', unmountFrame);

    this.add
      .text(gameWidth / 2, 60, t('CREDITS'), textStyles.title)
      .setOrigin(0.5)
      .setColor('#ffffff');

    // Orange accent bar under title
    this.add.rectangle(gameWidth / 2, 98, 180, 2, PALETTE.accentOrange, 0.8);

    // Render credit blocks in two columns
    const leftX = gameWidth * 0.26;
    const rightX = gameWidth * 0.56;
    let leftY = 130;
    let rightY = 130;
    const entryGap = 12;
    const sectionGap = 22;

    CREDITS.forEach((row, i) => {
      const useLeft = i < Math.ceil(CREDITS.length / 2);
      const x = useLeft ? leftX : rightX;
      const yRef = useLeft ? leftY : rightY;

      const heading = this.add
        .text(x, yRef, row.heading, {
          ...textStyles.body,
          fontSize: '18px',
          color: '#ffd94a',
          fontStyle: '700',
        })
        .setOrigin(0, 0);
      let y = yRef + heading.height + 6;
      for (const line of row.lines) {
        this.add
          .text(x + 8, y, line, {
            ...textStyles.small,
            color: '#cfd8e4',
          })
          .setOrigin(0, 0);
        y += 20;
      }
      y += sectionGap;
      void entryGap;

      if (useLeft) leftY = y;
      else rightY = y;
    });

    // License note
    this.add
      .text(gameWidth / 2, gameHeight - 80, t('Code: MIT  ·  Assets: CC BY-NC 4.0'), {
        ...textStyles.small,
        color: '#8da0ba',
      })
      .setOrigin(0.5);

    // Back button
    createButton(this, gameWidth / 2, gameHeight - 40, 200, 38, t('BACK'), () => {
      playSfx('click');
      fadeToScene(this, 'Title');
    });

    this.input.keyboard?.once('keydown-SPACE', () => fadeToScene(this, 'Title'));
    this.input.keyboard?.once('keydown-ESC', () => fadeToScene(this, 'Title'));

    applyHiDpiToScene(this);
    showDebugBadge(this, isDebugEnabled());
  }
}
