/**
 * Mandala — reusable visual component for the ritual circle motif.
 *
 * Used on the Title screen (steady rotation, always visible) and planned
 * for re-use during the SOUL STRIKE ultimate cut-in (expand / collapse
 * animation). Ported from the Claude Design Title A v2 HTML spec.
 *
 * Structure (all drawn via Phaser Graphics, zero image assets):
 *   - Center breathing pulse (orange radial glow, 1.6s cycle)
 *   - Outer ring: dashed + solid circles + 48 tick marks + zodiac labels
 *   - Inner ring: solid + dashed concentric circles
 *   - Soul dial: 260x260 orange arc (0..1 progress)
 *   - Outer rotates clockwise, inner rotates counter-clockwise
 */
import { Scene, GameObjects } from 'phaser';

export interface MandalaConfig {
  readonly x: number;
  readonly y: number;
  /** Container pixel size. Title default 560. */
  readonly size?: number;
  /** Outer ring radius (in container coords). Default 260. */
  readonly outerRadius?: number;
  /** Inner ring radius. Default 170. */
  readonly innerRadius?: number;
  /** Dashed outer ring radius. Default 210. */
  readonly dashedOuterRadius?: number;
  /** Dashed inner ring radius. Default 120. */
  readonly dashedInnerRadius?: number;
  /** Tick count around outer ring. Default 48. */
  readonly notchCount?: number;
  /** Every Nth tick is a major tick. Default 6. */
  readonly majorEvery?: number;
  /** Zodiac labels placed at equal angular intervals on the outer ring. */
  readonly zodiacLabels?: readonly string[];
  /** Angle offset (degrees) for the zodiac pattern. Default -54. */
  readonly zodiacAngleOffset?: number;
  /** Zodiac placement radius. Default 238. */
  readonly zodiacRadius?: number;
  /** Clockwise rotation period in ms. Default 28000. */
  readonly cwDurationMs?: number;
  /** Counter-clockwise rotation period in ms. Default 42000. */
  readonly ccwDurationMs?: number;
  /** Breathing pulse cycle in ms. Default 1600. */
  readonly pulseDurationMs?: number;
  /** Show the central soul dial arc. Default true. */
  readonly showSoulDial?: boolean;
  /** Soul dial fill ratio (0..1). Default 0.58. */
  readonly soulDialProgress?: number;
  /** Soul dial outer radius. Default 108. */
  readonly soulDialRadius?: number;
  /** Soul dial stroke width. Default 12. */
  readonly soulDialStrokeWidth?: number;
}

export interface Mandala {
  /** Top-level container. Move/scale/rotate this to transform the whole mandala. */
  readonly container: GameObjects.Container;
  /** Clockwise outer ring container (rotates CW). */
  readonly outerRing: GameObjects.Container;
  /** Counter-clockwise inner ring container (rotates CCW). */
  readonly innerRing: GameObjects.Container;
  /** Central pulse. */
  readonly pulse: GameObjects.Arc;
}

/**
 * Expand a mandala from a pinpoint (scale 0, alpha 0) to full display.
 * Designed for the SOUL STRIKE ultimate cut-in: call at strike start so
 * the mandala blossoms from the player character's chest.
 */
export function expandMandala(
  scene: Scene,
  mandala: Mandala,
  durationMs = 500,
): Phaser.Tweens.Tween {
  mandala.container.setScale(0);
  mandala.container.setAlpha(0);
  return scene.tweens.add({
    targets: mandala.container,
    scale: 1,
    alpha: 1,
    duration: durationMs,
    ease: 'Back.easeOut',
  });
}

/**
 * Collapse a mandala (scale + fade to 0) and destroy it on completion.
 * Use at strike end to fold the mandala back into the character.
 */
export function collapseMandala(
  scene: Scene,
  mandala: Mandala,
  durationMs = 400,
  destroyOnComplete = true,
): Phaser.Tweens.Tween {
  return scene.tweens.add({
    targets: mandala.container,
    scale: 0,
    alpha: 0,
    duration: durationMs,
    ease: 'Cubic.easeIn',
    onComplete: () => {
      if (destroyOnComplete) mandala.container.destroy();
    },
  });
}

/**
 * Pulse the mandala once — scale-up then scale-down back to 1. Useful for
 * non-critical hit feedback or aura-level changes during a rush.
 */
export function pulseMandala(
  scene: Scene,
  mandala: Mandala,
  intensity = 1.08,
  durationMs = 300,
): Phaser.Tweens.Tween {
  return scene.tweens.add({
    targets: mandala.container,
    scale: intensity,
    duration: durationMs / 2,
    yoyo: true,
    ease: 'Sine.easeInOut',
  });
}

// Palette constants (match Title A v2 spec)
const COLOR_BLUEPRINT_LINE = 0xaeeaff;
const COLOR_ACCENT_ORANGE = 0xff7a00;

const DEFAULT_ZODIAC: readonly string[] = [
  'MODULE',
  'IMPLANT',
  'CHARGER',
  'BOOSTER',
  'SOUL',
];

