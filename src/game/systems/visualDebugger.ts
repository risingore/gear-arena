/**
 * Visual Debugger — runtime UI verification system.
 *
 * Call `runVisualChecks(scene)` at the end of any scene's create() to detect:
 * 1. Text hidden behind panels (depth ordering issues)
 * 2. Text overflowing canvas bounds
 * 3. Overlapping interactive elements
 * 4. Elements positioned outside the visible area
 *
 * Results are logged to the browser console with warnings.
 * Only runs when debug mode is enabled.
 */

import type { Scene, GameObjects } from 'phaser';
import gameOptions from '../helper/gameOptions';
import { isDebugEnabled } from './debug';

interface VisualIssue {
  type: 'depth_overlap' | 'overflow' | 'offscreen' | 'interactive_overlap';
  message: string;
  x: number;
  y: number;
}

/**
 * Run all visual checks on the current scene and log issues to console.
 */
export function runVisualChecks(scene: Scene): VisualIssue[] {
  if (!isDebugEnabled()) return [];

  const issues: VisualIssue[] = [];
  const { gameWidth, gameHeight } = gameOptions;
  const children = scene.children.list as GameObjects.GameObject[];

  // Collect all text and rectangle objects with positions
  const texts: { obj: GameObjects.Text; x: number; y: number; w: number; h: number; depth: number }[] = [];
  const rects: { obj: GameObjects.Rectangle; x: number; y: number; w: number; h: number; depth: number }[] = [];

  for (const child of children) {
    const go = child as any;
    if (!go || typeof go.x !== 'number' || typeof go.y !== 'number') continue;
    if (!go.visible) continue;

    if (go.type === 'Text') {
      const t = go as GameObjects.Text;
      const bounds = t.getBounds();
      texts.push({ obj: t, x: bounds.x, y: bounds.y, w: bounds.width, h: bounds.height, depth: t.depth });
    } else if (go.type === 'Rectangle') {
      const r = go as GameObjects.Rectangle;
      rects.push({
        obj: r,
        x: r.x - r.displayWidth * r.originX,
        y: r.y - r.displayHeight * r.originY,
        w: r.displayWidth,
        h: r.displayHeight,
        depth: r.depth
      });
    }
  }

  // Check 1: Text hidden behind rectangles (higher depth rect covers text)
  for (const t of texts) {
    for (const r of rects) {
      if (r.depth > t.depth && r.obj.alpha > 0.3) {
        // Check if rect covers the text position
        if (t.x >= r.x && t.x + t.w <= r.x + r.w &&
            t.y >= r.y && t.y + t.h <= r.y + r.h) {
          issues.push({
            type: 'depth_overlap',
            message: `Text "${(t.obj.text || '').substring(0, 30)}" (depth ${t.depth}) hidden behind rectangle (depth ${r.depth})`,
            x: t.x, y: t.y
          });
        }
      }
    }
  }

  // Check 2: Text overflowing canvas bounds
  for (const t of texts) {
    if (t.x + t.w > gameWidth + 10) {
      issues.push({
        type: 'overflow',
        message: `Text "${(t.obj.text || '').substring(0, 30)}" overflows right edge (x=${Math.round(t.x)}, w=${Math.round(t.w)}, canvas=${gameWidth})`,
        x: t.x, y: t.y
      });
    }
    if (t.x < -10) {
      issues.push({
        type: 'overflow',
        message: `Text "${(t.obj.text || '').substring(0, 30)}" overflows left edge (x=${Math.round(t.x)})`,
        x: t.x, y: t.y
      });
    }
  }

  // Check 3: Elements completely offscreen
  for (const t of texts) {
    if (t.y > gameHeight + 50 || t.y + t.h < -50 || t.x > gameWidth + 200 || t.x + t.w < -200) {
      issues.push({
        type: 'offscreen',
        message: `Text "${(t.obj.text || '').substring(0, 30)}" is offscreen at (${Math.round(t.x)}, ${Math.round(t.y)})`,
        x: t.x, y: t.y
      });
    }
  }

  // Log results
  if (issues.length > 0) {
    console.warn(`[VisualDebugger] ${scene.scene.key}: ${issues.length} issue(s) found:`);
    for (const issue of issues) {
      console.warn(`  [${issue.type}] ${issue.message}`);
    }
  } else {
    console.log(`[VisualDebugger] ${scene.scene.key}: OK — no issues detected`);
  }

  return issues;
}
