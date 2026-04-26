import { Scene } from 'phaser';

import { ROBOTS, ALL_ROBOT_KEYS, ROBOT_ULTIMATES, type RobotKey } from '@/data';
import { CHARACTER_QUOTES, THESIS_PROLOGUE } from '@/data/storyText';
import { bl, t } from '../systems/i18n';
import { getRunState, setRunState, resetRunState } from '../systems/runState';
import { PALETTE, ROBOT_COLORS } from '../systems/palette';
import { generateShopOffer } from '../systems/shop';
import { generateRunEnemies } from '../systems/enemyPool';
import { isRobotUnlocked, isSuperBossUnlocked, consumeOwnedBuffs } from '../systems/savedata';
import { isItemKey, type ItemKey } from '@/data';
import { playSfx } from '../systems/audio';
import { fadeInCurrent, fadeToScene } from '../systems/transition';
import { showDebugBadge } from '../helper/hiDpiText';
import { isDebugEnabled, isBossModeEnabled } from '../systems/debug';
import {
  mountSelectOverlay,
  type SelectOverlayHandle,
  type SelectOverlayCharacter,
} from '../overlays/selectOverlay';

/**
 * Select scene.
 *
 * Character picker UI is rendered as an HTML overlay (see
 * `overlays/selectOverlay.ts`) for native-DOM crispness. The Phaser
 * scene owns the canvas fade-in/out transitions, keyboard shortcuts,
 * and run-state initialization only.
 */
export class Select extends Scene {
  private selectedIndex = 0;
  private unmountOverlay: (() => void) | null = null;

  constructor() {
    super('Select');
  }

  create(): void {
    this.cameras.main.setBackgroundColor(PALETTE.bg);
    fadeInCurrent(this);

    const keys = ALL_ROBOT_KEYS;

    // Jam scope: only INDRA ('robot_knight') is playable this release.
    // Other cyborgs are shown as COMING SOON teasers so players can see
    // what's coming in future episodes without being able to select them.
    const PLAYABLE_KEY: RobotKey = 'robot_knight';
    const characters: SelectOverlayCharacter[] = keys.map((key) => {
      const robot = ROBOTS[key];
      const ult = ROBOT_ULTIMATES[key];
      const isPlayable = key === PLAYABLE_KEY;
      const comingSoon = !isPlayable;
      const locked = comingSoon ? true : !isRobotUnlocked(key);
      const colorInt = ROBOT_COLORS[robot.archetype];
      const hex = '#' + colorInt.toString(16).padStart(6, '0');
      const portraitSrc = this.textures.exists(robot.battleAssetKey)
        ? `assets/images/${robot.battleAssetKey}.png`
        : null;
      return {
        key,
        name: t(robot.name),
        archetype: robot.archetype.toUpperCase(),
        description: t(robot.description),
        passive: t(robot.passiveText),
        hp: robot.baseHp,
        slots: robot.slots.length,
        buffSlots: robot.buffSlots,
        ultName: ult ? t(ult.name) : null,
        quote: bl(CHARACTER_QUOTES[key]),
        locked,
        comingSoon,
        portraitSrc,
        themeHex: hex,
      };
    });

    const handle: SelectOverlayHandle = mountSelectOverlay({
      characters,
      initialIndex: this.selectedIndex,
      thesisPrologue: bl(THESIS_PROLOGUE),
      embarkLabel: t('SELECT'),
      backLabel: t('BACK'),
      lockedLabel: t('LOCKED'),
      comingSoonLabel: t('COMING SOON'),
      lockedHint: t('Clear the previous character to unlock'),
      ultLabelPrefix: 'ULT:',
      onChange: (idx) => {
        this.selectedIndex = idx;
        playSfx('click');
      },
      onConfirm: (idx) => {
        this.selectedIndex = idx;
        this.confirm();
      },
      onBack: () => {
        playSfx('click');
        fadeToScene(this, 'Title');
      },
    });
    this.unmountOverlay = () => handle.unmount();

    // Keyboard shortcuts
    this.input.keyboard?.on('keydown-LEFT', () => {
      this.selectedIndex = (this.selectedIndex - 1 + keys.length) % keys.length;
      handle.setIndex(this.selectedIndex);
      playSfx('click');
    });
    this.input.keyboard?.on('keydown-RIGHT', () => {
      this.selectedIndex = (this.selectedIndex + 1) % keys.length;
      handle.setIndex(this.selectedIndex);
      playSfx('click');
    });
    this.input.keyboard?.on('keydown-ENTER', () => this.confirm());
    this.input.keyboard?.on('keydown-SPACE', () => this.confirm());
    this.input.keyboard?.on('keydown-R', () => fadeToScene(this, 'Title'));

    this.events.once('shutdown', () => {
      this.unmountOverlay?.();
      this.unmountOverlay = null;
    });
    this.events.once('destroy', () => {
      this.unmountOverlay?.();
      this.unmountOverlay = null;
    });

    showDebugBadge(this, isDebugEnabled());
  }

  private confirm(): void {
    const keys = ALL_ROBOT_KEYS;
    const robotKey: RobotKey = keys[this.selectedIndex]!;
    // Jam scope: only INDRA is playable; other slots are teasers.
    if (robotKey !== 'robot_knight' || !isRobotUnlocked(robotKey)) {
      playSfx('click');
      return;
    }
    playSfx('buy');
    // Read the mode Title set on click before resetRunState wipes it.
    // Easy = 5 rounds (R1-4 normal, R5 mid-boss). Hard = 10 rounds full arc.
    const previousMode = getRunState(this).endingMode;
    const fresh = resetRunState(this);
    const generatedRounds = generateRunEnemies(
      isSuperBossUnlocked(),
      undefined,
      previousMode,
      isBossModeEnabled(),
    );
    const debugGold = isDebugEnabled() ? 100000 : fresh.gold;
    // Drain SANCTUM-purchased buff items into the fresh run's equippedBuffs.
    // Battle.ts consumes them at battle start.
    const drainedBuffs = consumeOwnedBuffs().filter(isItemKey) as ItemKey[];
    const next = {
      ...fresh,
      robotKey,
      endingMode: previousMode,
      gold: debugGold,
      shopOffer: generateShopOffer(),
      generatedRounds,
      equippedBuffs: drainedBuffs,
    };
    setRunState(this, next);
    fadeToScene(this, 'Build');
  }
}
