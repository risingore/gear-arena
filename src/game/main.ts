import { AUTO, Game, Scale } from 'phaser';
import type { Types } from 'phaser';

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
import gameOptions from './helper/gameOptions';

const config: Types.Core.GameConfig = {
  title: gameOptions.gameTitle,
  type: AUTO,
  width: gameOptions.gameWidth,
  height: gameOptions.gameHeight,
  parent: 'game-container',
  backgroundColor: gameOptions.backgroundColor,
  // Crisp text on Retina / 4K displays is handled per-Text via the
  // `resolution` field of every TextStyle in helper/gameOptions.ts.
  // Phaser 4 dropped the top-level GameConfig.resolution property.
  scale: {
    mode: Scale.FIT,
    autoCenter: Scale.CENTER_BOTH
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
  scene: [Boot, Preloader, Title, Select, Build, Battle, Result, GameOver, Collection]
};

export const startGame = (parent: string): Game => {
  return new Game({ ...config, parent });
};
