import { AUTO, Game, Scale } from 'phaser';
import type { Types } from 'phaser';

import { Boot } from './scenes/Boot';
import { Preloader } from './scenes/Preloader';
import { Title } from './scenes/Title';
import { Select } from './scenes/Select';
import { Build } from './scenes/Build';
import { Battle } from './scenes/Battle';
import { Result } from './scenes/Result';
import { GameOver } from './scenes/GameOver';
import gameOptions from './helper/gameOptions';

const config: Types.Core.GameConfig = {
  title: gameOptions.gameTitle,
  type: AUTO,
  width: gameOptions.gameWidth,
  height: gameOptions.gameHeight,
  parent: 'game-container',
  backgroundColor: gameOptions.backgroundColor,
  scale: {
    mode: Scale.FIT,
    autoCenter: Scale.CENTER_BOTH
  },
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { x: 0, y: 0 },
      debug: false
    }
  },
  scene: [Boot, Preloader, Title, Select, Build, Battle, Result, GameOver]
};

export const startGame = (parent: string): Game => {
  return new Game({ ...config, parent });
};
