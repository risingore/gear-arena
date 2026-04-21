import { AUTO, Game, Scale } from 'phaser';
import type { Types } from 'phaser';

declare global {
  interface Window {
    __PHASER_GAME__?: Game;
    __APPLY_BG_AUDIO__?: (enabled: boolean) => void;
  }
}

// High-DPI text resolution is applied per-scene via helper/hiDpiText.ts.
// Each scene calls applyHiDpiToScene(this) at the end of create().

import { Boot } from './scenes/Boot';
import { Preloader } from './scenes/Preloader';
import { Title } from './scenes/Title';
import { Select } from './scenes/Select';
import { Build } from './scenes/Build';
import { Battle } from './scenes/Battle';
import { Result } from './scenes/Result';
import { GameOver } from './scenes/GameOver';
import { Collection } from './scenes/Collection';
import { Settings } from './scenes/Settings';
import { Credits } from './scenes/Credits';
import gameOptions from './helper/gameOptions';
import { loadSettings } from './systems/settings';

// Render-time pixel density for the canvas backing store.
// We force at least 2x so scenes stay crisp even on DPR=1 displays
// (e.g. laptops at 100% Windows scaling). Capped at 3 to avoid huge
// render targets on extreme 4K Retina.
export const RENDER_DPR = typeof window !== 'undefined'
  ? Math.max(2, Math.min(window.devicePixelRatio || 1, 3))
  : 2;

const config: Types.Core.GameConfig = {
  title: gameOptions.gameTitle,
  type: AUTO,
  width: gameOptions.gameWidth,
  height: gameOptions.gameHeight,
  parent: 'game-container',
  backgroundColor: gameOptions.backgroundColor,
  scale: {
    mode: Scale.FIT,
    // Phaser's auto-center was competing with the flex-center we used
    // previously, producing an asymmetric offL. CSS `position:absolute
    // + transform: translate(-50%, -50%)` on the canvas now handles
    // centering deterministically — keep autoCenter off.
    autoRound: false
  },
  // Explicitly enable the input plugins. Phaser usually does this by
  // default, but pinning it down avoids any chance of the keyboard
  // listener silently disappearing on us.
  input: {
    keyboard: true,
    mouse: true,
    touch: true,
    gamepad: false
  },
  render: {
    antialias: true,
    pixelArt: false,
    roundPixels: false
  },
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { x: 0, y: 0 },
      debug: false
    }
  },
  scene: [Boot, Preloader, Title, Select, Build, Battle, Result, GameOver, Collection, Settings, Credits]
};

export const startGame = (parent: string): Game => {
  const game = new Game({ ...config, parent });
  window.__PHASER_GAME__ = game;

  const applyBackgroundAudio = (enabled: boolean): void => {
    try {
      game.sound.pauseOnBlur = !enabled;
    } catch {
      /* sound manager may not be ready yet */
    }
  };
  applyBackgroundAudio(loadSettings().backgroundAudio);
  window.__APPLY_BG_AUDIO__ = applyBackgroundAudio;

  document.addEventListener('visibilitychange', () => {
    if (!document.hidden && loadSettings().backgroundAudio) {
      try {
        game.sound.pauseOnBlur = false;
      } catch {
        /* no-op */
      }
    }
  });

  window.addEventListener('keydown', (ev) => {
    // Ignore if user is typing in an input/textarea.
    const target = ev.target as HTMLElement | null;
    if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA')) return;
    if (ev.key === 'F' || ev.key === 'f') {
      ev.preventDefault();
      if (document.fullscreenElement) {
        document.exitFullscreen().catch(() => {});
      } else {
        document.documentElement.requestFullscreen().catch(() => {});
      }
    }
  });

  return game;
};
