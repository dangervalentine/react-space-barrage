import { GameState, GAME_WIDTH, GAME_HEIGHT } from './types';
import {
  colors,
  drawBannerRings,
  drawHudLives,
  drawHudScore,
  drawKeycap,
  drawLeaderboardRow,
  drawPauseMenu,
  drawText,
  measureText,
  paintNebulaBackdrop,
  type ArcadeFrame,
  type ArcadeRenderer,
  type GameoverUI,
  type LandingUI,
  type PauseUI,
} from '@arcade';
import type { LeaderboardEntry } from '@arcade';
import { spaceBarrageCabinetUI } from '../cabinetUI';
import { getShipVariant, ShipVariant } from '../shipVariant';

interface Star {
  x: number;
  size: number;
  speed: number;
  phase: number;
}

function healthToColor(health: number): string {
  if (health >= 3) return colors.accent.green;
  if (health === 2) return colors.accent.yellow;
  return colors.accent.pink;
}

// 11x7 pixel-art enemy. Char codes:
//   y = fin/top accent, b = body (health-tinted), c = wing,
//   w = cockpit highlight, g = engine glow, '.' = empty
const ENEMY_ROWS = [
  '.....y.....',
  '....yby....',
  '...ybbby...',
  '..cbbbbbc..',
  '.ccwbbbwcc.',
  'c.c.yby.c.c',
  '....g.g....',
];
const ENEMY_COLS = ENEMY_ROWS[0].length;
const ENEMY_ROW_COUNT = ENEMY_ROWS.length;

function drawPixelEnemy(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number,
  bodyColor: string,
): void {
  const cell = size / ENEMY_COLS;
  const offsetY = (size - cell * ENEMY_ROW_COUNT) / 2;
  const px = Math.ceil(cell);

  for (let r = 0; r < ENEMY_ROW_COUNT; r++) {
    const row = ENEMY_ROWS[r];
    for (let c = 0; c < ENEMY_COLS; c++) {
      const ch = row[c];
      if (ch === '.') continue;
      let color: string;
      switch (ch) {
        case 'b': color = bodyColor; break;
        case 'y': color = colors.accent.yellow; break;
        case 'c': color = colors.accent.cyan; break;
        case 'w': color = colors.text.primary; break;
        case 'g': color = colors.accent.green; break;
        default: continue;
      }
      ctx.fillStyle = color;
      ctx.fillRect(x + c * cell, y + offsetY + r * cell, px, px);
    }
  }
}

// 11x9 squid invader. Two frames flicker the tentacles between spread and tucked.
//   c = body (queued teal), p = backlog purple edge/tentacle shading,
//   e = bright eye (accent purple)
const ENEMY2_ROWS_A = [
  '....c.c....',
  '.....c.....',
  '...ccccc...',
  '..cceeecc..',
  '.ccccccccc.',
  '.pc.ccc.cp.',
  '.c.ccccc.c.',
  '.c.c...c.c.',
  'p..p...p..p',
];
const ENEMY2_ROWS_B = [
  '....c.c....',
  '.....c.....',
  '...ccccc...',
  '..cceeecc..',
  '.ccccccccc.',
  '.pc.ccc.cp.',
  '.c.ccccc.c.',
  '..ccc.ccc..',
  '.p.p...p.p.',
];
const ENEMY2_COLS = ENEMY2_ROWS_A[0].length;
const ENEMY2_ROW_COUNT = ENEMY2_ROWS_A.length;

function drawPixelEnemy2(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number,
  timestamp: number,
  isLocking: boolean,
): void {
  const rows = Math.floor(timestamp / 180) % 2 === 0 ? ENEMY2_ROWS_A : ENEMY2_ROWS_B;
  const cell = size / ENEMY2_COLS;
  const offsetY = (size - cell * ENEMY2_ROW_COUNT) / 2;
  const px = Math.ceil(cell);
  const eyeColor = isLocking ? colors.accent.yellow : colors.accent.purple;

  for (let r = 0; r < ENEMY2_ROW_COUNT; r++) {
    const row = rows[r];
    for (let c = 0; c < ENEMY2_COLS; c++) {
      const ch = row[c];
      if (ch === '.') continue;
      let color: string;
      switch (ch) {
        case 'c': color = colors.status.queued; break;
        case 'p': color = colors.status.backlog; break;
        case 'e': color = eyeColor; break;
        default: continue;
      }
      ctx.fillStyle = color;
      ctx.fillRect(x + c * cell, y + offsetY + r * cell, px, px);
    }
  }
}

// Two 11x11 player ship variants. The active one is selected per-frame from
// the shipVariant module (chosen on the landing screen).

// Classic interceptor. Codes:
//   b = body (dark), h = body highlight (light blue),
//   c = wing (deep blue), e = wing inner edge (bright blue),
//   y = cockpit (pink), w = cockpit highlight (white),
//   p = engine port (coral), g = engine glow (yellow, swapped with flame frame)
const CLASSIC_SHIP_ROWS_A = [
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
];
const CLASSIC_SHIP_ROWS_B = [
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
];

// Rocket. Codes:
//   b = body (soft blue), d = body shadow/edge (deep blue),
//   y = cockpit window (yellow), w = window highlight (white),
//   p = engine port (coral), g = engine glow (pink, swapped per frame)
const ROCKET_SHIP_ROWS_A = [
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
];
const ROCKET_SHIP_ROWS_B = [
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
];

const SHIP_COLS = CLASSIC_SHIP_ROWS_A[0].length;
const SHIP_ROW_COUNT = CLASSIC_SHIP_ROWS_A.length;

