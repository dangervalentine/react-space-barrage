import { GameState, GAME_WIDTH, GAME_HEIGHT } from './types';
import { GameAssets } from './AssetLoader';

interface Star {
  x: number;
  size: number;
  speed: number;
  phase: number;
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
    ctx.fillStyle = '#011627';
    ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

    // Nebula gradient
    this.drawNebula(timestamp);

    // Stars
    this.drawStars(timestamp);

    // Shields
    state.shields.forEach(shield => this.drawShield(shield, timestamp));

    // Enemies
    state.enemies.forEach(enemy => this.drawEnemy(enemy, timestamp));

    // Particles
    state.particles.forEach(particle => this.drawParticle(particle));

    // Ship
    this.drawShip(state, timestamp);

    // Score
    this.drawScore(state);

    // Lives
    this.drawLives(state);

    // Guide (desktop only)
    if (this.scaleX > 0.5) {
      this.drawGuide();
    }

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
    grad.addColorStop(0, 'rgba(130, 170, 255, 0.08)');
    grad.addColorStop(0.6, 'rgba(1, 22, 39, 0)');

    ctx.fillStyle = grad;
    ctx.fillRect(-200, -500, GAME_WIDTH + 400, GAME_HEIGHT + 600);
  }

  private drawStars(timestamp: number): void {
    const ctx = this.ctx;
    ctx.fillStyle = '#7fdbca';

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
    ctx.shadowColor = '#7fdbca';
    ctx.shadowBlur = 10 + 5 * Math.sin((elapsed / 1500) * Math.PI * 2);

    ctx.translate(shield.x, shield.y);
    ctx.scale(pulseFactor, pulseFactor);
    ctx.drawImage(this.assets.shield, -30, -30, 60, 60);
    ctx.restore();
  }

  private drawEnemy(enemy: { x: number; y: number; imageIndex: number; removedAt?: number }, timestamp: number): void {
    const ctx = this.ctx;

    if (enemy.removedAt && timestamp - enemy.removedAt < 200) {
      const progress = (timestamp - enemy.removedAt) / 200;
      const scale = 1 - progress;
      const alpha = 1 - progress;

      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.translate(enemy.x + 40, enemy.y + 40);
      ctx.scale(scale, scale);
      ctx.drawImage(this.assets.enemies[enemy.imageIndex], -40, -40, 80, 80);
      ctx.restore();
    } else if (!enemy.removedAt) {
      ctx.drawImage(this.assets.enemies[enemy.imageIndex], enemy.x, enemy.y, 80, 80);
    }
  }

  private drawParticle(particle: { x: number; y: number; createdAt: number }): void {
    const ctx = this.ctx;
    const age = performance.now() - particle.createdAt;

    ctx.save();
    ctx.shadowColor = '#FFCB6B';
    ctx.shadowBlur = 8;
    ctx.fillStyle = '#FFCB6B';
    ctx.beginPath();
    ctx.arc(particle.x, particle.y, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  private drawShip(state: GameState, timestamp: number): void {
    const ctx = this.ctx;
    const rotate = (state.velocityX / 500) * 30;
    const rotateRad = (rotate * Math.PI) / 180;

    const timeSinceHit = performance.now() - state.lastHitTime;
    const isInvulnerable = timeSinceHit < 2000;
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
      20,
      80 * velocityScale * flameFlicker,
      80 * flameFlicker
    );

    // Body
    ctx.drawImage(this.assets.rocket, -40, -40, 80, 80);
    ctx.restore();
  }

  private drawScore(state: GameState): void {
    const ctx = this.ctx;
    ctx.font = '40px PressStart2P';
    ctx.fillStyle = '#7fdbca';
    ctx.textBaseline = 'top';
    ctx.shadowColor = '#FFCB6B';
    ctx.shadowBlur = 2;
    ctx.fillText(state.score.toString(), 10, 20);

    if (state.highScore > 0) {
      ctx.font = '16px PressStart2P';
      ctx.fillStyle = '#FFCB6B';
      ctx.fillText(`HI ${state.highScore}`, 10, 70);
    }

    ctx.shadowBlur = 0;
  }

  private drawLives(state: GameState): void {
    const ctx = this.ctx;
    ctx.font = '19px PressStart2P';
    ctx.fillStyle = '#F07178';
    ctx.textBaseline = 'top';
    ctx.shadowColor = '#FFCB6B';
    ctx.shadowBlur = 2;

    const text = `LIVES: ${state.lives}`;
    const metrics = ctx.measureText(text);
    const x = GAME_WIDTH - metrics.width - 30;

    ctx.fillText(text, x, 20);
    ctx.shadowBlur = 0;
  }

  private drawGuide(): void {
    const ctx = this.ctx;
    ctx.font = '11px PressStart2P';
    ctx.fillStyle = '#C792EA';
    ctx.strokeStyle = '#C792EA';
    ctx.lineWidth = 1;
    ctx.textBaseline = 'middle';
    ctx.textAlign = 'center';

    const keySize = 16;
    const keyGap = 4;
    const groupGap = 30;
    const y = GAME_HEIGHT - 40;

    const drawKeyGroup = (startX: number, keys: string[]) => {
      keys.forEach((key, i) => {
        const x = startX + i * (keySize + keyGap);
        ctx.strokeRect(x - keySize / 2, y - keySize / 2, keySize, keySize);
        ctx.fillText(key, x, y);
      });
    };

    const wasdX = GAME_WIDTH / 2 - 50;
    const arrowX = GAME_WIDTH / 2 + 50;

    drawKeyGroup(wasdX, ['W', 'A', 'S', 'D']);
    ctx.fillText('or', GAME_WIDTH / 2, y);
    drawKeyGroup(arrowX, ['↑', '←', '↓', '→']);
  }

  private drawGameOver(state: GameState, timestamp: number): void {
    const ctx = this.ctx;

    ctx.fillStyle = 'rgba(1, 22, 39, 0.95)';
    ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

    ctx.font = '48px PressStart2P';
    ctx.fillStyle = '#F07178';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.shadowColor = '#FFCB6B';
    ctx.shadowBlur = 4;
    ctx.fillText('GAME OVER', GAME_WIDTH / 2, 200);

    ctx.font = '24px PressStart2P';
    ctx.fillStyle = '#D6DEEB';
    ctx.shadowBlur = 2;
    ctx.fillText(`SCORE: ${state.score}`, GAME_WIDTH / 2, 300);

    const isNewRecord = state.highScore === state.score && state.score > 0;
    const highScoreColor = isNewRecord ? '#FFCB6B' : '#D6DEEB';
    ctx.fillStyle = highScoreColor;
    ctx.fillText(`HIGH: ${state.highScore}`, GAME_WIDTH / 2, 350);

    if (isNewRecord) {
      const pulse = 1 + 0.2 * Math.sin((timestamp / 500) * Math.PI * 2);
      ctx.font = `${16 * pulse}px PressStart2P`;
      ctx.fillStyle = '#FFCB6B';
      ctx.fillText('★ NEW ★', GAME_WIDTH / 2, 400);
    }

    ctx.font = '16px PressStart2P';
    ctx.fillStyle = '#D6DEEB';
    ctx.shadowBlur = 0;
    ctx.fillText('press SPACE to reset', GAME_WIDTH / 2, 500);
  }
}
