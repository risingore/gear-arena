/**
 * Locale dictionary registry.
 *
 * Central place where every supported locale's dictionary is registered.
 * The `t()` function in `systems/i18n.ts` reads from here.
 */

import type { Locale, LocaleDict } from './locales';
import { en } from './en';
import { ja } from './ja';

export const LOCALES: Readonly<Record<Locale, LocaleDict>> = {
  en,
  ja
};

export type { Locale, LocaleDict };
export { SUPPORTED_LOCALES } from './locales';
