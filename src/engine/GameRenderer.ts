import { GameState, GAME_WIDTH, GAME_HEIGHT } from './types';
import { GameAssets } from './AssetLoader';
import { colors } from '../constants/colors';

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

// 11x11 player ship facing up. Codes:
//   b = body (blue), c = wing (cyan), y = cockpit (yellow),
//   w = cockpit highlight (white), p = engine port (coral),
//   g = engine glow (pink, swapped with flame frame)
const SHIP_ROWS_A = [
  '.....b.....',
  '....bbb....',
  '....byb....',
  '...bbybb...',
  '..ccbwbcc..',
  '.cccbbbccc.',
  'cccbbbbbccc',
  'ccbbbbbbbcc',
  '.ccbbbbbcc.',
  '....bbb....',
  '....p.p....',
];
const SHIP_ROWS_B = [
  '.....b.....',
  '....bbb....',
  '....byb....',
  '...bbybb...',
  '..ccbwbcc..',
  '.cccbbbccc.',
  'cccbbbbbccc',
  'ccbbbbbbbcc',
  '.ccbbbbbcc.',
  '....bbb....',
  '....g.g....',
];
const SHIP_COLS = SHIP_ROWS_A[0].length;
const SHIP_ROW_COUNT = SHIP_ROWS_A.length;

