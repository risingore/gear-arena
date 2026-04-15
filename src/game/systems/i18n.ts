/**
 * Runtime localization.
 *
 * Design:
 *   - gettext-style: English source strings act as their own keys. Wrap every
 *     user-visible string in `t('...')`; untranslated entries fall back to the
 *     English source automatically.
 *   - Locale detection order: (1) localStorage override, (2) `navigator.language`,
 *     (3) default `en`.
 *   - Switching locale at runtime re-reads the dictionary but does not
 *     hot-refresh already-rendered Phaser text objects. Trigger a scene restart
 *     if you need an instant visual update.
 *
 * Usage:
 *   import { t, setLocale, getLocale } from '@/game/systems/i18n';
 *   label.setText(t('READY  ▶'));
 *
 * Adding a language: see `src/game/i18n/locales.ts`.
 */

import { LOCALES, SUPPORTED_LOCALES, type Locale } from '../i18n';

const STORAGE_KEY = 'gear-arena-locale';
const DEFAULT_LOCALE: Locale = 'en';

const isSupported = (value: string): value is Locale =>
  (SUPPORTED_LOCALES as readonly string[]).includes(value);

const detectLocale = (): Locale => {
  try {
    if (typeof localStorage !== 'undefined') {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored && isSupported(stored)) return stored;
    }
  } catch {
    // ignore and fall through
  }
  try {
    if (typeof navigator !== 'undefined' && navigator.language) {
      const lang = navigator.language.toLowerCase();
      if (lang.startsWith('ja')) return 'ja';
      if (lang.startsWith('en')) return 'en';
    }
  } catch {
    // ignore
  }
  return DEFAULT_LOCALE;
};

let currentLocale: Locale = detectLocale();

export const getLocale = (): Locale => currentLocale;

export const setLocale = (locale: Locale): void => {
  currentLocale = locale;
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, locale);
    }
  } catch {
    // ignore
  }
};

/**
 * Translate an English source string. Returns the key itself when no
 * translation is registered, so the game keeps working during partial
 * translations.
 */
export const t = (key: string): string => {
  const dict = LOCALES[currentLocale];
  const translated = dict[key];
  return typeof translated === 'string' && translated.length > 0 ? translated : key;
};

export type { Locale };
