/**
 * Supported UI locales and the locale dictionary shape.
 *
 * Add a new locale in three steps:
 *   1. Append its code to `SUPPORTED_LOCALES`.
 *   2. Create `src/game/i18n/<code>.ts` exporting a `LocaleDict`.
 *   3. Register the dictionary in `src/game/i18n/index.ts`.
 *
 * `LocaleDict` maps the original English text to its translation. Any key
 * missing from a dictionary automatically falls back to the English key, so
 * partial translations are always safe to ship.
 */

export const SUPPORTED_LOCALES = ['en', 'ja'] as const;
export type Locale = (typeof SUPPORTED_LOCALES)[number];

export type LocaleDict = Readonly<Record<string, string>>;
