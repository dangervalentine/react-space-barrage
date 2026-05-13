// web/app/_arcade/canvasUI.ts
//
// Pure 2D-canvas drawing primitives shared across per-game renderers
// once they migrate landing / gameover screens off HTML+CSS into the
// canvas. Each helper is a pure function: takes a context + position
// + options, draws, returns (where useful) the y-position the next
// stack item should start at so callers can chain text/sprite stacks
// without manually tracking widths.
//
// All helpers expect the caller's transform to already be set up
// (i.e., they draw in canvas-px space). DPR scaling and any
// world-coordinate transforms are the renderer's responsibility.
//
// Why a shared file: post-Stage-1B both games render their landing /
// gameover screens via the same pipeline. Title text, keycap glyphs,
// leaderboard rows, and the chunky pixelated banner ring borders are
// identical between asteroids and space-barrage — pulling them into
// `_arcade/canvasUI.ts` avoids per-game forks the moment we add a
// third game.

const PRESS_START_2P = "'PressStart2P-Regular', monospace";

export interface DrawTextOptions {
  /** Font size in canvas-px. Caller is responsible for DPR scaling
   *  (typically the renderer's `resize` already applied a
   *  `scale(dpr, dpr)` to the context). */
  sizePx: number;
  /** Horizontal alignment around the given x. Maps to canvas
   *  `textAlign`. */
  align?: CanvasTextAlign;
  /** Vertical baseline relative to the given y. Maps to canvas
   *  `textBaseline`. Default `top` (y is the top of the text box). */
  baseline?: CanvasTextBaseline;
  /** Fill color — any CSS color string. */
  color: string;
  /** Letter-spacing in px. PressStart2P already has wide tracking
   *  intrinsically; most callers should leave at 0. */
  letterSpacing?: number;
  /** Optional drop shadow — single-step pixel offset matching the
   *  CSS `text-shadow: 2px 2px 0 #000` look the HTML landing used. */
  shadow?: { offsetX: number; offsetY: number; color: string };
}

/** Draw PressStart2P text at the given canvas-px size. Wraps the
 *  save/font/textAlign/textBaseline/fillStyle/fillText/restore
 *  boilerplate every per-game drawLanding / drawGameover would
 *  otherwise repeat. */
export function drawText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  opts: DrawTextOptions,
): void {
  const {
    sizePx,
    align = 'left',
    baseline = 'top',
    color,
    letterSpacing,
    shadow,
  } = opts;

  ctx.save();
  ctx.font = `${Math.round(sizePx)}px ${PRESS_START_2P}`;
  ctx.textAlign = align;
  ctx.textBaseline = baseline;
  if (letterSpacing && letterSpacing > 0) {
    // letterSpacing was added to CanvasRenderingContext2D in 2022 and
    // is supported in all evergreen browsers. Casting because TS lib
    // typings still treat it as optional in some configs.
    (ctx as CanvasRenderingContext2D & { letterSpacing?: string }).letterSpacing =
      `${letterSpacing}px`;
  }
  if (shadow) {
    ctx.fillStyle = shadow.color;
    ctx.fillText(text, x + shadow.offsetX, y + shadow.offsetY);
  }
  ctx.fillStyle = color;
  ctx.fillText(text, x, y);
  ctx.restore();
}

/** Measure PressStart2P text width without permanently mutating the
 *  ctx state. Useful for laying out keycap clusters / leaderboard
 *  columns where the width drives downstream positioning. */
export function measureText(
  ctx: CanvasRenderingContext2D,
  text: string,
  sizePx: number,
): number {
  ctx.save();
  ctx.font = `${Math.round(sizePx)}px ${PRESS_START_2P}`;
  const w = ctx.measureText(text).width;
  ctx.restore();
  return w;
}

export interface DrawKeycapOptions {
  /** Glyph height in canvas-px. Cap rect is sized to a 1.4× this for
   *  comfortable padding around single letters. SPACE / wide caps
   *  use the `wide: true` flag to override the rect width. */
  sizePx: number;
  /** Set true for wide caps (SPACE, ENTER, etc). Width auto-fits to
   *  text + horizontal padding instead of the default square shape. */
  wide?: boolean;
  /** Border stroke color. Mobile keycaps use the muted text color;
   *  classic-mode (asteroids) flips this to white. */
  borderColor: string;
  /** Letter color. */
  textColor: string;
}

