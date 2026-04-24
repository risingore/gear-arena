import { Scene } from 'phaser';

import { ITEMS, ALL_ITEM_KEYS, type ItemKey } from '@/data';
import { PALETTE, CATEGORY_COLORS } from '../systems/palette';
import { playSfx } from '../systems/audio';
import { fadeInCurrent, fadeToScene } from '../systems/transition';
import { t, bl } from '../systems/i18n';
import {
  loadSaveData,
  purchaseSanctumBuff,
} from '../systems/savedata';
import {
  mountSanctumOverlay,
  type SanctumOverlayHandle,
  type SanctumBuffCard,
} from '../overlays/sanctumOverlay';
import { applyHiDpiToScene, showDebugBadge } from '../helper/hiDpiText';
import { isDebugEnabled } from '../systems/debug';

/**
 * SANCTUM (加持堂) — meta-progression buff shop accessible from Title
 * once the player completes their first battle. Spends persistent scrap
 * to consecrate buff items that auto-equip at the next run start.
 */
export class Sanctum extends Scene {
  private overlay: SanctumOverlayHandle | null = null;

  constructor() {
    super('Sanctum');
  }

  create(): void {
    this.cameras.main.setBackgroundColor(PALETTE.bg);
    fadeInCurrent(this);

    const save = loadSaveData();

    const cards: SanctumBuffCard[] = ALL_ITEM_KEYS.map((key) => {
      const item = ITEMS[key];
      // Scrap price = Phaser-gold price. Tuned in src/data/items.ts.
      const scrapPrice = item.price;
      return {
        key,
        name: t(item.name),
        description: t(item.description),
        scrapPrice,
        categoryHex: `#${CATEGORY_COLORS.charger.toString(16).padStart(6, '0')}`,
      };
    });

    const ownedNames = (items: readonly string[]): string[] =>
      items.map((k) => {
        const item = ITEMS[k as ItemKey];
        return item ? t(item.name) : k;
      });

    this.overlay = mountSanctumOverlay({
      title: t('SANCTUM'),
      subtitle: bl({
        en: 'Spend scrap to consecrate your next loadout.',
        ja: 'Spend scrap to consecrate your next loadout.',
      }),
      scrapLabel: t('Scrap:'),
      scrapAmount: save.scrap,
      consecrateLabel: t('Consecrate'),
      notEnoughLabel: t('Not enough scrap.'),
      readiedHeading: t('BUFFS READIED'),
      readiedEmpty: t('No buffs readied.'),
      readied: ownedNames(save.ownedBuffItems),
      cards,
      backLabel: t('← BACK'),
      onPurchase: (key: string) => {
        const item = ITEMS[key as ItemKey];
        if (!item) return;
        const updated = purchaseSanctumBuff(key, item.price);
        if (!updated) {
          playSfx('click');
          return;
        }
        playSfx('buy');
        this.overlay?.update(updated.scrap, ownedNames(updated.ownedBuffItems));
      },
      onBack: () => {
        playSfx('click');
        fadeToScene(this, 'Title');
      },
    });

    this.events.once('shutdown', () => {
      this.overlay?.unmount();
      this.overlay = null;
    });
    this.events.once('destroy', () => {
      this.overlay?.unmount();
      this.overlay = null;
    });

    this.input.keyboard?.once('keydown-ESC', () => fadeToScene(this, 'Title'));
    this.input.keyboard?.once('keydown-R', () => fadeToScene(this, 'Title'));

    applyHiDpiToScene(this);
    showDebugBadge(this, isDebugEnabled());
  }
}