export function createMandala(scene: Scene, cfg: MandalaConfig): Mandala {
  const size = cfg.size ?? 560;
  void size; // reserved for future outer-edge boundary checks
  const outerR = cfg.outerRadius ?? 260;
  const innerR = cfg.innerRadius ?? 170;
  const dashedOuterR = cfg.dashedOuterRadius ?? 210;
  const dashedInnerR = cfg.dashedInnerRadius ?? 120;
  const notchCount = cfg.notchCount ?? 48;
  const majorEvery = cfg.majorEvery ?? 6;
  const zodiacLabels = cfg.zodiacLabels ?? DEFAULT_ZODIAC;
  const zodiacAngleOffset = cfg.zodiacAngleOffset ?? -54;
  const zodiacR = cfg.zodiacRadius ?? 238;
  const cwDuration = cfg.cwDurationMs ?? 28000;
  const ccwDuration = cfg.ccwDurationMs ?? 42000;
  const pulseDuration = cfg.pulseDurationMs ?? 1600;
  const showSoulDial = cfg.showSoulDial ?? true;
  const soulDialProgress = cfg.soulDialProgress ?? 0.58;
  const soulDialR = cfg.soulDialRadius ?? 108;
  const soulDialStroke = cfg.soulDialStrokeWidth ?? 12;

  const container = scene.add.container(cfg.x, cfg.y);

  // --- Center pulse (behind everything, breathes orange) ---
  // Softer than the HTML spec (which relied on CSS blur(4px) we can't replicate).
  // High alpha here was washing the center behind the SOUL/STRIKE title.
  const pulse = scene.add.circle(0, 0, 140, COLOR_ACCENT_ORANGE, 0.18);
  container.add(pulse);
  scene.tweens.add({
    targets: pulse,
    alpha: { from: 0.14, to: 0.32 },
    scale: { from: 0.95, to: 1.05 },
    duration: pulseDuration / 2,
    ease: 'Sine.easeInOut',
    yoyo: true,
    repeat: -1,
  });

  // --- Outer ring (rotates CW) ---
  const outerRing = scene.add.container(0, 0);
  container.add(outerRing);

  const outerGfx = scene.add.graphics();
  // Central core glow — single subtle fill. Previously 2 stacked fills
  // compounded with the center pulse to fog the title text.
  outerGfx.fillStyle(COLOR_ACCENT_ORANGE, 0.05);
  outerGfx.fillCircle(0, 0, 180);
  // Solid outer ring at r=260, opacity .38
  outerGfx.lineStyle(1, COLOR_BLUEPRINT_LINE, 0.38);
  outerGfx.strokeCircle(0, 0, outerR);
  // Dashed outer ring at r=210, opacity .22
  drawDashedCircle(outerGfx, 0, 0, dashedOuterR, 1, COLOR_BLUEPRINT_LINE, 0.22, 4, 8);
  // Axis lines
  outerGfx.lineStyle(1, COLOR_BLUEPRINT_LINE, 0.18);
  drawDashedLine(outerGfx, -outerR, 0, outerR, 0, 2, 8);
  drawDashedLine(outerGfx, 0, -outerR, 0, outerR, 2, 8);
  outerRing.add(outerGfx);

  // Ticks (48 notches, major every 6, cardinals 0 and 24 accent)
  const tickGfx = scene.add.graphics();
  for (let i = 0; i < notchCount; i += 1) {
    const isMajor = i % majorEvery === 0;
    const isCardinal = i === 0 || i === notchCount / 2;
    const angleDeg = (i / notchCount) * 360 - 90;
    const rad = (angleDeg * Math.PI) / 180;
    const tickLen = isMajor ? 18 : 10;
    const tickWidth = isMajor ? 2 : 1;
    const x1 = Math.cos(rad) * outerR;
    const y1 = Math.sin(rad) * outerR;
    const x2 = Math.cos(rad) * (outerR - tickLen);
    const y2 = Math.sin(rad) * (outerR - tickLen);
    const color = isCardinal ? COLOR_ACCENT_ORANGE : COLOR_BLUEPRINT_LINE;
    const alpha = isCardinal ? 0.9 : isMajor ? 0.55 : 0.28;
    tickGfx.lineStyle(tickWidth, color, alpha);
    tickGfx.beginPath();
    tickGfx.moveTo(x1, y1);
    tickGfx.lineTo(x2, y2);
    tickGfx.strokePath();
  }
  outerRing.add(tickGfx);

  // Zodiac labels (decorative category tags, alpha 0.25)
  zodiacLabels.forEach((label, i) => {
    const angleDeg = (i / zodiacLabels.length) * 360 + zodiacAngleOffset;
    const rad = (angleDeg * Math.PI) / 180;
    const lx = Math.cos(rad) * zodiacR;
    const ly = Math.sin(rad) * zodiacR;
    const text = scene.add.text(lx, ly, label, {
      fontFamily: '"Rajdhani", system-ui, sans-serif',
      fontSize: '11px',
      color: '#aeeaff',
      fontStyle: '400',
    });
    text.setOrigin(0.5);
    text.setAlpha(0.25);
    text.setRotation(rad + Math.PI / 2);
    // Letter-spacing approximation via wider char via CSS letter-spacing is
    // not natively supported in Phaser Text. The visual density difference
    // is minor; label stays legible.
    outerRing.add(text);
  });

  // Inner ring (rotates CCW, separate container)
  const innerRing = scene.add.container(0, 0);
  container.add(innerRing);

  const innerGfx = scene.add.graphics();
  // Inner solid ring r=170, opacity .55
  innerGfx.lineStyle(1.5, COLOR_BLUEPRINT_LINE, 0.55);
  innerGfx.strokeCircle(0, 0, innerR);
  // Dashed inner ring r=120, opacity .3
  drawDashedCircle(innerGfx, 0, 0, dashedInnerR, 1, COLOR_BLUEPRINT_LINE, 0.3, 2, 6);
  innerRing.add(innerGfx);

  // Soul dial (stationary, orange arc)
  if (showSoulDial) {
    const dialGfx = scene.add.graphics();
    // Track (dark background ring)
    dialGfx.lineStyle(soulDialStroke, 0x0e1020, 1);
    dialGfx.strokeCircle(0, 0, soulDialR);
    // Fill arc (progress, orange, starts at top -90°)
    dialGfx.lineStyle(soulDialStroke, COLOR_ACCENT_ORANGE, 1);
    dialGfx.beginPath();
    const startAngle = -Math.PI / 2;
    const endAngle = startAngle + Math.PI * 2 * soulDialProgress;
    dialGfx.arc(0, 0, soulDialR, startAngle, endAngle, false);
    dialGfx.strokePath();
    container.add(dialGfx);

    // Dial ticks (20 around dial, major every 5)
    const dialTickGfx = scene.add.graphics();
    for (let i = 0; i < 20; i += 1) {
      const isMajorTick = i % 5 === 0;
      const tickAngleDeg = i * 18 - 90;
      const rad = (tickAngleDeg * Math.PI) / 180;
      const tickOuter = soulDialR + 8;
      const tickInner = soulDialR + 16;
      const x1 = Math.cos(rad) * tickOuter;
      const y1 = Math.sin(rad) * tickOuter;
      const x2 = Math.cos(rad) * tickInner;
      const y2 = Math.sin(rad) * tickInner;
      dialTickGfx.lineStyle(isMajorTick ? 1.5 : 1, COLOR_BLUEPRINT_LINE, isMajorTick ? 0.8 : 0.3);
      dialTickGfx.beginPath();
      dialTickGfx.moveTo(x1, y1);
      dialTickGfx.lineTo(x2, y2);
      dialTickGfx.strokePath();
    }
    container.add(dialTickGfx);
  }

  // Rotations
  scene.tweens.add({
    targets: outerRing,
    angle: 360,
    duration: cwDuration,
    repeat: -1,
    ease: 'Linear',
  });
  scene.tweens.add({
    targets: innerRing,
    angle: -360,
    duration: ccwDuration,
    repeat: -1,
    ease: 'Linear',
  });

  return { container, outerRing, innerRing, pulse };
}