/** Draw one keycap — stroked rounded rect outline + centered glyph.
 *  No fill, no drop-shadow stripe; the cap reads as a wireframe key
 *  on the cabinet's banner bg. Returns the rendered cap's bounding
 *  box so callers can chain caps in a row. */
export function drawKeycap(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  glyph: string,
  opts: DrawKeycapOptions,
): { width: number; height: number } {
  const { sizePx, wide = false, borderColor, textColor } = opts;

  // Cap dimensions — square for single glyphs, auto-fit for wide.
  const padX = wide ? Math.max(8, sizePx * 0.9) : Math.max(4, sizePx * 0.4);
  const glyphWidth = measureText(ctx, glyph, sizePx);
  const capW = wide ? glyphWidth + padX * 2 : Math.round(sizePx * 1.4);
  const capH = Math.round(sizePx * 1.4);
  const radius = Math.max(2, Math.round(sizePx * 0.12));

  ctx.save();
  ctx.strokeStyle = borderColor;
  ctx.lineWidth = 1.5;
  roundedRect(ctx, x, y, capW, capH, radius);
  ctx.stroke();

  // Glyph centered in cap
  drawText(ctx, glyph, x + capW / 2, y + capH / 2, {
    sizePx,
    align: 'center',
    baseline: 'middle',
    color: textColor,
  });

  ctx.restore();

  return { width: capW, height: capH };
}

/** Filled rounded rectangle path (no fill / stroke — caller decides). */
export function roundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
): void {
  const rad = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + rad, y);
  ctx.lineTo(x + w - rad, y);
  ctx.arcTo(x + w, y, x + w, y + rad, rad);
  ctx.lineTo(x + w, y + h - rad);
  ctx.arcTo(x + w, y + h, x + w - rad, y + h, rad);
  ctx.lineTo(x + rad, y + h);
  ctx.arcTo(x, y + h, x, y + h - rad, rad);
  ctx.lineTo(x, y + rad);
  ctx.arcTo(x, y, x + rad, y, rad);
  ctx.closePath();
}

export interface BannerRingSpec {
  /** Stripe width in canvas-px. */
  width: number;
  /** Stripe color. */
  color: string;
}

/** Draw concentric banner ring borders inside the given bounds.
 *  Mirrors the chunky `box-shadow: 0 0 0 6px yellow, 0 0 0 12px bg,
 *  0 0 0 18px pink, ...` ring stack from the deleted HTML banner.
 *  Rings are painted from OUTERMOST to innermost; pass them in that
 *  order. The total ring stack width is the sum of `width`s.
 *
 *  Bounds describe the OUTER rectangle (the outside of the outermost
 *  ring); the inner content area is `bounds` shrunk by the total
 *  ring width on each side. */
export function drawBannerRings(
  ctx: CanvasRenderingContext2D,
  bounds: { x: number; y: number; w: number; h: number },
  rings: ReadonlyArray<BannerRingSpec>,
): void {
  let inset = 0;
  for (const ring of rings) {
    const rx = bounds.x + inset;
    const ry = bounds.y + inset;
    const rw = bounds.w - inset * 2;
    const rh = bounds.h - inset * 2;
    if (rw <= 0 || rh <= 0) break;
    ctx.fillStyle = ring.color;
    ctx.fillRect(rx, ry, rw, ring.width);                      // top
    ctx.fillRect(rx, ry + rh - ring.width, rw, ring.width);    // bottom
    ctx.fillRect(rx, ry, ring.width, rh);                      // left
    ctx.fillRect(rx + rw - ring.width, ry, ring.width, rh);    // right
    inset += ring.width;
  }
}

export interface PauseMenuItemSpec {
  /** Discriminator the consumer uses to decide what to do on confirm
   *  — the draw helper only cares about `label`. Mirrors `PauseMenuItem`
   *  from `arcadeFrame.ts` but we accept the wider shape so we don't
   *  re-import the union here. */
  id: string;
  label: string;
}

