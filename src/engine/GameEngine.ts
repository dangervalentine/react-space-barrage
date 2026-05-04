import {
  GameState,
  EnemyState,
  ParticleState,
  KEYS,
  ENEMY_COUNT,
  ENEMY_START_Y,
  ENEMY_END_Y,
  GAME_WIDTH,
  GAME_HEIGHT,
  randomUpTo,
} from './types';

export class GameEngine {
  private state: GameState;
  private rafId: number | null = null;
  private lastTime = 0;
  private onUpdate: (state: GameState) => void;
  private startTime: number = 0;
  private pressedKeys: Set<number> = new Set();
  private nextParticleId: number = 0;
  private analogVelocityX = 0;
  private analogVelocityY = 0;

  constructor(onUpdate: (state: GameState) => void) {
    this.onUpdate = onUpdate;
    this.startTime = performance.now();
    this.state = this.makeInitialState(this.startTime);
  }

  start(): void {
    console.log('GameEngine.start() called');
    this.lastTime = performance.now();
    console.log(`Initial enemy positions: ${this.state.enemies.map(e => `id=${e.id},y=${e.y}`).join(' | ')}`);
    this.tick(this.lastTime);
  }

  stop(): void {
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
  }

  handleKeyDown(keyCode: number): void {
    if (keyCode === KEYS.SPACE && this.state.isShipHit) {
      this.startTime = performance.now();
      this.state = this.makeInitialState(this.startTime);
      this.lastTime = this.startTime;
      this.onUpdate(this.state);
      return;
    }
    this.pressedKeys.add(keyCode);
  }

  handleKeyUp(keyCode: number): void {
    this.pressedKeys.delete(keyCode);
  }

  setAnalogVelocity(x: number, y: number): void {
    this.analogVelocityX = Math.max(-500, Math.min(500, x));
    this.analogVelocityY = Math.max(-500, Math.min(500, y));
  }

  private tick = (timestamp: number): void => {
    const delta = Math.min(timestamp - this.lastTime, 16.67 * 3);
    this.lastTime = timestamp;

    if (!this.state.isShipHit) {
      this.updateShip(delta);
      this.updateEnemies(timestamp);
      this.updateShields(timestamp);
      this.checkShieldPickup();
    }

    this.updateParticles(delta);
    this.onUpdate({ ...this.state });
    this.rafId = requestAnimationFrame(this.tick);
  };

  private updateShip(delta: number): void {
    const MAX_VELOCITY = 500;
    const ACCELERATION = 1500;

    const { shipX, shipY, velocityX, velocityY } = this.state;
    let newVelocityX = velocityX;
    let newVelocityY = velocityY;

    // If analog input is active (joystick), use it directly
    const hasAnalogInput = Math.abs(this.analogVelocityX) > 1 || Math.abs(this.analogVelocityY) > 1;

    if (hasAnalogInput) {
      // Use analog velocity directly from joystick
      newVelocityX = this.analogVelocityX;
      newVelocityY = this.analogVelocityY;
    } else {
      // Use keyboard input with acceleration
      const isMovingLeft = this.pressedKeys.has(KEYS.LEFT) || this.pressedKeys.has(KEYS.A);
      const isMovingRight = this.pressedKeys.has(KEYS.RIGHT) || this.pressedKeys.has(KEYS.D);
      const isMovingUp = this.pressedKeys.has(KEYS.UP) || this.pressedKeys.has(KEYS.W);
      const isMovingDown = this.pressedKeys.has(KEYS.DOWN) || this.pressedKeys.has(KEYS.S);

      if (isMovingLeft && !isMovingRight) {
        newVelocityX = Math.max(newVelocityX - ACCELERATION * (delta / 1000), -MAX_VELOCITY);
      } else if (isMovingRight && !isMovingLeft) {
        newVelocityX = Math.min(newVelocityX + ACCELERATION * (delta / 1000), MAX_VELOCITY);
      } else {
        newVelocityX *= Math.pow(0.5, delta / 1000);
        if (Math.abs(newVelocityX) < 10) newVelocityX = 0;
      }

      if (isMovingUp && !isMovingDown) {
        newVelocityY = Math.max(newVelocityY - ACCELERATION * (delta / 1000), -MAX_VELOCITY);
      } else if (isMovingDown && !isMovingUp) {
        newVelocityY = Math.min(newVelocityY + ACCELERATION * (delta / 1000), MAX_VELOCITY);
      } else {
        newVelocityY *= Math.pow(0.5, delta / 1000);
        if (Math.abs(newVelocityY) < 10) newVelocityY = 0;
      }
    }

    this.state.velocityX = newVelocityX;
    this.state.velocityY = newVelocityY;

    const maxY = GAME_HEIGHT - 80;
    const minY = 0;

    let newX = shipX + newVelocityX * (delta / 1000);
    const newY = shipY + newVelocityY * (delta / 1000);

    // Wrap X position around game width
    if (newX > GAME_WIDTH) {
      newX = newX - GAME_WIDTH;
    } else if (newX < 0) {
      newX = GAME_WIDTH + newX;
    }

    this.state.shipX = newX;
    this.state.shipY = Math.max(minY, Math.min(newY, maxY));
  }