/** Draw a dashed circle using short stroke segments. */
function drawDashedCircle(
  g: GameObjects.Graphics,
  cx: number,
  cy: number,
  radius: number,
  lineWidth: number,
  color: number,
  alpha: number,
  dashLen: number,
  gapLen: number,
): void {
  g.lineStyle(lineWidth, color, alpha);
  const circumference = 2 * Math.PI * radius;
  const segment = dashLen + gapLen;
  const count = Math.floor(circumference / segment);
  for (let i = 0; i < count; i += 1) {
    const startAngle = (i * segment) / radius;
    const endAngle = startAngle + dashLen / radius;
    const x1 = cx + Math.cos(startAngle) * radius;
    const y1 = cy + Math.sin(startAngle) * radius;
    const x2 = cx + Math.cos(endAngle) * radius;
    const y2 = cy + Math.sin(endAngle) * radius;
    g.beginPath();
    g.moveTo(x1, y1);
    g.lineTo(x2, y2);
    g.strokePath();
  }
}

/** Draw a dashed straight line. */
function drawDashedLine(
  g: GameObjects.Graphics,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  dashLen: number,
  gapLen: number,
): void {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const dist = Math.sqrt(dx * dx + dy * dy);
  const stepCount = Math.floor(dist / (dashLen + gapLen));
  const ux = dx / dist;
  const uy = dy / dist;
  for (let i = 0; i < stepCount; i += 1) {
    const s = i * (dashLen + gapLen);
    const sx = x1 + ux * s;
    const sy = y1 + uy * s;
    const ex = x1 + ux * (s + dashLen);
    const ey = y1 + uy * (s + dashLen);
    g.beginPath();
    g.moveTo(sx, sy);
    g.lineTo(ex, ey);
    g.strokePath();
  }
}
