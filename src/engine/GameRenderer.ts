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

const tintBuffer = document.createElement('canvas');
tintBuffer.width = 80;
tintBuffer.height = 80;
const tintCtx = tintBuffer.getContext('2d');

function drawTintedEnemy(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  x: number,
  y: number,
  w: number,
  h: number,
  tint: string,
): void {
  if (!tintCtx) {
    ctx.drawImage(img, x, y, w, h);
    return;
  }

  tintCtx.clearRect(0, 0, tintBuffer.width, tintBuffer.height);
  tintCtx.globalCompositeOperation = 'source-over';
  tintCtx.drawImage(img, 0, 0, tintBuffer.width, tintBuffer.height);
  tintCtx.globalCompositeOperation = 'source-in';
  tintCtx.fillStyle = tint;
  tintCtx.fillRect(0, 0, tintBuffer.width, tintBuffer.height);

  ctx.drawImage(tintBuffer, x, y, w, h);
}

export class GameRenderer {
  private ctx: CanvasRenderingContext2D;
  private assets: GameAssets;
  private stars: Star[];
  private scaleX = 1;
  private scaleY = 1;

  constructor(canvas: HTMLCanvasElement, assets: GameAssets) {
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Failed to get canvas context');
    this.ctx = ctx;
    this.assets = assets;
    this.stars = this.generateStars();
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

    ctx.save();
    ctx.scale(this.scaleX, this.scaleY);

    // Background
    ctx.fillStyle = colors.background.base;
    ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

    // Nebula gradient
    this.drawNebula(timestamp);

    // Stars
    this.drawStars(timestamp);

    // Shields
    state.shields.forEach(shield => this.drawShield(shield, timestamp));

    // Enemies
    state.enemies.forEach(enemy => this.drawEnemy(enemy, timestamp));

    // Bullets
    state.bullets.forEach(bullet => this.drawBullet(bullet));

    // Particles
    state.particles.forEach(particle => this.drawParticle(particle));

    // Ship
    this.drawShip(state, timestamp);

    // Score
    this.drawScore(state);

    // Lives
    this.drawLives(state);

    // Game Over overlay
    if (state.isShipHit) {
      this.drawGameOver(state, timestamp);
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
      ctx.fillRect(star.x, y, star.size, star.size);
    });
  }

  private drawShield(shield: { x: number; y: number; startTime: number; duration: number }, timestamp: number): void {
    const ctx = this.ctx;
    const elapsed = (timestamp - shield.startTime) % 1500;
    const pulseFactor = 1 + 0.1 * Math.sin((elapsed / 1500) * Math.PI * 2);

    ctx.save();
    ctx.shadowColor = colors.accent.cyan;
    ctx.shadowBlur = 10 + 5 * Math.sin((elapsed / 1500) * Math.PI * 2);

    ctx.translate(shield.x, shield.y);
    ctx.scale(pulseFactor, pulseFactor);
    ctx.drawImage(this.assets.shield, -30, -30, 60, 60);
    ctx.restore();
  }

  private drawEnemy(enemy: { x: number; y: number; imageIndex: number; health: number; removedAt?: number }, timestamp: number): void {
    const ctx = this.ctx;
    const tint = healthToColor(enemy.health);

    if (enemy.removedAt && timestamp - enemy.removedAt < 200) {
      const progress = (timestamp - enemy.removedAt) / 200;
      const scale = 1 - progress;
      const alpha = 1 - progress;

      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.translate(enemy.x + 40, enemy.y + 40);
      ctx.scale(scale, scale);
      drawTintedEnemy(ctx, this.assets.enemies[enemy.imageIndex], -40, -40, 80, 80, tint);
      ctx.restore();
    } else if (!enemy.removedAt) {
      drawTintedEnemy(ctx, this.assets.enemies[enemy.imageIndex], enemy.x, enemy.y, 80, 80, tint);
    }
  }

  private drawParticle(particle: { x: number; y: number }): void {
    const ctx = this.ctx;

    ctx.save();
    ctx.shadowColor = colors.accent.yellow;
    ctx.shadowBlur = 8;
    ctx.fillStyle = colors.accent.yellow;
    ctx.beginPath();
    ctx.arc(particle.x, particle.y, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  private drawBullet(bullet: { x: number; y: number }): void {
    const ctx = this.ctx;

    ctx.save();
    ctx.shadowColor = colors.primary.main;
    ctx.shadowBlur = 6;
    ctx.fillStyle = colors.primary.main;
    ctx.beginPath();
    ctx.arc(bullet.x, bullet.y, 4, 0, Math.PI * 2);
    ctx.fill();
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

    // Thruster flame
    const baseScale = 0.4;
    const velocityMagnitude = Math.sqrt(state.velocityX * state.velocityX + state.velocityY * state.velocityY);
    const velocityScale = Math.max(baseScale, Math.min(velocityMagnitude / 500, 1));
    const flameFlicker = 0.8 + 0.2 * Math.sin(timestamp / 200);

    ctx.save();
    ctx.translate(state.shipX, state.shipY);
    ctx.rotate(rotateRad);
    ctx.globalAlpha = opacity;

    // Flame
    ctx.drawImage(
      this.assets.fire,
      -40 * velocityScale * flameFlicker,
      30,
      80 * velocityScale * flameFlicker,
      60 * flameFlicker
    );

    // Body
    ctx.drawImage(this.assets.rocket, -40, -40, 80, 80);
    ctx.restore();
  }

  private drawScore(state: GameState): void {
    const ctx = this.ctx;
    ctx.font = '20px PressStart2P';
    ctx.fillStyle = colors.accent.cyan;
    ctx.textBaseline = 'top';
    ctx.shadowColor = colors.accent.yellow;
    ctx.shadowBlur = 2;
    ctx.fillText(state.score.toString(), 30, 20);

    if (state.highScore > 0) {
      ctx.font = '16px PressStart2P';
      ctx.fillStyle = colors.accent.yellow;
      ctx.fillText(`HI ${state.highScore}`, 10, 70);
    }

    ctx.shadowBlur = 0;
  }

  private drawLives(state: GameState): void {
    const ctx = this.ctx;
    ctx.font = '19px PressStart2P';
    ctx.fillStyle = colors.accent.pink;
    ctx.textBaseline = 'top';
    ctx.shadowColor = colors.accent.yellow;
    ctx.shadowBlur = 2;

    const text = `LIVES: ${state.lives}`;
    const metrics = ctx.measureText(text);
    const x = GAME_WIDTH - metrics.width - 30;

    ctx.fillText(text, x, 20);
    ctx.shadowBlur = 0;
  }

  private drawGameOver(state: GameState, timestamp: number): void {
    const ctx = this.ctx;

    // Convert hex to RGBA - #011627 = rgb(1, 22, 39)
    ctx.fillStyle = 'rgba(1, 22, 39, 0.95)';
    ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

    ctx.font = '48px PressStart2P';
    ctx.fillStyle = colors.accent.pink;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.shadowColor = colors.accent.yellow;
    ctx.shadowBlur = 4;
    ctx.fillText('GAME OVER', GAME_WIDTH / 2, 200);

    ctx.font = '24px PressStart2P';
    ctx.fillStyle = colors.text.primary;
    ctx.shadowBlur = 2;
    ctx.fillText(`SCORE: ${state.score}`, GAME_WIDTH / 2, 300);

    const isNewRecord = state.highScore === state.score && state.score > 0;
    const highScoreColor = isNewRecord ? colors.accent.yellow : colors.text.primary;
    ctx.fillStyle = highScoreColor;
    ctx.fillText(`HIGH: ${state.highScore}`, GAME_WIDTH / 2, 350);

    if (isNewRecord) {
      const pulse = 1 + 0.2 * Math.sin((timestamp / 500) * Math.PI * 2);
      ctx.font = `${16 * pulse}px PressStart2P`;
      ctx.fillStyle = colors.accent.yellow;
      ctx.fillText('★ NEW ★', GAME_WIDTH / 2, 400);
    }

    ctx.font = '16px PressStart2P';
    ctx.fillStyle = colors.text.primary;
    ctx.shadowBlur = 0;
    ctx.fillText('press SPACE to reset', GAME_WIDTH / 2, 500);
  }
}