export interface DrawPauseMenuOptions {
  /** Canvas size in canvas-px (post-DPR). Used to size the dim layer
   *  and center the menu. The renderer caller is expected to have its
   *  transform already in canvas-px space (HUD-style — same place
   *  drawScore / drawLives paint), not world coordinates. */
  canvasW: number;
  canvasH: number;
  items: ReadonlyArray<PauseMenuItemSpec>;
  /** Index into `items` of the currently-selected row. Caret (▶)
   *  paints to the LEFT of this row's label. */
  selectedIndex: number;
  /** Color of the selected row's caret + label. Pull from the per-game
   *  palette so the menu matches the cabinet (asteroids: yellow;
   *  space-barrage: cyan). */
  accentColor: string;
  /** Color of unselected rows. Typically the palette's muted text color. */
  mutedColor: string;
  /** Color of the "PAUSED" headline. Typically the palette's primary
   *  text color (white-ish). */
  headlineColor: string;
  /** Drop-shadow color used by the headline + selected row, matched
   *  to the cabinet bg so text reads cleanly over the dim layer. */
  shadowColor: string;
}

/** Paint the pause-menu overlay on top of whatever's already drawn —
 *  caller paints the frozen game frame underneath; this helper adds
 *  a translucent black dim layer + the menu chrome.
 *
 *  Layout (vertical):
 *    1. Translucent black `rgba(0,0,0,0.6)` covering the full canvas.
 *    2. "PAUSED" headline at `0.36 × canvasH`, sized `0.10 × canvasH`
 *       (floor 32 px) — large, primary-text color, drop-shadowed.
 *    3. Item rows starting at `0.55 × canvasH`, each row `0.07 × canvasH`
 *       tall (floor 22 px). Selected row paints a `▶` caret one
 *       row-height to the left of the label and uses the accent color;
 *       unselected rows use the muted color and skip the caret.
 *    4. Hint line at `0.84 × canvasH` — small (`0.025 × canvasH`,
 *       floor 9 px), muted, "↑↓ MOVE   FIRE SELECT".
 *
 *  No banner-rings, no leaderboard-style chrome — the pause menu is
 *  intentionally spare so it reads as a system overlay rather than
 *  another in-game screen. */
export function drawPauseMenu(
  ctx: CanvasRenderingContext2D,
  opts: DrawPauseMenuOptions,
): void {
  const {
    canvasW, canvasH,
    items, selectedIndex,
    accentColor, mutedColor, headlineColor, shadowColor,
  } = opts;

  // --- Dim layer ----------------------------------------------------------
  ctx.save();
  ctx.fillStyle = 'rgba(0, 0, 0, 0.62)';
  ctx.fillRect(0, 0, canvasW, canvasH);
  ctx.restore();

  // --- Headline -----------------------------------------------------------
  const headlineSize = Math.max(32, Math.round(canvasH * 0.10));
  drawText(ctx, 'PAUSED', canvasW / 2, canvasH * 0.36, {
    sizePx: headlineSize,
    align: 'center',
    color: headlineColor,
    shadow: { offsetX: 3, offsetY: 3, color: shadowColor },
  });

  // --- Items --------------------------------------------------------------
  const itemSize = Math.max(22, Math.round(canvasH * 0.07));
  const rowH = Math.round(itemSize * 1.5);
  const itemsTop = canvasH * 0.55;
  // Pre-measure the widest label so the caret can sit a constant
  // visual gap to the LEFT of the leftmost label edge — even though
  // labels are center-aligned, the caret hangs off the left side of
  // the visual block (not the canvas centerline). Keeps multi-item
  // menus tidy when label widths differ.
  const widest = items.reduce((max, it) => {
    const w = measureText(ctx, it.label, itemSize);
    return w > max ? w : max;
  }, 0);
  // Caret is right-aligned so its RIGHT edge sits exactly `caretGap`
  // to the left of the labels. Without right-align, the caret was
  // drawn LEFT-aligned at caretX — meaning its full glyph width
  // extended right into the label, clipping into "CONTINUE". Right-
  // aligned anchoring removes the glyph-width unknown from the
  // spacing math: gap is exactly `caretGap` pixels of clear air
  // regardless of how the font measures the caret glyph.
  const caretGap = Math.round(itemSize * 0.7);
  const labelLeft = canvasW / 2 - widest / 2;
  const caretRight = labelLeft - caretGap;

  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    const y = itemsTop + i * rowH;
    const isSelected = i === selectedIndex;
    const color = isSelected ? accentColor : mutedColor;
    drawText(ctx, item.label, canvasW / 2, y, {
      sizePx: itemSize,
      align: 'center',
      color,
      shadow: isSelected
        ? { offsetX: 2, offsetY: 2, color: shadowColor }
        : undefined,
    });
    if (isSelected) {
      // Right-pointing caret rendered as a glyph rather than a
      // stroked path — keeps the rendering pipeline a single
      // PressStart2P call and matches the chunky pixel aesthetic of
      // the rest of the cabinet UI.
      drawText(ctx, '▶', caretRight, y, {
        sizePx: itemSize,
        align: 'right',
        color: accentColor,
      });
    }
  }

  // --- Hint line ----------------------------------------------------------
  const hintSize = Math.max(9, Math.round(canvasH * 0.025));
  drawText(ctx, '↑↓ MOVE   FIRE SELECT', canvasW / 2, canvasH * 0.84, {
    sizePx: hintSize,
    align: 'center',
    color: mutedColor,
  });
}

