// web/app/arcade/space-barrage/_game/cabinetUI.ts
//
// Space Barrage's per-game cabinet UI configuration. Consumed by the
// renderer's `drawLanding` and `drawGameover` (Stage 3) to paint
// title-screen + game-over content into the unified canvas. Sister
// to `arcade/asteroids/_game/cabinetUI.ts`.
//
// The animated ship preview reads the same sprite tables the deleted
// HTML LandingScreen used (11×13 grid: 11×11 ship + 2-row flame trail)
// and toggles between FRAME_A / FRAME_B at the same 80ms cadence so
// the canvas-driven preview reads identical to its CSS predecessor.
//
// Why inline the sprite tables here rather than reuse the engine's
// drawPixelShip? The engine version reads `getShipVariant()` (active
// only — no parameterization) and draws without the flame trail row,
// because in-game the flame is positioned dynamically below the ship
// based on velocity. The picker preview wants both variants drivable
// by index, with the static flame row baked into the sprite.

import { colors, type CabinetUIConfig } from '@arcade';
import {
  SHIP_VARIANTS,
  getShipVariant,
  type ShipVariant,
} from './shipVariant';

// ---- Sprite tables ---------------------------------------------------------
// Mirror of the HTML LandingScreen tables. 11 cols × 13 rows: ship
// (11×11) on top, then a 2-row flame trail. Flame chars (F/I/M/P)
// are uppercase to avoid collision with ship chars (b/h/c/e/y/w/p/g/d).
//   F = yellow flame, I = white-hot core, M = pink mid, P = coral tail

const CLASSIC_FRAME_A = [
  '.....b.....',
  '....bhb....',
  '....byb....',
  '...cbybc...',
  '..cebwbec..',
  '.ccebbbecc.',
  '.ccbbbbbcc.',
  'ccebbbbbecc',
  'cccbbbbbccc',
  '....bbb....',
  '....p.p....',
  '....FIF....',
  '.....M.....',
];
const CLASSIC_FRAME_B = [
  '.....b.....',
  '....bhb....',
  '....byb....',
  '...cbybc...',
  '..cebwbec..',
  '.ccebbbecc.',
  '.ccbbbbbcc.',
  'ccebbbbbecc',
  'cccbbbbbccc',
  '....bbb....',
  '....g.g....',
  '....MFM....',
  '.....P.....',
];
const ROCKET_FRAME_A = [
  '.....b.....',
  '....bdb....',
  '....bwb....',
  '...bdwdb...',
  '...bdydb...',
  '...bdwdb...',
  '...bbdbb...',
  '..b.bbb.b..',
  'bbddbdbddbb',
  'bbb.bbb.bbb',
  '....p.p....',
  '....FIF....',
  '.....M.....',
];
const ROCKET_FRAME_B = [
  '.....b.....',
  '....bdb....',
  '....bwb....',
  '...bdwdb...',
  '...bdydb...',
  '...bdwdb...',
  '...bbdbb...',
  '..b.bbb.b..',
  'bbddbdbddbb',
  'bbb.bbb.bbb',
  '....g.g....',
  '....MFM....',
  '.....P.....',
];

const FRAMES: Record<ShipVariant, [readonly string[], readonly string[]]> = {
  classic: [CLASSIC_FRAME_A, CLASSIC_FRAME_B],
  rocket: [ROCKET_FRAME_A, ROCKET_FRAME_B],
};

const SPRITE_COLS = CLASSIC_FRAME_A[0].length; // 11
const SPRITE_ROWS = CLASSIC_FRAME_A.length;    // 13

// Cell flicker cadence — matches the deleted HTML LandingScreen's
// `setInterval(setFrame, 80)`. 80ms ≈ 12.5 fps; a bit slower than the
// engine's in-game 120ms ship flicker so the picker reads as a
// gentler attract-mode animation.
const FRAME_CADENCE_MS = 80;

function spriteColor(variant: ShipVariant, ch: string): string | null {
  // Flame chars are shared across variants.
  switch (ch) {
    case 'F': return colors.accent.yellow;
    case 'I': return colors.text.primary;       // white-hot core
    case 'M': return colors.accent.pink;
    case 'P': return colors.accent.coral;
  }
  if (variant === 'classic') {
    switch (ch) {
      case 'b': return colors.neutral.darkGray;
      case 'h': return colors.primary.light;
      case 'c': return colors.primary.dark;
      case 'e': return colors.primary.main;
      case 'y': return colors.accent.pink;
      case 'w': return colors.neutral.lightGray;
      case 'p': return colors.accent.coral;
      case 'g': return colors.accent.yellow;
      default: return null;
    }
  }
  // rocket
  switch (ch) {
    case 'b': return colors.primary.main;
    case 'd': return colors.primary.dark;
    case 'y': return colors.accent.yellow;
    case 'w': return colors.neutral.lightGray;
    case 'p': return colors.accent.coral;
    case 'g': return colors.accent.pink;
    default: return null;
  }
}

