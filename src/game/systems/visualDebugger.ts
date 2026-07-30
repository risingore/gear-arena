/**
 * Visual Debugger — runtime UI verification system.
 *
 * Checks:
 * 1. Text hidden behind panels (depth ordering)
 * 2. Text overflowing canvas bounds
 * 3. Elements offscreen
 * 4. Text overlapping panel/frame borders
 * 5. Text-on-text overlap
 * 6. Circles (slots) outside their containing rectangle
 * 7. Circle-on-circle overlap (slot collision)
 * 8. Divider asymmetric margins (above ≠ below)
 * 9. Tiny text under 10px (likely unreadable)
 * 10. Low-alpha text (near-invisible, probably a bug)
 */

import type { Scene, GameObjects } from 'phaser';
import gameOptions from '../helper/gameOptions';
import { isDebugEnabled } from './debug';

type IssueType =
  | 'depth_overlap'
  | 'overflow'
  | 'offscreen'
  | 'border_overlap'
  | 'text_text_overlap'
  | 'circle_outside'
  | 'circle_overlap'
  | 'asymmetric_margin'
  | 'tiny_text'
  | 'low_alpha_text';

interface VisualIssue {
  type: IssueType;
  message: string;
  x: number;
  y: number;
}

interface RectInfo {
  obj: GameObjects.Rectangle;
  x: number; y: number; w: number; h: number;
  depth: number;
  hasStroke: boolean;
}

interface TextInfo {
  obj: GameObjects.Text;
  x: number; y: number; w: number; h: number;
  depth: number;
}

interface CircleInfo {
  obj: GameObjects.Arc;
  cx: number; cy: number; r: number;
}

