/**
 * Central debug toggle.
 *
 * Debug mode is persisted in localStorage so it survives page reloads.
 * The toggle button lives on the Title scene. When debug is ON:
 *   - Battle shows elapsed real-time counter
 *   - Select shows blueprint slot previews instead of silhouettes
 *   - Future debug aids can check isDebugEnabled()
 */

const STORAGE_KEY = 'soul-strike-debug';

interface DebugSettings {
  enabled: boolean;
  bossMode: boolean;
  oneShotMode: boolean;
}

const load = (): DebugSettings => {
  try {
    if (typeof localStorage === 'undefined') return { enabled: false, bossMode: false, oneShotMode: false };
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<DebugSettings>;
      return {
        enabled: parsed.enabled === true,
        bossMode: parsed.bossMode === true,
        oneShotMode: parsed.oneShotMode === true,
      };
    }
  } catch { /* silent */ }
  return { enabled: false, bossMode: false, oneShotMode: false };
};

let settings = load();

const save = (): void => {
  try {
    if (typeof localStorage === 'undefined') return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  } catch { /* silent */ }
};

export const isDebugEnabled = (): boolean => settings.enabled;

export const toggleDebug = (): boolean => {
  settings.enabled = !settings.enabled;
  save();
  return settings.enabled;
};

export const isBossModeEnabled = (): boolean => settings.bossMode;

export const toggleBossMode = (): boolean => {
  settings.bossMode = !settings.bossMode;
  save();
  return settings.bossMode;
};

export const isOneShotModeEnabled = (): boolean => settings.oneShotMode;

export const toggleOneShotMode = (): boolean => {
  settings.oneShotMode = !settings.oneShotMode;
  save();
  return settings.oneShotMode;
};