function drawPixelShip(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number,
  timestamp: number,
): void {
  const rows = Math.floor(timestamp / 120) % 2 === 0 ? SHIP_ROWS_A : SHIP_ROWS_B;
  const cell = size / SHIP_COLS;
  const offsetY = (size - cell * SHIP_ROW_COUNT) / 2;
  const px = Math.ceil(cell);

  for (let r = 0; r < SHIP_ROW_COUNT; r++) {
    const row = rows[r];
    for (let c = 0; c < SHIP_COLS; c++) {
      const ch = row[c];
      if (ch === '.') continue;
      let color: string;
      switch (ch) {
        case 'b': color = colors.neutral.darkGray; break;
        case 'c': color = colors.primary.dark; break;
        case 'y': color = colors.accent.pink; break;
        case 'w': color = colors.neutral.lightGray; break;
        case 'p': color = colors.accent.coral; break;
        case 'g': color = colors.accent.yellow; break;
        default: continue;
      }
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

export class GameRenderer {
  private ctx: CanvasRenderingContext2D;
  private assets: GameAssets;
  private stars: Star[];
  private scaleX = 1;
  private scaleY = 1;
  // CRT-style quantization. 0 on either axis disables that axis.
  private pixelStep = 4;
  private timeStepMs = 60;

  constructor(canvas: HTMLCanvasElement, assets: GameAssets) {
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Failed to get canvas context');
    this.ctx = ctx;
    this.assets = assets;
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

  draw(state: GameState, timestamp: number): void {
    const ctx = this.ctx;
    const tStep = this.snapTime(timestamp);

    ctx.save();
    ctx.scale(this.scaleX, this.scaleY);

    // Background
    ctx.fillStyle = colors.background.base;
    ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

    // Nebula gradient — keep smooth (slow drift, looks bad if stepped)
    this.drawNebula(timestamp);

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

    // Score
    this.drawScore(state);

    // Lives
    this.drawLives(state, tStep);

    // Game Over overlay
    if (state.isShipHit) {
      this.drawGameOver(state, tStep);
    }

    ctx.restore();
  }

  private drawNebula(timestamp: number): void {
    const ctx = this.ctx;
    const cycle = (timestamp / 10000) % 1;
    const centerX = 300 + 200 * Math.sin(cycle * Math.PI * 2);
    const centerY = -400 + 500 * Math.cos(cycle * Math.PI * 2);

    const grad = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, 400);
    // Extract RGB values from primary.main (#82AAFF = rgb(130, 170, 255))
    grad.addColorStop(0, 'rgba(130, 170, 255, 0.08)');
    grad.addColorStop(0.6, `${colors.background.base}00`); // Transparent version of base background

    ctx.fillStyle = grad;
    ctx.fillRect(-200, -500, GAME_WIDTH + 400, GAME_HEIGHT + 600);
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

  private drawEnemy(enemy: { x: number; y: number; imageIndex: number; health: number; removedAt?: number; lastHitAt?: number }, timestamp: number): void {
    const ctx = this.ctx;
    const tint = healthToColor(enemy.health);
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
      drawPixelEnemy(ctx, -40, -40, 80, tint);
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
        drawPixelEnemy(ctx, -40, -40, 80, tint);
        ctx.restore();
      } else {
        drawPixelEnemy(ctx, ex, ey, 80, tint);
      }
    }
  }

  private drawParticle(particle: { x: number; y: number }): void {
    const ctx = this.ctx;
    const cell = Math.ceil(80 / SHIP_COLS);
    const px = this.snap(particle.x);
    const py = this.snap(particle.y);

    ctx.save();
    ctx.shadowColor = colors.accent.yellow;
    ctx.shadowBlur = 4;
    ctx.fillStyle = colors.accent.yellow;
    ctx.fillRect(px - cell / 2, py - cell / 2, cell, cell);
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

  private drawScore(state: GameState): void {
    const ctx = this.ctx;
    const isMobile = typeof window !== 'undefined'
      && window.matchMedia?.('(max-width: 768px)').matches;
    const s = isMobile ? 2 : 1;
    ctx.font = `${20 * s}px PressStart2P`;
    ctx.fillStyle = colors.accent.cyan;
    ctx.textBaseline = 'top';
    ctx.shadowColor = colors.accent.yellow;
    ctx.shadowBlur = 2;
    ctx.fillText(`SCORE: ${state.score}`, 30, 20);

    if (state.highScore > 0) {
      ctx.font = `${16 * s}px PressStart2P`;
      ctx.fillStyle = colors.accent.yellow;
      ctx.fillText(`HI ${state.highScore}`, 10, 30 + 20 * s + 10);
    }

    ctx.shadowBlur = 0;
  }

  private drawLives(state: GameState, timestamp: number): void {
    const ctx = this.ctx;
    const isMobile = typeof window !== 'undefined'
      && window.matchMedia?.('(max-width: 768px)').matches;
    const shipSize = isMobile ? 56 : 36;
    const gap = isMobile ? 12 : 8;
    const reserve = Math.max(0, state.lives - 1);
    const rightEdge = GAME_WIDTH - 30;
    const top = 20;

    ctx.save();
    ctx.shadowColor = colors.text.primary;
    ctx.shadowBlur = 4;
    for (let i = 0; i < reserve; i++) {
      const x = rightEdge - (i + 1) * shipSize - i * gap;
      drawPixelShip(ctx, x, top, shipSize, timestamp);
    }
    ctx.restore();
  }

  private drawGameOver(state: GameState, timestamp: number): void {
    const ctx = this.ctx;

    const isMobile = typeof window !== 'undefined'
      && window.matchMedia?.('(max-width: 768px)').matches;
    const s = isMobile ? 1.8 : 1;

    // Convert hex to RGBA - #011627 = rgb(1, 22, 39)
    ctx.fillStyle = 'rgba(1, 22, 39, 0.95)';
    ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

    ctx.font = `${48 * s}px PressStart2P`;
    ctx.fillStyle = colors.accent.pink;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.shadowColor = colors.accent.yellow;
    ctx.shadowBlur = 4;
    ctx.fillText('GAME OVER', GAME_WIDTH / 2, 200);

    ctx.font = `${24 * s}px PressStart2P`;
    ctx.fillStyle = colors.text.primary;
    ctx.shadowBlur = 2;
    ctx.fillText(`SCORE: ${state.score}`, GAME_WIDTH / 2, 300);

    const isNewRecord = state.highScore === state.score && state.score > 0;
    const highScoreColor = isNewRecord ? colors.accent.yellow : colors.text.primary;
    ctx.fillStyle = highScoreColor;
    ctx.fillText(`HIGH: ${state.highScore}`, GAME_WIDTH / 2, 350);

    if (isNewRecord) {
      const pulse = 1 + 0.2 * Math.sin((timestamp / 500) * Math.PI * 2);
      ctx.font = `${16 * s * pulse}px PressStart2P`;
      ctx.fillStyle = colors.accent.yellow;
      ctx.fillText('★ NEW ★', GAME_WIDTH / 2, 400);
    }

    ctx.font = `${16 * s}px PressStart2P`;
    ctx.fillStyle = colors.text.primary;
    ctx.shadowBlur = 0;
    const resetLabel = isMobile ? 'press FIRE to reset' : 'press SPACE to reset';
    ctx.fillText(resetLabel, GAME_WIDTH / 2, 500);
  }
}