function shipColor(variant: ShipVariant, ch: string): string | null {
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

function drawPixelShip(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number,
  timestamp: number,
): void {
  const flicker = Math.floor(timestamp / 120) % 2 === 0;
  const variant: ShipVariant = getShipVariant();
  const rows = variant === 'classic'
    ? (flicker ? CLASSIC_SHIP_ROWS_A : CLASSIC_SHIP_ROWS_B)
    : (flicker ? ROCKET_SHIP_ROWS_A : ROCKET_SHIP_ROWS_B);
  const cell = size / SHIP_COLS;
  const offsetY = (size - cell * SHIP_ROW_COUNT) / 2;
  const px = Math.ceil(cell);

  for (let r = 0; r < SHIP_ROW_COUNT; r++) {
    const row = rows[r];
    for (let c = 0; c < SHIP_COLS; c++) {
      const ch = row[c];
      if (ch === '.') continue;
      const color = shipColor(variant, ch);
      if (!color) continue;
      ctx.fillStyle = color;
      ctx.fillRect(x + c * cell, y + offsetY + r * cell, px, px);
    }
  }
}

// 5-col x 4-row flame plume below ship. Drawn at ship's cell size for
// consistent pixel scale across all sprites. Codes:
//   p = coral outer, g = pink mid, y = yellow core, w = white-hot center
const FLAME_ROWS_A = [
  'ywy',
  '.g.',
];
const FLAME_ROWS_B = [
  'gyg',
  '.p.',
];
const FLAME_COLS = FLAME_ROWS_A[0].length;
const FLAME_ROW_COUNT = FLAME_ROWS_A.length;

function drawPixelFlame(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  cell: number,
  timestamp: number,
): void {
  const rows = Math.floor(timestamp / 80) % 2 === 0 ? FLAME_ROWS_A : FLAME_ROWS_B;
  const px = Math.ceil(cell);

  for (let r = 0; r < FLAME_ROW_COUNT; r++) {
    const row = rows[r];
    for (let c = 0; c < FLAME_COLS; c++) {
      const ch = row[c];
      if (ch === '.') continue;
      let color: string;
      switch (ch) {
        case 'p': color = colors.accent.coral; break;
        case 'g': color = colors.accent.pink; break;
        case 'y': color = colors.accent.yellow; break;
        case 'w': color = colors.text.primary; break;
        default: continue;
      }
      ctx.fillStyle = color;
      ctx.fillRect(x + c * cell, y + r * cell, px, px);
    }
  }
}

// 11x11 bomb. Codes:
//   B = body (steel), d = shadow rim, w = chrome highlight,
//   f = fuse, s = spark glow, h = spark hot core
const BOMB_ROWS_A = [
  '.....f.....',
  '.....h.....',
  '....sss....',
  '...dBBBd...',
  '..dBBBBBd..',
  '.dBBwBBBBd.',
  '.dBBBBBBBd.',
  '.dBBBBBBBd.',
  '..dBBBBBd..',
  '...dBBBd...',
  '....ddd....',
];
const BOMB_ROWS_B = [
  '.....f.....',
  '....s.s....',
  '...s.h.s...',
  '...dBBBd...',
  '..dBBBBBd..',
  '.dBBwBBBBd.',
  '.dBBBBBBBd.',
  '.dBBBBBBBd.',
  '..dBBBBBd..',
  '...dBBBd...',
  '....ddd....',
];
const BOMB_COLS = BOMB_ROWS_A[0].length;
const BOMB_ROW_COUNT = BOMB_ROWS_A.length;

function drawPixelShield(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number,
  timestamp: number,
): void {
  const rows = Math.floor(timestamp / 100) % 2 === 0 ? BOMB_ROWS_A : BOMB_ROWS_B;
  const cell = size / BOMB_COLS;
  const offsetY = (size - cell * BOMB_ROW_COUNT) / 2;
  const px = Math.ceil(cell);

  for (let r = 0; r < BOMB_ROW_COUNT; r++) {
    const row = rows[r];
    for (let c = 0; c < BOMB_COLS; c++) {
      const ch = row[c];
      if (ch === '.') continue;
      let color: string;
      switch (ch) {
        case 'B': color = colors.secondary.main; break;
        case 'd': color = colors.secondary.dark; break;
        case 'w': color = colors.neutral.lightGray; break;
        case 'f': color = colors.accent.coral; break;
        case 's': color = colors.accent.yellow; break;
        case 'h': color = colors.text.primary; break;
        default: continue;
      }
      ctx.fillStyle = color;
      ctx.fillRect(x + c * cell, y + offsetY + r * cell, px, px);
    }
  }
}

/** In-game aurora is dialed back so it never fights the pixel-art
 *  ship/enemy silhouettes. Mirrors the asteroids-side constant by name
 *  and value so the two games' play fields read as the same world. */
const IN_GAME_AURORA_OPACITY = 0.5;

export class Renderer implements ArcadeRenderer<GameState> {
  private ctx: CanvasRenderingContext2D;
  private stars: Star[];
  private scaleX = 1;
  private scaleY = 1;
  // CRT-style quantization. 0 on either axis disables that axis.
  private pixelStep = 4;
  private timeStepMs = 60;
  /** Cached aurora backdrop painted at design-coord resolution. Built
   *  lazily on first paint and reused indefinitely (world dims are
   *  fixed at GAME_WIDTH × GAME_HEIGHT). */
  private bgCache: HTMLCanvasElement | null = null;

  /**
   * Server-backed leaderboard entries. Set by the Game component after
   * fetchLeaderboard resolves (and on gameover submit). Both
   * drawLandingScoresView and drawGameoverBoard read from this ref so the
   * renderer is always painting the most current data without needing a
   * re-init. Null = not yet fetched (mocks will have been padded in by the
   * Game layer before the first scores view is shown).
   */
  public boardEntriesRef: { current: LeaderboardEntry[] | null } = { current: null };

  constructor(canvas: HTMLCanvasElement) {
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Failed to get canvas context');
    this.ctx = ctx;
    this.stars = this.generateStars();
  }

  setRetroSteps(pixelStep: number, timeStepMs: number): void {
    this.pixelStep = Math.max(0, pixelStep);
    this.timeStepMs = Math.max(0, timeStepMs);
  }

  private snap(v: number): number {
    return this.pixelStep > 0 ? Math.round(v / this.pixelStep) * this.pixelStep : v;
  }

  private snapTime(t: number): number {
    return this.timeStepMs > 0 ? Math.floor(t / this.timeStepMs) * this.timeStepMs : t;
  }

  private generateStars(): Star[] {
    const stars: Star[] = [];
    const speeds = [80, 120, 170];
    const sizes = [1, 2, 3];

    for (let i = 0; i < 10; i++) {
      for (let s = 0; s < 3; s++) {
        stars.push({
          x: Math.random() * GAME_WIDTH,
          size: sizes[s],
          speed: speeds[s],
          phase: Math.random() * 1050,
        });
      }
    }
    return stars;
  }

  resize(width: number, height: number): void {
    const canvas = this.ctx.canvas;
    canvas.width = width;
    canvas.height = height;
    this.scaleX = width / GAME_WIDTH;
    this.scaleY = height / GAME_HEIGHT;
  }

  /** Hard-clear the canvas with the opaque base bg + nebula. Called
   *  by the per-game adapter when starting a fresh session so the
   *  first new playing frame doesn't paint over the last paused-menu
   *  / landing-banner content. Space-barrage's `drawPlaying` already
   *  opaque-clears each frame (unlike asteroids' trail-fade), so this
   *  is mostly defensive — but it ensures a clean baseline if a
   *  future change introduces partial-opacity compositing here. */
  prepareForFreshSession(): void {
    const canvas = this.ctx.canvas;
    if (canvas.width <= 0 || canvas.height <= 0) return;
    const ctx = this.ctx;
    ctx.save();
    ctx.scale(this.scaleX, this.scaleY);
    ctx.fillStyle = colors.background.base;
    ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
    this.drawNebula();
    ctx.restore();
  }

  /** Public entry point matching `ArcadeRenderer<GameState>`. Dispatches
   *  by `frame.mode`:
   *    - `playing`  → per-tick game render (`drawPlaying`).
   *    - `landing`  → title / scores attract overlay (Stage 3).
   *    - `gameover` → frozen game backdrop + dim + initials banner
   *                   (Stage 3). Reads `frame.game` as the frozen
   *                   last gameplay frame. */
  drawFrame(frame: ArcadeFrame<GameState>, timestamp: number): void {
    switch (frame.mode) {
      case 'playing':
        this.drawPlaying(frame.game, timestamp);
        return;
      case 'landing':
        if (frame.ui.mode === 'landing') {
          this.drawLanding(frame.ui, timestamp);
        }
        return;
      case 'paused':
        if (frame.ui.mode === 'paused') {
          this.drawPaused(frame.ui, timestamp, frame.game);
        }
        return;
      case 'gameover':
        if (frame.ui.mode === 'gameover') {
          this.drawGameover(frame.ui, timestamp, frame.game);
        }
        return;
    }
  }

  /** Render the pause-menu overlay. Backdrop is the frozen last
   *  gameplay frame (engine has been told to pause, so no fresh
   *  emissions arrive — the per-game adapter's self-RAF carries the
   *  same state forward into each PauseUI envelope). On top of that
   *  backdrop, `drawPauseMenu` paints a translucent dim layer + the
   *  PAUSED headline + items. Space-barrage uses cyan as its accent
   *  to match the marquee + cabinet treatment. */
  private drawPaused(ui: PauseUI, ts: number, gameState: GameState): void {
    const w = this.ctx.canvas.width;
    const h = this.ctx.canvas.height;
    if (w <= 0 || h <= 0) return;
    // Repaint the frozen game frame as backdrop.
    this.drawPlaying(gameState, ts);
    drawPauseMenu(this.ctx, {
      canvasW: w,
      canvasH: h,
      items: ui.items,
      selectedIndex: ui.selectedIndex,
      accentColor: colors.accent.cyan,
      mutedColor: colors.text.muted,
      headlineColor: colors.text.primary,
      shadowColor: colors.background.base,
    });
  }

  /** Per-tick game render. Was the whole `draw(state, ts)` body
   *  pre-Stage-1A; now invoked from `drawFrame` when
   *  `frame.mode === 'playing'`. Private — every caller goes through
   *  `drawFrame`. */
  private drawPlaying(state: GameState, timestamp: number): void {
    const ctx = this.ctx;
    const tStep = this.snapTime(timestamp);

    ctx.save();
    ctx.scale(this.scaleX, this.scaleY);

    // Background
    ctx.fillStyle = colors.background.base;
    ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

    // Nebula gradient — keep smooth (slow drift, looks bad if stepped)
    this.drawNebula();

    // Stars
    this.drawStars(tStep);

    // Shields
    state.shields.forEach(shield => this.drawShield(shield, tStep));

    // Enemies
    state.enemies.forEach(enemy => this.drawEnemy(enemy, tStep));

    // Bullets
    state.bullets.forEach(bullet => this.drawBullet(bullet));

    // Particles
    state.particles.forEach(particle => this.drawParticle(particle));

    // Ship
    this.drawShip(state, tStep);

    // (HUD draws in canvas-px space — see below, after ctx.restore.)

    // Game Over overlay used to live here, gated on `state.isShipHit`.
    // Stage 3 deletes it: the dedicated `drawGameover` mode now owns
    // the entire game-over presentation (frozen backdrop + dim + banner
    // + initials entry), and `drawPlaying` is also called from inside
    // `drawGameover` to paint that frozen backdrop. Re-painting an
    // in-game GAME OVER overlay there would fight the new dim layer
    // and the banner.

    ctx.restore();

    // HUD draws in canvas-px space (post-restore) so the shared
    // HUD helpers receive a real canvas-pixel width — same coord
    // convention asteroids' drawHud uses. Drawing inside the scaled
    // block multiplies the font through the world→canvas scale and
    // yields a tile-tiny HUD on small previews.
    this.drawScore(state);
    this.drawLives(state, tStep);
  }

  /** Paint the cached asteroids-style aurora nebula at design-coord
   *  resolution. The cache is built once on first call (world dims are
   *  fixed) and blitted thereafter — same approach asteroids uses for
   *  its bgCache. Replaces the old drifting blue gradient so both
   *  games share the same atmospheric world. */
  private drawNebula(): void {
    if (!this.bgCache) {
      this.bgCache = this.buildBackdrop();
    }
    this.ctx.drawImage(this.bgCache, 0, 0, GAME_WIDTH, GAME_HEIGHT);
  }

  /** Render the static aurora backdrop into an offscreen canvas at 2×
   *  design-coord resolution so stars stay crisp on hi-DPI displays. */
  private buildBackdrop(): HTMLCanvasElement {
    const SCALE = 2;
    const c = document.createElement('canvas');
    c.width = GAME_WIDTH * SCALE;
    c.height = GAME_HEIGHT * SCALE;
    const g = c.getContext('2d');
    if (!g) return c;
    g.scale(SCALE, SCALE);
    paintNebulaBackdrop(g, GAME_WIDTH, GAME_HEIGHT, {
      auroraOpacity: IN_GAME_AURORA_OPACITY,
    });
    return c;
  }

  private drawStars(timestamp: number): void {
    const ctx = this.ctx;
    ctx.fillStyle = colors.accent.cyan;

    this.stars.forEach(star => {
      const y = ((timestamp / 1000) * star.speed + star.phase) % 1050 - 100;
      ctx.fillRect(this.snap(star.x), this.snap(y), star.size, star.size);
    });
  }

  private drawShield(shield: { x: number; y: number; startTime: number; duration: number }, timestamp: number): void {
    const ctx = this.ctx;
    const elapsed = (timestamp - shield.startTime) % 1500;
    const pulseFactor = 1 + 0.1 * Math.sin((elapsed / 1500) * Math.PI * 2);

    ctx.save();
    ctx.shadowColor = colors.accent.yellow;
    ctx.shadowBlur = 3 + 2 * Math.sin((elapsed / 1500) * Math.PI * 2);

    ctx.translate(this.snap(shield.x), this.snap(shield.y));
    ctx.scale(pulseFactor, pulseFactor);
    drawPixelShield(ctx, -30, -30, 60, timestamp);
    ctx.restore();
  }

  private drawEnemy(enemy: { x: number; y: number; imageIndex: number; health: number; removedAt?: number; lastHitAt?: number; lockOnAt?: number; phase?: 'hunt' | 'dive' }, timestamp: number): void {
    const ctx = this.ctx;
    const isSquid = enemy.imageIndex === 1;
    const isLocking =
      isSquid && enemy.phase === 'hunt' && enemy.lockOnAt != null && timestamp - enemy.lockOnAt < 180;
    const tint = isSquid ? colors.status.queued : healthToColor(enemy.health);
    const drawSprite = (dx: number, dy: number) => {
      if (isSquid) drawPixelEnemy2(ctx, dx, dy, 80, timestamp, isLocking);
      else drawPixelEnemy(ctx, dx, dy, 80, tint);
    };
    const ex = this.snap(enemy.x);
    const ey = this.snap(enemy.y);

    if (enemy.removedAt && timestamp - enemy.removedAt < 200) {
      const progress = (timestamp - enemy.removedAt) / 200;
      const scale = 1 - progress;
      const alpha = 1 - progress;

      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.translate(ex + 40, ey + 40);
      ctx.scale(scale, scale);
      drawSprite(-40, -40);
      ctx.restore();
    } else if (!enemy.removedAt) {
      const HIT_DURATION = 250;
      const hitElapsed = enemy.lastHitAt != null ? timestamp - enemy.lastHitAt : Infinity;

      if (hitElapsed < HIT_DURATION) {
        const t = hitElapsed / HIT_DURATION;
        const pulse = Math.sin(t * Math.PI * 4) * (1 - t) * 0.18;
        const scale = 1 + pulse;

        ctx.save();
        ctx.translate(ex + 40, ey + 40);
        ctx.scale(scale, scale);
        ctx.shadowColor = tint;
        ctx.shadowBlur = 12 * (1 - t);
        drawSprite(-40, -40);
        ctx.restore();
      } else {
        drawSprite(ex, ey);
      }
    }
  }

  private drawParticle(particle: { x: number; y: number; color?: string; size?: number; createdAt: number; lifetime: number }): void {
    const ctx = this.ctx;
    const defaultCell = Math.ceil(80 / SHIP_COLS);
    const size = particle.size ?? defaultCell;
    const color = particle.color ?? colors.accent.yellow;
    const px = this.snap(particle.x);
    const py = this.snap(particle.y);

    const age = (performance.now() - particle.createdAt) / particle.lifetime;
    const alpha = Math.max(0, 1 - age);

    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.shadowColor = color;
    ctx.shadowBlur = 4;
    ctx.fillStyle = color;
    ctx.fillRect(px - size / 2, py - size / 2, size, size);
    ctx.restore();
  }

  private drawBullet(bullet: { x: number; y: number }): void {
    const ctx = this.ctx;
    const cell = Math.ceil(80 / SHIP_COLS);
    const bx = this.snap(bullet.x);
    const by = this.snap(bullet.y);

    ctx.save();
    ctx.shadowColor = colors.text.primary;
    ctx.shadowBlur = 3;
    ctx.fillStyle = colors.text.primary;
    ctx.fillRect(bx - cell / 2, by - cell / 2, cell, cell);
    ctx.restore();
  }

  private drawShip(state: GameState, timestamp: number): void {
    const ctx = this.ctx;
    const rotate = (state.velocityX / 500) * 30;
    const rotateRad = (rotate * Math.PI) / 180;

    if (state.deathAt != null) return;
    const timeSinceHit = performance.now() - state.lastHitTime;
    const isRespawning = timeSinceHit < 800;
    if (isRespawning) return;
    const isInvulnerable = timeSinceHit < 3000;
    const opacity = isInvulnerable ? Math.sin(timeSinceHit / 75) * 0.4 + 0.6 : 1;

    ctx.save();
    ctx.translate(this.snap(state.shipX), this.snap(state.shipY));
    ctx.rotate(rotateRad);
    ctx.globalAlpha = opacity;

    // Flame — uses ship's cell size for consistent pixel scale
    const shipCell = 80 / SHIP_COLS;
    drawPixelFlame(ctx, -(FLAME_COLS * shipCell) / 2, 32, shipCell, timestamp);

    // Body
    drawPixelShip(ctx, -40, -40, 80, timestamp);
    ctx.restore();
  }

  /** Score readout — top-left, number-only via the cross-game shared
   *  HUD helper. The "SCORE:" label and the separate "HI" indicator
   *  are gone (the in-cabinet leaderboard view and the bottom-of-tile
   *  TopScore both surface the high score; repeating it on the play
   *  field crowded the corner).
   *
   *  Called in canvas-px space (post-restore in drawPlaying), so we
   *  pass the real canvas width — `GAME_WIDTH` would scale the font
   *  through the world→canvas transform and produce a tile-tiny HUD
   *  on small previews. */
  private drawScore(state: GameState): void {
    drawHudScore(this.ctx, this.ctx.canvas.width, state.score, colors.accent.cyan);
  }

  /** Lives — top-right, pixel-rocket icons via the cross-game shared
   *  HUD helper. We keep the `state.lives - 1` "reserve" semantic
   *  (one ship is on the field; reserves are what you have left).
   *  Called in canvas-px space — see `drawScore` rationale. */
  private drawLives(state: GameState, timestamp: number): void {
    const reserve = Math.max(0, state.lives - 1);
    if (reserve <= 0) return;
    const ctx = this.ctx;
    drawHudLives(ctx, ctx.canvas.width, reserve, (g, x, y, size) => {
      g.save();
      g.shadowColor = colors.text.primary;
      g.shadowBlur = 4;
      drawPixelShip(g, x, y, size, timestamp);
      g.restore();
    });
  }

  // ============================================================================
  // LANDING SCREEN (Stage 3)
  // Replaces the HTML `<LandingScreen>` component with a canvas-rendered
  // attract-mode banner. Layout proportions ported from asteroids' Stage 1B
  // implementation so the two cabinets read as siblings of the same family.
  // ============================================================================

  /** Render the landing screen — atmospheric backdrop → centered banner
   *  with ring border → 2-line title → title view OR scores view. */
  private drawLanding(ui: LandingUI, timestamp: number): void {
    const ctx = this.ctx;
    const w = ctx.canvas.width;
    const h = ctx.canvas.height;
    if (w <= 0 || h <= 0) return;

    // Atmospheric backdrop — full nebula + stars at design-coord scale
    // (the gameover variant skips this and uses the frozen game frame).
    this.paintLandingBackdrop(timestamp);

    // Centered banner shell (canvas-px space). Inner content bounds
    // come back from the helper so the title / sub-views can position
    // by ratio of `ch`.
    const { bannerSize, cx, cy, cw, ch } = this.drawCabinetBanner();

    // 2-line title — split on space. "SPACE BARRAGE" overflows on phone-
    // sized cabinets at the asteroids 0.04 ratio (13 chars vs ASTEROIDS'
    // 9), so we stack the words. Title size reduced to 0.04 banner
    // (was 0.06) — visually secondary to the cabinet marquee outside
    // the canvas, which already establishes the game's identity. The
    // in-canvas title anchors the top of the banner without dominating;
    // the ship in the middle and the blinking PRESS SPACE prompt
    // below do the heavy lifting.
    const titleSize = Math.max(12, Math.round(bannerSize * 0.04));
    const lineGap = Math.round(titleSize * 1.1);
    const [line1, line2] = spaceBarrageCabinetUI.landing.title.split(' ');
    drawText(ctx, line1, cx + cw / 2, cy + ch * 0.04, {
      sizePx: titleSize,
      align: 'center',
      color: colors.accent.cyan,
    });
    drawText(ctx, line2, cx + cw / 2, cy + ch * 0.04 + lineGap, {
      sizePx: titleSize,
      align: 'center',
      color: colors.accent.cyan,
    });

    this.drawLandingTitleView(cx, cy, cw, ch, ui, timestamp, bannerSize);

    const copySize = Math.max(7, Math.round(bannerSize * 0.014));
    const { name, year } = spaceBarrageCabinetUI.landing.attribution;
    drawText(
      ctx,
      `© ${name} ${year}`,
      cx + cw / 2,
      cy + ch * 0.95,
      { sizePx: copySize, align: 'center', color: colors.text.muted },
    );
  }

  /** Draw page-nav chevrons at the outer edges of the inner content,
   *  vertically centered. ◀ on the left, ▶ on the right — together
   *  they tell the player that LEFT/RIGHT toggles between the title
   *  and scores views on the landing screen. Sits OUTSIDE the
   *  leaderboard row band (rows are inset to cw * 0.07–0.93) and
   *  outside the centered picker preview.
   *
   *  On desktop, paints small [A] / [D] keycaps ABOVE each arrow so
   *  keyboard players see which key triggers the toggle. Mobile
   *  players use joystick L/R flicks and don't need the keycap hint. */
  private drawPageNavGlyphs(
    cx: number,
    cy: number,
    cw: number,
    ch: number,
    bannerSize: number,
  ): void {
    const ctx = this.ctx;
    const isMobile = ctx.canvas.width < 600;
    const glyphSize = Math.max(14, Math.round(bannerSize * 0.04));
    const centerY = cy + ch * 0.5;
    const leftX = cx + cw * 0.04;
    const rightX = cx + cw * 0.96;

    drawText(ctx, '◀', leftX, centerY, {
      sizePx: glyphSize,
      align: 'center',
      baseline: 'middle',
      color: colors.text.muted,
    });
    drawText(ctx, '▶', rightX, centerY, {
      sizePx: glyphSize,
      align: 'center',
      baseline: 'middle',
      color: colors.text.muted,
    });

    if (!isMobile) {
      const capSize = Math.max(8, Math.round(bannerSize * 0.018));
      const capH = Math.round(capSize * 1.4);
      const capW = Math.round(capSize * 1.4);
      const arrowToCapMargin = Math.max(6, Math.round(capSize * 0.8));
      const capY = centerY - glyphSize / 2 - arrowToCapMargin - capH;
      drawKeycap(ctx, leftX - capW / 2, capY, 'A', {
        sizePx: capSize,
        wide: false,
        borderColor: colors.text.muted,
        textColor: colors.text.primary,
      });
      drawKeycap(ctx, rightX - capW / 2, capY, 'D', {
        sizePx: capSize,
        wide: false,
        borderColor: colors.text.muted,
        textColor: colors.text.primary,
      });
    }
  }

  /** Paint the full-canvas atmospheric backdrop used by the landing
   *  screen — solid bg fill + dynamic nebula + parallax stars. Wraps
   *  the ctx scale transform so existing draw helpers (which work in
   *  GAME_WIDTH/HEIGHT design-coord space) layer correctly. The
   *  gameover path skips this and uses the frozen game frame as
   *  backdrop instead. */
  private paintLandingBackdrop(timestamp: number): void {
    const ctx = this.ctx;
    ctx.save();
    ctx.scale(this.scaleX, this.scaleY);
    ctx.fillStyle = colors.background.base;
    ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
    this.drawNebula();
    this.drawStars(this.snapTime(timestamp));
    ctx.restore();
  }

  /** Paint the centered banner shell — solid bg square + 5-stripe ring
   *  border — and return its inner content bounds. Shared between
   *  landing and gameover. The caller draws the title (and any phase-
   *  specific content) into the returned bounds. Banner size is
   *  derived to take up most of the canvas (95% height capped at 85%
   *  width) so phone-sized cabinets get all 10 leaderboard rows.
   *  Mirrors asteroids' helper but uses fixed accent colors for the
   *  ring stripes — space-barrage has no scheme switcher. */
  private drawCabinetBanner(): {
    bannerSize: number;
    cx: number;
    cy: number;
    cw: number;
    ch: number;
  } {
    const ctx = this.ctx;
    const w = ctx.canvas.width;
    const h = ctx.canvas.height;

    const bannerSize = Math.min(w * 0.85, h * 0.95);
    const bannerX = (w - bannerSize) / 2;
    const bannerY = (h - bannerSize) / 2;

    // Solid banner bg — opaque so the dim overlay and frozen game
    // backdrop don't bleed through the leaderboard / initials cells.
    ctx.fillStyle = colors.background.base;
    ctx.fillRect(bannerX, bannerY, bannerSize, bannerSize);

    // 5-stripe ring border — yellow → bg → pink → bg → cyan. Same
    // chunky stack asteroids' nebula scheme uses; space-barrage's
    // accent palette already lives in the same Night Owl family so
    // the two cabinets read as siblings.
    const ringW = Math.max(2, Math.round(bannerSize * 0.012));
    drawBannerRings(
      ctx,
      { x: bannerX, y: bannerY, w: bannerSize, h: bannerSize },
      [
        { width: ringW, color: colors.accent.yellow },
        { width: ringW, color: colors.background.base },
        { width: ringW, color: colors.accent.pink },
        { width: ringW, color: colors.background.base },
        { width: ringW, color: colors.accent.cyan },
      ],
    );

    const totalRingW = ringW * 5;
    return {
      bannerSize,
      cx: bannerX + totalRingW,
      cy: bannerY + totalRingW,
      cw: bannerSize - totalRingW * 2,
      ch: bannerSize - totalRingW * 2,
    };
  }

  /** Title view — title (above, painted by drawLanding) → ship preview
   *  (true vertical center) → keycap hints just below the ship → big
   *  blinking PRESS SPACE/FIRE prompt → copyright (below, painted by
   *  drawLanding). The five elements form a centered group with the
   *  ship anchoring the middle.
   *
   *  The previous ▲+[W] cycle hint above the preview is gone — picker
   *  discovery happens through the attract-mode preview itself. The
   *  same UP/W affordance still surfaces on the SCORES view as
   *  "[W] ▲ FULL LEADERBOARD" via drawLeaderboardHint, so keyboard
   *  navigation stays reachable. */
  private drawLandingTitleView(
    cx: number,
    cy: number,
    cw: number,
    ch: number,
    ui: LandingUI,
    timestamp: number,
    bannerSize: number,
  ): void {
    const ctx = this.ctx;
    const config = spaceBarrageCabinetUI;

    // Cabinet width is the proxy for "is the player on a phone-sized
    // cabinet" — anything below ~600 CSS px is mobile by default.
    const isMobile = ctx.canvas.width < 600;

    // Ship preview — centered both axes, sized 0.4 × banner. The rect
    // spans cy + ch * 0.273 → cy + ch * 0.728 (since the rect is
    // 0.4 banner ≈ 0.455 ch tall), placing the rect's geometric
    // center at exactly cy + ch * 0.5 — the inner content's true
    // vertical center.
    //
    // The 11×13 sprite grid (in cabinetUI.ts) auto-fits to the rect
    // preserving square cells, so the visible ship sprite occupies
    // ~37% of banner width — already dominates the rect; no view-box
    // tightening needed (unlike asteroids' triangle, which used to be
    // a tiny floating outline).
    const previewSize = Math.round(bannerSize * 0.4);
    const previewX = cx + (cw - previewSize) / 2;
    const previewY = cy + ch * 0.27;

    // Animated ship preview (per-game callback)
    config.landing.picker.drawPreview(
      ctx,
      { x: previewX, y: previewY, w: previewSize, h: previewSize },
      timestamp,
      ui.pickerIndex,
    );

    // Keycap hint clusters — desktop ONLY, pulled up to sit JUST
    // below the ship rect (top at cy + ch * 0.73; ship rect ends at
    // cy + ch * 0.728, so the gap is ~0.002 ch — visually flush, the
    // hints read as "here's what the ship can do").
    //
    // Smaller capSize (0.018 banner, was 0.022 — see drawLandingHints)
    // keeps the cluster compact at 0.13 ch tall (ends at 0.86 ch),
    // leaving a 0.01 ch gap to the prompt + copyright cluster below.
    // Mobile players drive input via
    // joystick + fire button (cabinet's TouchControls), so showing
    // keyboard glyph hints on mobile is misleading; the menu controls
    // are indicated by the ◀ ▶ glyphs at the banner edges
    // (drawPageNavGlyphs).
    if (!isMobile) {
      this.drawLandingHints(cx, cy + ch * 0.73, cw, ch * 0.13, bannerSize);
    }

    // Prompt — call-to-action, hard-blinks ~1Hz (500ms visible /
    // 500ms hidden) for the classic arcade "PRESS START" attract-mode
    // rhythm. Sized 0.045 banner (was 0.025) so it's larger than the
    // title at 0.04 — the most prominent text on screen, anchoring
    // the lower third. Sits at cy + ch * 0.87; copyright at 0.95
    // leaves a 0.08 ch gap below — enough breathing room that the two
    // rows don't crowd each other while still reading as one bottom
    // cluster, and copyright pulls away from the inner-content bottom
    // edge so it isn't crowding the ring border. Caller passes the canvas-rendering loop timestamp so
    // the blink cadence stays in sync with everything else on the
    // banner.
    const PROMPT_BLINK_HALF_PERIOD_MS = 500;
    const promptVisible =
      Math.floor(timestamp / PROMPT_BLINK_HALF_PERIOD_MS) % 2 === 0;
    if (promptVisible) {
      const promptText = isMobile
        ? config.landing.promptMobile
        : config.landing.promptDesktop;
      const promptSize = Math.max(14, Math.round(bannerSize * 0.045));
      drawText(ctx, promptText, cx + cw / 2, cy + ch * 0.87, {
        sizePx: promptSize,
        align: 'center',
        color: colors.text.primary,
        shadow: { offsetX: 2, offsetY: 2, color: colors.background.base },
      });
    }
  }

  /** Scores view — top-N leaderboard rows centered in the inner content
   *  area, read from `boardEntriesRef`. Below the board, paints a
   *  "▲ FULL LEADERBOARD" hint indicating that UP navigates to the
   *  dedicated leaderboard page. The hint is text-only (no border
   *  rect) and lives at ch * 0.92 — well above the inner ring border
   *  so descenders never clip. Floors row font at 8px so phone-sized
   *  cabinets stay legible; if the floor would overflow the available
   *  height, caps the visible row count to fit (top-N where N ≤
   *  entries). Vertical offsets shifted below asteroids' to clear the
   *  2-line title. */
  private drawLandingScoresView(
    cx: number,
    cy: number,
    cw: number,
    ch: number,
    bannerSize: number,
  ): void {
    const ctx = this.ctx;
    // Read entries from the shared ref (server-backed + mock-padded).
    const entries: LeaderboardEntry[] = this.boardEntriesRef.current ?? [];

    // Subhead under title — at 0.21 ch (asteroids' 0.13 + 2-line title
    // offset + the 4% post-feedback push). Positioned to clear the
    // stacked "SPACE / BARRAGE" with comfortable breathing room.
    const subSize = Math.max(10, Math.round(bannerSize * 0.022));
    drawText(ctx, 'TOP SCORES', cx + cw / 2, cy + ch * 0.21, {
      sizePx: subSize,
      align: 'center',
      color: colors.text.primary,
    });

    // Reserve the bottom ~13% of inner content for the leaderboard
    // hint. Rows are laid out from 0.28 ch down to 0.87 ch.
    const hintMarginRatio = 0.13;
    const rowsTop = cy + ch * 0.28;
    const rowsBottom = cy + ch * (1 - hintMarginRatio);
    const availableH = Math.max(0, rowsBottom - rowsTop);
    const minRowFontSize = 8;
    const maxRowFontSize = bannerSize * 0.035;
    const numEntries = Math.max(1, entries.length);
    const targetFontSize = availableH / numEntries / 1.6;

    // Width-constraint: pick the largest font where the longest visible name
    // still fits with ≥5 dots of leader. PressStart2P is monospace so each
    // char ≈ font-size px. Overhead chars: 2 (rank) + 7 (score) + 4 (gaps)
    // + 5 (min dots) + 2 (padding) = 20.
    const longestNameLen = entries.reduce((m, e) => Math.max(m, e.username.length), 0);
    const overheadChars = 20;
    const rowsW = cw * 0.86;
    const widthCappedFont = rowsW / (longestNameLen + overheadChars);

    const rowSize = Math.round(
      Math.max(minRowFontSize, Math.min(maxRowFontSize, targetFontSize, widthCappedFont)),
    );
    const actualRowH = rowSize * 1.6;
    const visibleCount = Math.min(
      entries.length,
      Math.max(1, Math.floor(availableH / actualRowH)),
    );
    const visibleEntries = entries.slice(0, visibleCount);

    const rowsX = cx + cw * 0.07;

    let y = rowsTop;
    for (let i = 0; i < visibleEntries.length; i++) {
      const e = visibleEntries[i];
      y = drawLeaderboardRow(ctx, rowsX, y, rowsW, {
        rank: e.rank,
        name: e.username,
        score: e.score,
        sizePx: rowSize,
        rankColor: colors.text.muted,
        nameColor: colors.accent.yellow,
        dotsColor: colors.text.muted,
        scoreColor: colors.accent.cyan,
      });
    }

    // "[W] ▲ FULL LEADERBOARD" hint — text + glyph + (desktop) keycap.
    // UP cycles here go to the dedicated /arcade/space-barrage/leaderboard
    // page. Positioned at ch * 0.92 so the label sits above the inner
    // ring border (~ch * 1.0) with a comfortable margin and never
    // clips. The [W] keycap renders on desktop only — mobile players
    // use the joystick up-flick.
    this.drawLeaderboardHint(cx, cy, cw, ch, bannerSize);
  }

  /** Center-aligned leaderboard hint cluster: optional [W] keycap on
   *  the left (desktop only), then the ▲ glyph + label string from
   *  cabinetUI. The whole row is measured so it stays centered
   *  regardless of which pieces are present. */
  private drawLeaderboardHint(
    cx: number,
    cy: number,
    cw: number,
    ch: number,
    bannerSize: number,
  ): void {
    const ctx = this.ctx;
    const isMobile = ctx.canvas.width < 600;
    const label = spaceBarrageCabinetUI.landingScoresTapTarget.label;
    const hintSize = Math.max(11, Math.round(bannerSize * 0.026));
    const baselineY = cy + ch * 0.92;

    if (isMobile) {
      drawText(ctx, label, cx + cw / 2, baselineY, {
        sizePx: hintSize,
        align: 'center',
        baseline: 'middle',
        color: colors.accent.cyan,
      });
      return;
    }

    const capSize = Math.max(8, Math.round(bannerSize * 0.018));
    const capW = Math.round(capSize * 1.4);
    const gap = Math.round(capSize * 0.6);
    const labelW = measureText(ctx, label, hintSize);
    const totalW = capW + gap + labelW;
    const rowLeft = cx + cw / 2 - totalW / 2;
    const capTop = baselineY - Math.round(capSize * 1.4) / 2;

    drawKeycap(ctx, rowLeft, capTop, 'W', {
      sizePx: capSize,
      wide: false,
      borderColor: colors.text.muted,
      textColor: colors.text.primary,
    });
    drawText(ctx, label, rowLeft + capW + gap, baselineY, {
      sizePx: hintSize,
      align: 'left',
      baseline: 'middle',
      color: colors.accent.cyan,
    });
  }

  /** Column-aware keycap layout (mirrors asteroids' implementation).
   *  Hints are grouped by their `column` field (or by index if
   *  `column` is omitted), columns are distributed evenly across
   *  `cw`, and hints sharing a column stack vertically — each hint
   *  in a stack getting an equal share of `ch`. Space-barrage
   *  currently has no stacked clusters (MOVE + FIRE side-by-side),
   *  but the layout supports it for parity with asteroids. */
  private drawLandingHints(
    cx: number,
    cy: number,
    cw: number,
    ch: number,
    bannerSize: number,
  ): void {
    const ctx = this.ctx;
    const config = spaceBarrageCabinetUI;
    // Cap size 0.018 banner (was 0.022) — smaller now that the hints
    // are visually secondary to the ship + prompt. Matches asteroids'
    // sizing so the two cabinets read as siblings; lets the cluster
    // fit comfortably in a tighter ch * 0.14 block.
    const capSize = Math.round(bannerSize * 0.018);

    type HintItem = (typeof config.landing.hints)[number];
    const cols = new Map<number, HintItem[]>();
    config.landing.hints.forEach((h, i) => {
      const c = h.column ?? i;
      const list = cols.get(c) ?? [];
      list.push(h);
      cols.set(c, list);
    });
    const colKeys = Array.from(cols.keys()).sort((a, b) => a - b);
    const colW = cw / colKeys.length;

    colKeys.forEach((c, idx) => {
      const centerX = cx + colW * (idx + 0.5);
      const stack = cols.get(c)!;
      const slotH = ch / stack.length;
      stack.forEach((hint, j) => {
        const topY = cy + slotH * j;
        this.drawHintCluster(ctx, centerX, topY, slotH, hint, capSize, bannerSize);
      });
    });
  }

  /** Draw one hint cluster: vertical stack of [keycap rows]
   *  [optional sublabel] [main label]. Centered on `centerX`. */
  private drawHintCluster(
    ctx: CanvasRenderingContext2D,
    centerX: number,
    topY: number,
    availableH: number,
    hint: typeof spaceBarrageCabinetUI.landing.hints[number],
    capSize: number,
    bannerSize: number,
  ): void {
    const capH = Math.round(capSize * 1.4);
    const rowGap = 3;
    const sectionGap = Math.round(bannerSize * 0.012);

    let y = topY;

    // Keycap rows — each row is a horizontal sequence of caps centered
    // on centerX.
    for (const row of hint.cluster) {
      // Pre-measure total row width so we can left-align the first cap
      // such that the whole row centers on centerX.
      const widths = row.map((glyph) => {
        const wide = glyph.length > 1;
        const padX = wide ? Math.max(8, capSize * 0.9) : Math.max(4, capSize * 0.4);
        const glyphW = measureText(ctx, glyph, capSize);
        return wide ? glyphW + padX * 2 : Math.round(capSize * 1.4);
      });
      const totalRowW = widths.reduce((s, w) => s + w, 0) + (row.length - 1) * rowGap;
      let rowX = centerX - totalRowW / 2;

      for (let i = 0; i < row.length; i++) {
        const glyph = row[i];
        // Empty-string glyph = blank slot. Skip the keycap draw but
        // still advance `rowX` by the reserved width so the visual
        // gap stays in place (used by asteroids' `[A][_][D]` row;
        // space-barrage doesn't currently use this but the renderer
        // honours it for parity).
        if (glyph !== '') {
          const isWide = glyph.length > 1;
          drawKeycap(ctx, rowX, y, glyph, {
            sizePx: capSize,
            wide: isWide,
            borderColor: colors.text.muted,
            textColor: colors.text.primary,
          });
        }
        rowX += widths[i] + rowGap;
      }
      y += capH + 2 + rowGap;
    }

    // Optional sublabel — space-barrage hints don't use this today,
    // but the field is supported so future tuning (a shield or hyper
    // pickup hint, say) can lean on it without restructuring.
    if (hint.sublabel) {
      const subSize = Math.round(capSize * 0.55);
      drawText(ctx, hint.sublabel, centerX, y, {
        sizePx: subSize,
        align: 'center',
        color: colors.text.muted,
      });
      y += Math.round(subSize * 1.3);
    } else {
      y += sectionGap;
    }

    // Main label (MOVE / FIRE) — drawn at `y` directly (no extra
    // sectionGap added in the y-arg). Previously this was
    // `y + sectionGap`, which combined with the `y += sectionGap`
    // in the no-sublabel branch above produced *two* sectionGaps
    // between the keycap row and the label. Single-cluster columns
    // (space-barrage's MOVE and FIRE today) don't strictly need this
    // tightness, but it keeps the label-rendering identical to
    // asteroids' so future stacked-column layouts read the same.
    const labelSize = Math.round(capSize * 0.7);
    drawText(ctx, hint.label, centerX, y, {
      sizePx: labelSize,
      align: 'center',
      color: colors.text.muted,
    });

    // Avoid `availableH` lint — the parameter is documented as the
    // budget but enforced via the proportional sizing above; reading
    // it lets us assert it's used in case future iterations want to
    // clamp.
    void availableH;
  }

  // ============================================================================
  // GAME OVER SCREEN
  // Two phases — 'reveal' shows "FINAL SCORE: X" for 1.5 s before the
  // 'board' phase transitions in. The board shows the global Top 10 with
  // an optional highlight row (rank ≤ 10), plus a status line beneath
  // (YOUR RANK / TODAY'S BEST / username required / network error).
  //
  // The frozen last gameplay frame paints the backdrop, dimmed by a
  // semi-transparent overlay so the banner/text reads cleanly.
  // ============================================================================

  /** Render the game-over screen. Dispatches on `ui.phase`. */
  private drawGameover(
    ui: GameoverUI,
    ts: number,
    gameState: GameState,
  ): void {
    const w = this.ctx.canvas.width;
    const h = this.ctx.canvas.height;
    if (w <= 0 || h <= 0) return;

    // Frozen last gameplay frame as backdrop.
    this.drawPlaying(gameState, ts);

    if (ui.phase === 'reveal') {
      this.drawGameoverReveal(ui);
    } else {
      this.drawGameoverBoard(ui);
    }
  }

  /** Reveal phase — dim backdrop + "FINAL SCORE" label + big score
   *  number centered. Shows for ~1.5 s before the board transitions in. */
  private drawGameoverReveal(ui: GameoverUI): void {
    const ctx = this.ctx;
    const w = ctx.canvas.width;
    const h = ctx.canvas.height;

    // Dim backdrop so the reveal text reads cleanly.
    ctx.save();
    ctx.fillStyle = 'rgba(0, 0, 0, 0.55)';
    ctx.fillRect(0, 0, w, h);
    ctx.restore();

    const labelSize = Math.max(20, Math.round(w * 0.04));
    const valueSize = Math.max(48, Math.round(w * 0.10));
    const cy = h / 2;

    drawText(
      ctx,
      spaceBarrageCabinetUI.gameoverReveal.label,
      w / 2,
      cy - valueSize * 0.6,
      {
        sizePx: labelSize,
        align: 'center',
        baseline: 'middle',
        color: colors.text.muted,
      },
    );
    drawText(
      ctx,
      ui.finalScore.toLocaleString(),
      w / 2,
      cy + labelSize * 0.7,
      {
        sizePx: valueSize,
        align: 'center',
        baseline: 'middle',
        color: colors.accent.pink,
      },
    );
  }

  /** Board phase — dim backdrop + "FINAL SCORE" header + global Top 10
   *  (with optional highlight) + rank/todaysBest/error sub-line +
   *  continue prompt. */
  private drawGameoverBoard(ui: GameoverUI): void {
    const ctx = this.ctx;
    const w = ctx.canvas.width;
    const h = ctx.canvas.height;

    // Heavier dim than reveal — the leaderboard needs contrast.
    ctx.save();
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(0, 0, w, h);
    ctx.restore();

    // "FINAL SCORE: 12,345" header
    const headerSize = Math.max(18, Math.round(w * 0.025));
    drawText(
      ctx,
      `FINAL SCORE: ${ui.finalScore.toLocaleString()}`,
      w / 2,
      h * 0.08,
      {
        sizePx: headerSize,
        align: 'center',
        baseline: 'top',
        color: colors.accent.pink,
      },
    );

    // Top 10 board with optional highlight row
    const entries: LeaderboardEntry[] = this.boardEntriesRef.current ?? [];
    const rowsTop = h * 0.18;
    const rowsBottom = h * 0.78;
    this.drawScoresList(entries, rowsTop, rowsBottom, ui.highlightIndex);

    // Sub-line below the board: rank / todaysBest / error message
    const subSize = Math.max(12, Math.round(w * 0.02));
    let belowText: string | null = null;
    let belowColor: string = colors.text.muted;

    if (ui.submitStatus === 'username_required') {
      belowText = `${spaceBarrageCabinetUI.gameoverBoard.setUsernamePrompt} →`;
      belowColor = colors.accent.yellow;
    } else if (ui.submitStatus === 'network_error') {
      belowText = spaceBarrageCabinetUI.gameoverBoard.saveFailedPrompt;
      belowColor = colors.text.muted;
    } else if (ui.rank !== null && ui.highlightIndex === null) {
      // Auth user, rank > 10
      belowText = `${spaceBarrageCabinetUI.gameoverBoard.rankPrefix}: #${ui.rank}`;
      belowColor = colors.accent.cyan;
    } else if (ui.todaysBest !== null) {
      // Guest with a today's-best entry
      belowText = `${spaceBarrageCabinetUI.gameoverBoard.todaysBestPrefix}: ${ui.todaysBest.toLocaleString()}`;
      belowColor = colors.text.muted;
    }

    if (belowText) {
      drawText(ctx, belowText, w / 2, rowsBottom + subSize * 0.6, {
        sizePx: subSize,
        align: 'center',
        baseline: 'top',
        color: belowColor,
      });
    }

    // Continue prompt
    drawText(
      ctx,
      spaceBarrageCabinetUI.gameoverBoard.continuePrompt,
      w / 2,
      h * 0.93,
      {
        sizePx: subSize,
        align: 'center',
        baseline: 'middle',
        color: colors.text.muted,
      },
    );
  }

  /**
   * Render a list of leaderboard entries in the vertical band from
   * `rowsTop` to `rowsBottom`. Auto-fits font to the longest visible
   * name so long usernames don't truncate. Shared between the landing
   * scores view and the gameover board phase.
   *
   * @param entries - Entries to render (already sorted by rank).
   * @param rowsTop - Top of the rows band in CSS-px space.
   * @param rowsBottom - Bottom of the rows band in CSS-px space.
   * @param highlightIndex - Zero-based index in `entries` to highlight,
   *   or null for no highlight. Gameover board passes the player's rank-1
   *   index; landing scores view passes null.
   */
  private drawScoresList(
    entries: ReadonlyArray<LeaderboardEntry>,
    rowsTop: number,
    rowsBottom: number,
    highlightIndex: number | null = null,
  ): void {
    const ctx = this.ctx;
    const w = ctx.canvas.width;
    const availableH = Math.max(0, rowsBottom - rowsTop);
    const minRowFontSize = 8;
    const maxRowFontSize = (Math.min(w * 0.85, ctx.canvas.height * 0.95)) * 0.035;
    const numEntries = Math.max(1, entries.length);
    const targetFontSize = availableH / numEntries / 1.6;

    // Width-constraint: pick the largest font where the longest visible name
    // still fits with ≥5 dots of leader. PressStart2P is monospace so each
    // char ≈ font-size px. Overhead chars: 2 (rank) + 7 (score) + 4 (gaps)
    // + 5 (min dots) + 2 (padding) = 20.
    const longestNameLen = entries.reduce((m, e) => Math.max(m, e.username.length), 0);
    const overheadChars = 20;
    const rowsW = w * 0.86 * 0.86; // ~74% of canvas width
    const widthCappedFont = rowsW / (longestNameLen + overheadChars);

    const rowSize = Math.round(
      Math.max(
        minRowFontSize,
        Math.min(maxRowFontSize, targetFontSize, widthCappedFont),
      ),
    );
    const actualRowH = rowSize * 1.6;
    const visibleCount = Math.min(
      entries.length,
      Math.max(1, Math.floor(availableH / actualRowH)),
    );

    // Bias the visible window so the highlighted row is always shown.
    // If the window has to drop entries, prefer dropping from the top
    // (lowest ranks the player just beat) rather than the bottom — the
    // player needs to see WHERE they landed even if they're rank 10.
    let startIdx = 0;
    if (highlightIndex !== null && highlightIndex >= visibleCount) {
      startIdx = Math.max(0, highlightIndex - visibleCount + 1);
    }
    const visibleEntries = entries.slice(startIdx, startIdx + visibleCount);

    const rowsX = (w - w * 0.86) / 2;
    const rowsWActual = w * 0.86;

    let y = rowsTop;
    for (let i = 0; i < visibleEntries.length; i++) {
      const e = visibleEntries[i];
      const absIndex = startIdx + i;
      const isHighlighted = absIndex === highlightIndex;
      const highlightColor = isHighlighted
        ? colors.accent.cyan + '4D' // hex 0x4D = 77/255 ≈ 30% alpha
        : undefined;
      y = drawLeaderboardRow(ctx, rowsX, y, rowsWActual, {
        rank: e.rank,
        name: e.username,
        score: e.score,
        sizePx: rowSize,
        highlightColor,
        rankColor: isHighlighted ? colors.accent.cyan : colors.text.muted,
        nameColor: colors.accent.yellow,
        dotsColor: colors.text.muted,
        scoreColor: colors.accent.cyan,
      });
    }
  }
}
