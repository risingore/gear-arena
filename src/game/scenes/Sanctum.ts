import { Scene } from 'phaser';

import { ITEMS, ALL_ITEM_KEYS, type ItemKey } from '@/data';
import {
  PALETTE,
  SANCTUM_KIND_COLORS,
  SANCTUM_KIND_LABEL,
  SANCTUM_KIND_ORDER,
  type SanctumKind,
} from '../systems/palette';
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
  type SanctumBuffSection,
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

    // Group items by effect.kind so SANCTUM displays a 3×3 grid:
    // one row per kind (OFFENSE / DEFENSE / RECON), 3 buffs per row.
    const hex = (n: number): string => `#${n.toString(16).padStart(6, '0')}`;

    const cardsByKind = new Map<SanctumKind, SanctumBuffCard[]>();
    for (const kind of SANCTUM_KIND_ORDER) cardsByKind.set(kind, []);
    for (const key of ALL_ITEM_KEYS) {
      const item = ITEMS[key];
      const kind = item.effect.kind as SanctumKind;
      const bucket = cardsByKind.get(kind);
      if (!bucket) continue;
      bucket.push({
        key,
        name: t(item.name),
        description: t(item.description),
        scrapPrice: item.price,
      });
    }
    for (const bucket of cardsByKind.values()) {
      bucket.sort((a, b) => a.scrapPrice - b.scrapPrice);
    }

    const sections: SanctumBuffSection[] = SANCTUM_KIND_ORDER
      .map((kind): SanctumBuffSection => ({
        kindKey: kind,
        kindLabel: SANCTUM_KIND_LABEL[kind],
        kindHex: hex(SANCTUM_KIND_COLORS[kind]),
        cards: cardsByKind.get(kind) ?? [],
      }))
      .filter((s) => s.cards.length > 0);

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
      notEnoughLabel: t('Not enough scrap.'),
      ownedLabel: t('READIED'),
      readiedHeading: t('BUFFS READIED'),
      readiedEmpty: t('No buffs readied.'),
      readied: ownedNames(save.ownedBuffItems),
      ownedKeys: save.ownedBuffItems,
      sections,
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
        this.overlay?.update(updated.scrap, ownedNames(updated.ownedBuffItems), updated.ownedBuffItems);
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
