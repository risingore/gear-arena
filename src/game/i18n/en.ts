/**
 * English dictionary.
 *
 * Kept intentionally empty — English is the canonical source language, so
 * every `t('...')` call with English keys passes through unchanged and
 * returns the key itself. Do not add entries here unless you are overriding
 * a specific English string (effectively never).
 */

import type { LocaleDict } from './locales';

export const en: LocaleDict = {};
