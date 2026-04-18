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
}

const load = (): DebugSettings => {
  try {
    if (typeof localStorage === 'undefined') return { enabled: false };
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw) as DebugSettings;
  } catch { /* silent */ }
  return { enabled: false };
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
