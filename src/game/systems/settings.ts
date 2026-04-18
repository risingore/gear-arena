/**
 * Persistent game settings via localStorage.
 *
 * Separate from savedata (progress) so a player can tweak settings
 * without risking their collection/unlocks.
 */

const STORAGE_KEY = 'soul-strike-settings-v1';

export interface GameSettings {
  bgmVolume: number;          // 0.0 – 1.0
  sfxVolume: number;          // 0.0 – 1.0
  locale: string;             // 'en' | 'ja'
  defaultBattleSpeed: number; // 1 | 2 | 4 | 6
  fullscreen: boolean;
}

const DEFAULTS: GameSettings = {
  bgmVolume: 0.8,
  sfxVolume: 1.0,
  locale: 'en',
  defaultBattleSpeed: 2,
  fullscreen: false
};

let cached: GameSettings | null = null;

export const loadSettings = (): GameSettings => {
  if (cached) return cached;
  try {
    if (typeof localStorage === 'undefined') return { ...DEFAULTS };
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULTS };
    const parsed = JSON.parse(raw) as Partial<GameSettings>;
    cached = {
      bgmVolume: typeof parsed.bgmVolume === 'number' ? parsed.bgmVolume : DEFAULTS.bgmVolume,
      sfxVolume: typeof parsed.sfxVolume === 'number' ? parsed.sfxVolume : DEFAULTS.sfxVolume,
      locale: typeof parsed.locale === 'string' ? parsed.locale : DEFAULTS.locale,
      defaultBattleSpeed: typeof parsed.defaultBattleSpeed === 'number' ? parsed.defaultBattleSpeed : DEFAULTS.defaultBattleSpeed,
      fullscreen: typeof parsed.fullscreen === 'boolean' ? parsed.fullscreen : DEFAULTS.fullscreen
    };
    return cached;
  } catch {
    return { ...DEFAULTS };
  }
};

export const saveSettings = (s: GameSettings): void => {
  cached = s;
  try {
    if (typeof localStorage === 'undefined') return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(s));
  } catch { /* silent */ }
};

export const updateSetting = <K extends keyof GameSettings>(
  key: K,
  value: GameSettings[K]
): GameSettings => {
  const s = loadSettings();
  s[key] = value;
  saveSettings(s);
  return s;
};

export const resetSettings = (): void => {
  cached = null;
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem(STORAGE_KEY);
    }
  } catch { /* silent */ }
};