  private updateEnemies(timestamp: number): void {
    const shipX = this.state.shipX;
    const shipY = this.state.shipY;

    this.state.enemies = this.state.enemies.map((enemy, idx) => {
      const y = this.getEnemyY(enemy, timestamp);
      const progress = (timestamp - enemy.startTime) / enemy.duration;
      const updatedEnemy = { ...enemy, y };

      if (idx === 0) {
        console.log(
          `Enemy 0: startTime=${enemy.startTime}, now=${timestamp}, duration=${enemy.duration}, progress=${progress}, y=${y}`
        );
      }

      const isInvulnerable = timestamp - this.state.lastHitTime < 2000;
      if (!isInvulnerable && this.checkCollision(shipX, shipY, y, enemy.x)) {
        this.state.lives -= 1;
        this.state.lastHitTime = timestamp;
        this.spawnParticles(shipX, shipY, timestamp);
        if (this.state.lives <= 0) {
          this.state.isShipHit = true;
        }
      }

      if (progress >= 1 && y >= 825 && !enemy.hasScored) {
        this.state.score += 1;
        return { ...updatedEnemy, hasScored: true };
      }

      return updatedEnemy;
    }).filter(enemy => {
      if (enemy.removedAt === undefined) return true;
      return timestamp - enemy.removedAt < 200;
    });
  }

  // TODO: Implement enemy spawning logic here
  private spawnEnemies(timestamp: number): void {
    // Decide how and when enemies should spawn
  }

  private updateShields(timestamp: number): void {
    const SHIELD_SPAWN_CHANCE = 0.002;
    const SHIELD_SPAWN_MIN_SCORE = 50;

    if (
      this.state.score >= SHIELD_SPAWN_MIN_SCORE &&
      Math.random() < SHIELD_SPAWN_CHANCE
    ) {
      const shieldId = this.state.shields.length;
      const shield = {
        id: shieldId,
        x: randomUpTo(11) * 100,
        y: ENEMY_START_Y,
        startTime: timestamp,
        duration: 8000,
      };
      this.state.shields.push(shield);
    }

    this.state.shields = this.state.shields
      .map(shield => {
        const progress = (timestamp - shield.startTime) / shield.duration;
        const y = ENEMY_START_Y + (ENEMY_END_Y - ENEMY_START_Y) * Math.min(progress, 1);
        return { ...shield, y };
      })
      .filter(shield => shield.y < ENEMY_END_Y);
  }

  private checkShieldPickup(): void {
    const shipX = this.state.shipX;
    const shipY = this.state.shipY;
    const PICKUP_RADIUS = 80;

    this.state.shields = this.state.shields.filter(shield => {
      const distance = Math.sqrt(
        Math.pow(shield.x - shipX, 2) + Math.pow(shield.y - shipY, 2)
      );

      if (distance < PICKUP_RADIUS) {
        const now = performance.now();
        this.state.score += this.state.enemies.length;
        this.state.enemies = this.state.enemies.map(enemy => {
          this.spawnParticles(enemy.x, enemy.y, now);
          return { ...enemy, removedAt: now };
        });
        return false;
      }
      return true;
    });
  }

  private checkCollision(shipX: number, shipY: number, enemyY: number, enemyX: number): boolean {
    const SHIP_WIDTH = 80;
    const SHIP_HEIGHT = 80;
    const ENEMY_WIDTH = 80;
    const ENEMY_HEIGHT = 80;
    const PADDING = 20;

    const shipLeft = shipX - SHIP_WIDTH / 2 + PADDING;
    const shipRight = shipX + SHIP_WIDTH / 2 - PADDING;
    const shipTop = shipY - SHIP_HEIGHT / 2 + PADDING;
    const shipBottom = shipY + SHIP_HEIGHT / 2 - PADDING;

    const enemyLeft = enemyX - ENEMY_WIDTH / 2 + PADDING;
    const enemyRight = enemyX + ENEMY_WIDTH / 2 - PADDING;
    const enemyTop = enemyY + PADDING;
    const enemyBottom = enemyY + ENEMY_HEIGHT - PADDING;

    return (
      shipLeft < enemyRight &&
      shipRight > enemyLeft &&
      shipTop < enemyBottom &&
      shipBottom > enemyTop
    );
  }

  private getEnemyY(enemy: EnemyState, timestamp: number): number {
    const progress = (timestamp - enemy.startTime) / enemy.duration;
    const y = ENEMY_START_Y + (ENEMY_END_Y - ENEMY_START_Y) * Math.min(progress, 1);
    return y;
  }


  private makeInitialState(timestamp: number): GameState {
    const SPAWN_STAGGER_MS = 350;

    return {
      score: 0,
      highScore: this.state?.highScore ?? 0,
      lives: 3,
      shipX: 490,
      shipY: 700,
      velocityX: 0,
      velocityY: 0,
      isShipHit: false,
      lastHitTime: timestamp - 2000,
      enemies: [],
      shields: [],
      particles: [],
    };
  }

  private spawnParticles(x: number, y: number, timestamp: number): void {
    const PARTICLE_COUNT = 8;
    const PARTICLE_SPEED = 300;
    const PARTICLE_LIFETIME = 600;

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const angle = (i / PARTICLE_COUNT) * Math.PI * 2;
      const vx = Math.cos(angle) * PARTICLE_SPEED;
      const vy = Math.sin(angle) * PARTICLE_SPEED;

      const particle: ParticleState = {
        id: this.nextParticleId++,
        x,
        y,
        vx,
        vy,
        createdAt: timestamp,
        lifetime: PARTICLE_LIFETIME,
      };
      this.state.particles.push(particle);
    }
  }

  private updateParticles(delta: number): void {
    const now = performance.now();
    this.state.particles = this.state.particles
      .map(particle => ({
        ...particle,
        x: particle.x + particle.vx * (delta / 1000),
        y: particle.y + particle.vy * (delta / 1000),
      }))
      .filter(particle => now - particle.createdAt < particle.lifetime);
  }
}
