// web/app/_arcade/hud.ts
//
// Shared HUD primitives for the arcade games — score readout (top-left,
// number-only) and lives indicator (top-right, delegating icon paint to
// the per-game caller).
//
// Why this lives in `_arcade/`: both games used to roll their own HUDs
// with diverging layouts, font sizes, mobile rules, and even the
// presence/absence of a "SCORE" label and a separate "HI" indicator.
// Centralising the layout + sizing here makes the two games render
// matching HUDs while letting each keep its native art (vector ship
// for asteroids, pixel rocket for space-barrage) for the lives icon.
//
// Mobile rule: `(max-width: 768px)` matches the cabinet breakpoint
// used elsewhere (see `web/app/arcade/asteroids/_game/engine/scale.ts`'s
// historical `getEntityScale`). On mobile the HUD shrinks to 0.7× of
// its desktop size — small enough to free play-field real estate, big
// enough to stay legible.

const MOBILE_BREAKPOINT_PX = 768;
const HUD_MOBILE_SCALE = 0.7;

function isMobileViewport(): boolean {
  if (typeof window === 'undefined' || !window.matchMedia) return false;
  return window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT_PX}px)`).matches;
}

/** Multiplier applied to the HUD font + lives-icon size. 1 on desktop,
 *  0.7 on mobile. */
export function getHudScale(): number {
  return isMobileViewport() ? HUD_MOBILE_SCALE : 1;
}

/** Font size + edge padding derived from canvas width. The 0.022 / 0.016
 *  ratios mirror the original asteroids HUD which scaled to ~24px / ~17px
 *  on a full 1080-wide cabinet (4:3 — 1080×810). Caller passes `canvasW`
 *  in canvas-pixel units (i.e. after any DPR transform has been applied
 *  to ctx). */
export interface HudMetrics {
  fontSize: number;
  pad: number;
}

export function getHudMetrics(canvasW: number): HudMetrics {
  const hudScale = getHudScale();
  const fontSize = Math.round(Math.max(14, Math.round(canvasW * 0.022)) * hudScale);
  const pad = Math.round(Math.max(12, Math.round(canvasW * 0.016)) * hudScale);
  return { fontSize, pad };
}

/** Draw the score, top-left, number-only (no "SCORE" label).
 *
 *  The number is left-padded to 5 digits so it doesn't reflow as the
 *  player passes 10 / 100 / … points — matches the arcade-classic
 *  fixed-width score display. */
export function drawHudScore(
  ctx: CanvasRenderingContext2D,
  canvasW: number,
  score: number,
  color: string,
): void {
  if (canvasW <= 0) return;
  const { fontSize, pad } = getHudMetrics(canvasW);

  ctx.save();
  ctx.font = `${fontSize}px PressStart2P-Regular, monospace`;
  ctx.textBaseline = 'top';
  ctx.textAlign = 'left';
  ctx.fillStyle = color;
  ctx.fillText(String(score).padStart(5, '0'), pad, pad);
  ctx.restore();
}

/** Draw the lives indicator, top-right. The shape of each life icon is
 *  the caller's responsibility — pass `drawIcon` to render one icon
 *  inside a `size × size` box at (x, y) (top-left of the box).
 *
 *  We standardise position (top-right with a small inter-icon gap) and
 *  the icon size (font-size proportional, matches the score's visual
 *  weight). Each game passes its own `drawIcon` callback so asteroids
 *  stays vector and space-barrage stays pixel. */
export function drawHudLives(
  ctx: CanvasRenderingContext2D,
  canvasW: number,
  lives: number,
  drawIcon: (ctx: CanvasRenderingContext2D, x: number, y: number, size: number) => void,
): void {
  if (canvasW <= 0 || lives <= 0) return;
  const { fontSize, pad } = getHudMetrics(canvasW);
  const iconSize = Math.round(fontSize * 1.05);
  const gap = Math.round(fontSize * 0.45);

  ctx.save();
  // Right-most icon is closest to the right edge; subsequent icons
  // march leftward.
  for (let i = 0; i < lives; i++) {
    const x = canvasW - pad - iconSize - i * (iconSize + gap);
    drawIcon(ctx, x, pad, iconSize);
  }
  ctx.restore();
}
