/**
 * Ambient globals for Playwright-driven scripts.
 *
 * The Phaser game instance is attached to `window.__PHASER_GAME__` after
 * `startGame()` in `src/game/main.ts`. Scripts running inside
 * `page.evaluate()` access it there. This typing reduces the number of
 * `as any` casts needed in scripts/*.
 */

declare global {
  interface Window {
    __PHASER_GAME__?: {
      readonly canvas: HTMLCanvasElement;
      readonly renderer: {
        readonly width: number;
        readonly height: number;
        readonly type: number;
        resize(w: number, h: number): void;
      };
      readonly scale: {
        readonly width: number;
        readonly height: number;
        readonly displaySize: { width: number; height: number };
        readonly gameSize: { width: number; height: number };
        setGameSize(w: number, h: number): void;
      };
      readonly scene: {
        readonly scenes: readonly PhaserSceneLike[];
      };
      readonly config: { width: number; height: number };
      readonly events: {
        on(event: string, fn: (...args: unknown[]) => void): void;
      };
    };
    __HIDPI_STATE__?: Record<string, unknown>;
  }
}

interface PhaserSceneLike {
  readonly scene: {
    readonly key: string;
    isActive(): boolean;
  };
  readonly cameras?: {
    readonly main?: {
      x: number;
      y: number;
      width: number;
      height: number;
      zoom: number;
      scrollX: number;
      scrollY: number;
      centerX: number;
      centerY: number;
      setZoom(z: number): void;
      setSize(w: number, h: number): void;
      setScroll(x: number, y: number): void;
      centerOn(x: number, y: number): void;
    };
  };
  readonly events?: {
    on(event: string, fn: (...args: unknown[]) => void): void;
  };
  readonly registry?: {
    get(key: string): unknown;
  };
}

export {};