export interface LeaderboardRowOptions {
  rank: number;
  name: string;
  score: number;
  /** Font size in canvas-px (applied uniformly to rank/name/dots/score). */
  sizePx: number;
  /** Highlight a row (e.g. the player's just-submitted entry) — paints
   *  a subtle background fill behind the whole row. Pass undefined to
   *  skip. */
  highlightColor?: string;
  /** Color for the rank cell ("1.", "2."…). */
  rankColor: string;
  /** Color for the name cell. */
  nameColor: string;
  /** Color for the leader-dots filler. */
  dotsColor: string;
  /** Color for the score cell. */
  scoreColor: string;
}

/** Draw one leaderboard row inside the given x-range. Format:
 *  `[rank]  [name]   ........  [score]` with the dots filling the
 *  variable middle gap. Returns the row's bottom y so callers can
 *  stack rows vertically. */
export function drawLeaderboardRow(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  opts: LeaderboardRowOptions,
): number {
  const {
    rank, name, score, sizePx,
    highlightColor, rankColor, nameColor, dotsColor, scoreColor,
  } = opts;
  const rowH = Math.round(sizePx * 1.6);

  if (highlightColor) {
    ctx.save();
    ctx.fillStyle = highlightColor;
    ctx.fillRect(x, y, w, rowH);
    ctx.restore();
  }

  const padX = Math.round(sizePx * 0.6);
  const rankText = `${rank}`.padStart(2, '0');
  const scoreText = `${score}`;
  const rankW = measureText(ctx, rankText, sizePx);
  const nameW = measureText(ctx, name, sizePx);
  const scoreW = measureText(ctx, scoreText, sizePx);
  const gap = Math.round(sizePx * 0.6);

  // Left to right: rank, gap, name, gap, dots..., score (right-aligned).
  let cx = x + padX;
  const baseY = y + rowH / 2;

  drawText(ctx, rankText, cx, baseY, {
    sizePx, align: 'left', baseline: 'middle', color: rankColor,
  });
  cx += rankW + gap;

  drawText(ctx, name, cx, baseY, {
    sizePx, align: 'left', baseline: 'middle', color: nameColor,
  });
  cx += nameW + gap;

  // Score on the right
  const scoreX = x + w - padX;
  drawText(ctx, scoreText, scoreX, baseY, {
    sizePx, align: 'right', baseline: 'middle', color: scoreColor,
  });

  // Dotted leader fills the middle gap
  const dotsLeft = cx;
  const dotsRight = scoreX - scoreW - gap;
  if (dotsRight > dotsLeft) {
    const dotChar = '.';
    const dotW = measureText(ctx, dotChar, sizePx);
    const dotCount = Math.max(0, Math.floor((dotsRight - dotsLeft) / dotW));
    if (dotCount > 0) {
      drawText(ctx, dotChar.repeat(dotCount), dotsLeft, baseY, {
        sizePx, align: 'left', baseline: 'middle', color: dotsColor,
      });
    }
  }

  return y + rowH;
}