export function runVisualChecks(scene: Scene): VisualIssue[] {
  if (!isDebugEnabled()) return [];

  const issues: VisualIssue[] = [];
  const { gameWidth, gameHeight } = gameOptions;
  const children = scene.children.list as GameObjects.GameObject[];

  const texts: TextInfo[] = [];
  const rects: RectInfo[] = [];
  const circles: CircleInfo[] = [];

  for (const child of children) {
    const go = child as any;
    if (!go || typeof go.x !== 'number' || typeof go.y !== 'number') continue;
    if (!go.visible || go.alpha < 0.05) continue;

    if (go.type === 'Text') {
      const t = go as GameObjects.Text;
      const bounds = t.getBounds();
      if (bounds.width > 0 && bounds.height > 0) {
        texts.push({ obj: t, x: bounds.x, y: bounds.y, w: bounds.width, h: bounds.height, depth: t.depth });
      }
    } else if (go.type === 'Rectangle') {
      const r = go as GameObjects.Rectangle;
      const rx = r.x - r.displayWidth * r.originX;
      const ry = r.y - r.displayHeight * r.originY;
      const hasStroke = !!(r as any).strokeColor && (r as any).lineWidth > 0;
      rects.push({ obj: r, x: rx, y: ry, w: r.displayWidth, h: r.displayHeight, depth: r.depth, hasStroke });
    } else if (go.type === 'Arc') {
      const c = go as GameObjects.Arc;
      circles.push({ obj: c, cx: c.x, cy: c.y, r: c.radius * c.scaleX });
    }
  }

  // --- Check 1: Text hidden behind rectangles (depth) ---
  for (const t of texts) {
    for (const r of rects) {
      if (r.depth > t.depth && r.obj.alpha > 0.3) {
        if (t.x >= r.x && t.x + t.w <= r.x + r.w &&
            t.y >= r.y && t.y + t.h <= r.y + r.h) {
          issues.push({
            type: 'depth_overlap',
            message: `Text "${clip(t.obj.text)}" (depth ${t.depth}) hidden behind rect (depth ${r.depth})`,
            x: t.x, y: t.y
          });
        }
      }
    }
  }

  // --- Check 2: Text overflowing canvas ---
  for (const t of texts) {
    if (t.x + t.w > gameWidth + 10) {
      issues.push({ type: 'overflow', message: `Text "${clip(t.obj.text)}" overflows right (x=${r(t.x)}, w=${r(t.w)})`, x: t.x, y: t.y });
    }
    if (t.x < -10) {
      issues.push({ type: 'overflow', message: `Text "${clip(t.obj.text)}" overflows left (x=${r(t.x)})`, x: t.x, y: t.y });
    }
    if (t.y + t.h > gameHeight + 10) {
      issues.push({ type: 'overflow', message: `Text "${clip(t.obj.text)}" overflows bottom (y=${r(t.y)}, h=${r(t.h)})`, x: t.x, y: t.y });
    }
  }

  // --- Check 3: Elements offscreen ---
  for (const t of texts) {
    if (t.y > gameHeight + 50 || t.y + t.h < -50 || t.x > gameWidth + 200 || t.x + t.w < -200) {
      issues.push({ type: 'offscreen', message: `Text "${clip(t.obj.text)}" offscreen at (${r(t.x)}, ${r(t.y)})`, x: t.x, y: t.y });
    }
  }

  // --- Check 4: Text overlapping stroked rectangle borders ---
  const BORDER_MARGIN = 4;
  for (const t of texts) {
    for (const rect of rects) {
      if (rect.obj.alpha < 0.15) continue; // skip nearly invisible rects (washes, masks)
      if (rect.w < 50 || rect.h < 50) continue; // skip tiny rects (icons, bars)
      if (rect.w >= gameWidth - 10) continue; // skip full-width clip masks
      if (rect.w >= gameWidth * 0.5 && rect.h >= gameHeight * 0.8) continue; // skip full-screen overlays

      const tRight = t.x + t.w;
      const tBottom = t.y + t.h;
      const rRight = rect.x + rect.w;
      const rBottom = rect.y + rect.h;

      // Is text near this rect at all?
      if (t.x > rRight + 20 || tRight < rect.x - 20 || t.y > rBottom + 20 || tBottom < rect.y - 20) continue;

      // Skip if text center is outside rect (intentional title placement)
      const textCenterX = t.x + t.w / 2;
      const textCenterY = t.y + t.h / 2;
      const centerInside = textCenterX > rect.x && textCenterX < rRight && textCenterY > rect.y && textCenterY < rBottom;
      if (!centerInside) continue;

      // Check if text crosses any border line
      const crossesTop = t.y < rect.y + BORDER_MARGIN && tBottom > rect.y - BORDER_MARGIN && tRight > rect.x && t.x < rRight;
      const crossesBottom = tBottom > rBottom - BORDER_MARGIN && t.y < rBottom + BORDER_MARGIN && tRight > rect.x && t.x < rRight;
      const crossesLeft = t.x < rect.x + BORDER_MARGIN && tRight > rect.x - BORDER_MARGIN && tBottom > rect.y && t.y < rBottom;
      const crossesRight = tRight > rRight - BORDER_MARGIN && t.x < rRight + BORDER_MARGIN && tBottom > rect.y && t.y < rBottom;

      if (crossesTop || crossesBottom || crossesLeft || crossesRight) {
        const side = crossesTop ? 'top' : crossesBottom ? 'bottom' : crossesLeft ? 'left' : 'right';
        issues.push({
          type: 'border_overlap',
          message: `Text "${clip(t.obj.text)}" crosses ${side} border of rect at (${r(rect.x)},${r(rect.y)} ${r(rect.w)}x${r(rect.h)})`,
          x: t.x, y: t.y
        });
      }
    }
  }

  // --- Check 5: Text-on-text overlap ---
  for (let i = 0; i < texts.length; i++) {
    for (let j = i + 1; j < texts.length; j++) {
      const a = texts[i]!, b = texts[j]!;
      // Both must be visible and non-trivial
      if (a.obj.alpha < 0.2 || b.obj.alpha < 0.2) continue;
      if (a.w < 10 || b.w < 10) continue;

      const overlapX = a.x < b.x + b.w && a.x + a.w > b.x;
      const overlapY = a.y < b.y + b.h && a.y + a.h > b.y;

      if (overlapX && overlapY) {
        // Calculate overlap area
        const ox = Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x);
        const oy = Math.min(a.y + a.h, b.y + b.h) - Math.max(a.y, b.y);
        const overlapArea = ox * oy;
        const smallerArea = Math.min(a.w * a.h, b.w * b.h);

        // Only flag if overlap is significant (>30% of smaller text)
        if (overlapArea > smallerArea * 0.3) {
          issues.push({
            type: 'text_text_overlap',
            message: `Text "${clip(a.obj.text)}" overlaps "${clip(b.obj.text)}" (${r(overlapArea)}px² overlap)`,
            x: a.x, y: a.y
          });
        }
      }
    }
  }

  // --- Check 6: Circles outside containing stroked rectangles ---
  for (const c of circles) {
    if (c.r < 5) continue; // skip tiny circles
    for (const rect of rects) {
      if (!rect.hasStroke || rect.obj.alpha < 0.1) continue;
      if (rect.w < 100 || rect.h < 100) continue; // only check large panels

      // Is circle supposed to be inside this rect? Check if center is inside
      const insideX = c.cx > rect.x && c.cx < rect.x + rect.w;
      const insideY = c.cy > rect.y && c.cy < rect.y + rect.h;
      if (!insideX || !insideY) continue;

      // Circle center is inside rect — check if circle edge exceeds rect border
      if (c.cx - c.r < rect.x - 2 || c.cx + c.r > rect.x + rect.w + 2 ||
          c.cy - c.r < rect.y - 2 || c.cy + c.r > rect.y + rect.h + 2) {
        issues.push({
          type: 'circle_outside',
          message: `Circle at (${r(c.cx)},${r(c.cy)}) r=${r(c.r)} extends outside rect (${r(rect.x)},${r(rect.y)} ${r(rect.w)}x${r(rect.h)})`,
          x: c.cx, y: c.cy
        });
      }
    }
  }

  // --- Check 7: Circle-on-circle overlap (slot collision) ---
  for (let i = 0; i < circles.length; i++) {
    for (let j = i + 1; j < circles.length; j++) {
      const a = circles[i]!, b = circles[j]!;
      if (a.r < 5 || b.r < 5) continue;
      const dx = a.cx - b.cx;
      const dy = a.cy - b.cy;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const minDist = a.r + b.r;
      if (dist < minDist) {
        const overlap = minDist - dist;
        issues.push({
          type: 'circle_overlap',
          message: `Circles at (${r(a.cx)},${r(a.cy)}) and (${r(b.cx)},${r(b.cy)}) overlap by ${r(overlap)}px (dist=${r(dist)}, min=${r(minDist)})`,
          x: (a.cx + b.cx) / 2, y: (a.cy + b.cy) / 2
        });
      }
    }
  }

  // --- Check 8: Divider asymmetric margins ---
  // Dividers are thin horizontal rects (height <= 4, width >= 200).
  // For each divider, measure the gap to the nearest content element
  // above and below. Flag if the two gaps differ by more than 6px.
  const ASYM_TOLERANCE = 6;
  const dividers = rects.filter((rect) => rect.h <= 4 && rect.w >= 200);

  for (const div of dividers) {
    const divCenterY = div.y + div.h / 2;
    const divLeft = div.x;
    const divRight = div.x + div.w;

    // Find nearest content above (center y < divider, horizontally overlapping)
    let gapAbove = Infinity;
    let aboveLabel = '';
    for (const t of texts) {
      const tCenterY = t.y + t.h / 2;
      const tCenterX = t.x + t.w / 2;
      if (tCenterY >= divCenterY) continue;
      if (tCenterX < divLeft - 20 || tCenterX > divRight + 20) continue;
      const gap = divCenterY - (t.y + t.h);
      if (gap < gapAbove && gap >= 0) {
        gapAbove = gap;
        aboveLabel = t.obj.text;
      }
    }
    for (const rect of rects) {
      if (rect.h <= 4 || rect.w < 60 || rect.h < 20) continue;
      const rCenterY = rect.y + rect.h / 2;
      if (rCenterY >= divCenterY) continue;
      const gap = divCenterY - (rect.y + rect.h);
      if (gap < gapAbove && gap >= 0) {
        gapAbove = gap;
        aboveLabel = `rect(${r(rect.w)}x${r(rect.h)})`;
      }
    }

    // Find nearest content below
    let gapBelow = Infinity;
    let belowLabel = '';
    for (const t of texts) {
      const tCenterY = t.y + t.h / 2;
      const tCenterX = t.x + t.w / 2;
      if (tCenterY <= divCenterY) continue;
      if (tCenterX < divLeft - 20 || tCenterX > divRight + 20) continue;
      const gap = t.y - divCenterY;
      if (gap < gapBelow && gap >= 0) {
        gapBelow = gap;
        belowLabel = t.obj.text;
      }
    }
    for (const rect of rects) {
      if (rect.h <= 4 || rect.w < 60 || rect.h < 20) continue;
      const rCenterY = rect.y + rect.h / 2;
      if (rCenterY <= divCenterY) continue;
      const gap = rect.y - divCenterY;
      if (gap < gapBelow && gap >= 0) {
        gapBelow = gap;
        belowLabel = `rect(${r(rect.w)}x${r(rect.h)})`;
      }
    }

    if (gapAbove < Infinity && gapBelow < Infinity) {
      const diff = Math.abs(gapAbove - gapBelow);
      if (diff > ASYM_TOLERANCE) {
        issues.push({
          type: 'asymmetric_margin',
          message: `Divider at y=${r(divCenterY)}: margin above=${r(gapAbove)}px ("${clip(aboveLabel)}") vs below=${r(gapBelow)}px ("${clip(belowLabel)}") — diff ${r(diff)}px`,
          x: div.x, y: divCenterY
        });
      }
    }
  }

  // --- Check 9: Tiny text (< 10px) ---
  for (const t of texts) {
    // Approximate glyph height from bounds; if the text bounding box is
    // under 10px tall it's likely unreadable on a 720p stage.
    if (t.h > 0 && t.h < 10) {
      issues.push({
        type: 'tiny_text',
        message: `Text "${clip(t.obj.text)}" is ${r(t.h)}px tall (< 10px, likely unreadable)`,
        x: t.x, y: t.y,
      });
    }
  }

  // --- Check 10: Low-alpha text that looks like a bug, not intentional ---
  for (const t of texts) {
    // Alphas between 0.05 and 0.18 are suspicious: visible enough to render
    // but too faint to read. Deliberate quiet lines (attributions,
    // watermarks) usually sit between 0.25 and 0.5.
    if (t.obj.alpha >= 0.05 && t.obj.alpha < 0.18 && t.obj.text.length >= 4) {
      issues.push({
        type: 'low_alpha_text',
        message: `Text "${clip(t.obj.text)}" has alpha ${t.obj.alpha.toFixed(2)} (near-invisible, intended?)`,
        x: t.x, y: t.y,
      });
    }
  }

  if (isDebugEnabled()) {
    if (issues.length > 0) {
      console.warn(`[VisualDebugger] ${scene.scene.key}: ${issues.length} issue(s) found:`);
      for (const issue of issues) {
        console.warn(`  [${issue.type}] ${issue.message}`);
      }
    } else {
      console.log(`[VisualDebugger] ${scene.scene.key}: OK — no issues detected`);
    }
  }

  return issues;
}

function clip(text: string): string {
  return (text || '').substring(0, 30);
}

function r(n: number): number {
  return Math.round(n);
}