// ---- Preview drawer factory -----------------------------------------------
// Closure-state factory mirrors asteroids' pattern. Module-scope
// singleton — fine because there's only one space-barrage cabinet
// mounted at a time. The closure tracks `startedAt` so the flicker
// cadence is stable regardless of when the renderer first calls in.

function createShipPreviewDrawer(): CabinetUIConfig['landing']['picker']['drawPreview'] {
  let startedAt = -1;

  return (ctx, bounds, ts, index) => {
    if (startedAt < 0) startedAt = ts;
    const elapsed = ts - startedAt;
    const variant = SHIP_VARIANTS[index] ?? SHIP_VARIANTS[0];
    const frameIdx = Math.floor(elapsed / FRAME_CADENCE_MS) % 2;
    const rows = FRAMES[variant][frameIdx];

    // Fit the 11×13 grid into bounds, preserving square cells. Center
    // both axes so the sprite reads as floating in the picker rect.
    const cell = Math.floor(Math.min(bounds.w / SPRITE_COLS, bounds.h / SPRITE_ROWS));
    if (cell <= 0) return;
    const gridW = cell * SPRITE_COLS;
    const gridH = cell * SPRITE_ROWS;
    const offsetX = bounds.x + (bounds.w - gridW) / 2;
    const offsetY = bounds.y + (bounds.h - gridH) / 2;

    ctx.save();
    for (let r = 0; r < SPRITE_ROWS; r++) {
      const row = rows[r];
      for (let c = 0; c < SPRITE_COLS; c++) {
        const ch = row[c];
        if (ch === '.') continue;
        const color = spriteColor(variant, ch);
        if (!color) continue;
        ctx.fillStyle = color;
        ctx.fillRect(offsetX + c * cell, offsetY + r * cell, cell, cell);
      }
    }
    ctx.restore();
  };
}

const drawSpaceBarrageShipPreview = createShipPreviewDrawer();

// ---- Config object ---------------------------------------------------------

export const spaceBarrageCabinetUI: CabinetUIConfig = {
  landing: {
    // Renderer renders this as TWO STACKED LINES on canvas, splitting
    // on the space — matches the HTML LandingScreen's "SPACE / BARRAGE"
    // layout. "SPACE BARRAGE" on a single line at asteroids' 0.06×banner
    // ratio overflows on phone-sized cabinets (13 chars vs ASTEROIDS'
    // 9), and shrinking the title on small viewports felt worse than
    // just stacking it.
    title: 'SPACE BARRAGE',
    promptDesktop: 'PRESS SPACE',
    promptMobile: 'PRESS FIRE',
    attribution: { name: 'DANGERVALENTINE', year: 2026 },
    picker: {
      label: 'SHIP',
      count: () => SHIP_VARIANTS.length,
      currentIndex: () =>
        Math.max(0, SHIP_VARIANTS.indexOf(getShipVariant())),
      drawPreview: drawSpaceBarrageShipPreview,
    },
    // No HYPER sublabel — space-barrage doesn't have a hyperspace move;
    // the only inputs are MOVE (W + ASD) and FIRE (Space).
    hints: [
      { label: 'MOVE', cluster: [['W'], ['A', 'S', 'D']] },
      { label: 'FIRE', cluster: [['SPACE']] },
    ],
  },
  gameover: {
    title: 'GAME OVER',
  },
  gameoverReveal: {
    label: 'FINAL SCORE',
    subPrompt: '',
  },
  gameoverBoard: {
    rankPrefix: 'YOUR RANK',
    todaysBestPrefix: "TODAY'S BEST",
    setUsernamePrompt: 'SET A USERNAME TO CLAIM YOUR SPOT',
    saveFailedPrompt: "COULDN'T SAVE SCORE — TRY AGAIN ON NEXT RUN",
    continuePrompt: 'PRESS FIRE TO CONTINUE',
  },
  // Position-only hint — no longer a clickable rect overlay. The
  // renderer paints "▲ FULL LEADERBOARD" at this design-space center.
  // designWidth/designHeight retained for type compatibility but
  // unused now that the React layer doesn't paint a tap-target Link.
  landingScoresTapTarget: {
    designCenterX: 540,
    designCenterY: 700,
    designWidth: 0,
    designHeight: 0,
    label: '▲ FULL LEADERBOARD',
  },
};
