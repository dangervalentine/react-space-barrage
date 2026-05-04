import {
  GameState,
  EnemyState,
  ParticleState,
  BulletState,
  KEYS,
  ENEMY_COUNT,
  ENEMY_START_Y,
  ENEMY_END_Y,
  GAME_WIDTH,
  GAME_HEIGHT,
  randomUpTo,
} from './types';
import { PatternGenerator } from './PatternGenerator';
import { DifficultyScaler } from './DifficultyScaler';

export class GameEngine {
  private state: GameState;
  private rafId: number | null = null;
  private lastTime = 0;
  private onUpdate: (state: GameState) => void;
  private startTime: number = 0;
  private pressedKeys: Set<number> = new Set();
  private nextParticleId: number = 0;
  private nextBulletId: number = 0;
  private analogVelocityX = 0;
  private analogVelocityY = 0;
  private lastShotTime: number = 0;
  private patternGenerator: PatternGenerator;
  private nextEnemySpawnTime: number = 0;
  private currentMaxEnemies: number = 5;
  private difficultyScaler: DifficultyScaler = new DifficultyScaler();

  constructor(onUpdate: (state: GameState) => void) {
    this.onUpdate = onUpdate;
    this.startTime = performance.now();
    this.patternGenerator = new PatternGenerator(GAME_WIDTH, GAME_HEIGHT);
    this.nextEnemySpawnTime = this.startTime;
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
    if (keyCode === KEYS.SPACE) {
      if (this.state.isShipHit) {
        this.startTime = performance.now();
        this.state = this.makeInitialState(this.startTime);
        this.lastTime = this.startTime;
        this.onUpdate(this.state);
      } else {
        this.shoot();
      }
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
      this.updateBullets(delta);
      this.checkBulletCollisions();
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
    this.spawnEnemies(timestamp);

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

    const tier = this.difficultyScaler.getTierForScore(this.state.score);
    this.currentMaxEnemies = tier.maxEnemies;
  }

  private spawnEnemies(timestamp: number): void {
    this.patternGenerator.updateScore(this.state.score);
    const pattern = this.patternGenerator.getNextPattern(timestamp);

    if (!pattern) return;

    // Spawn enemies from pattern if time is right
    for (const spawn of pattern.spawns) {
      const spawnTime = this.nextEnemySpawnTime + spawn.delayMs;
      if (timestamp >= spawnTime && this.state.enemies.length < this.currentMaxEnemies) {
        this.createEnemy(spawn.column, timestamp);
      }
    }
  }

  private createEnemy(columnIndex: number, timestamp: number): void {
    const columnWidth = GAME_WIDTH / 10;
    const enemyX = (columnIndex + 0.5) * columnWidth;

    const enemy: EnemyState = {
      id: this.state.enemies.length,
      x: enemyX,
      y: ENEMY_START_Y,
      imageIndex: 0,
      startTime: timestamp,
      duration: 8000,
      hasScored: false,
    };

    this.state.enemies.push(enemy);
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
    this.patternGenerator = new PatternGenerator(GAME_WIDTH, GAME_HEIGHT);
    this.nextEnemySpawnTime = timestamp;
    this.currentMaxEnemies = 5;

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
      bullets: [],
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

  private shoot(): void {
    const now = performance.now();
    const FIRE_RATE = 200;

    if (now - this.lastShotTime < FIRE_RATE) return;

    this.lastShotTime = now;

    const BULLET_SPEED = 600;
    const SHIP_WIDTH = 80;
    const NOSE_OFFSET = SHIP_WIDTH / 2;

    const shipRotateAngle = (this.state.velocityX / 500) * 30;
    const bulletRotateAngle = shipRotateAngle * 1.2;
    const rotateRad = (bulletRotateAngle * Math.PI) / 180;
    const shipRotateRad = (shipRotateAngle * Math.PI) / 180;

    const vx = Math.sin(rotateRad) * BULLET_SPEED;
    const vy = -Math.cos(rotateRad) * BULLET_SPEED;

    const bulletX = this.state.shipX + NOSE_OFFSET * Math.sin(shipRotateRad);
    const bulletY = this.state.shipY - NOSE_OFFSET * Math.cos(shipRotateRad);

    const bullet: BulletState = {
      id: this.nextBulletId++,
      x: bulletX,
      y: bulletY,
      vx,
      vy,
      createdAt: now,
    };

    this.state.bullets.push(bullet);
  }

  private updateBullets(delta: number): void {
    this.state.bullets = this.state.bullets
      .map(bullet => ({
        ...bullet,
        x: bullet.x + bullet.vx * (delta / 1000),
        y: bullet.y + bullet.vy * (delta / 1000),
      }))
      .filter(bullet => {
        return (
          bullet.x >= -50 &&
          bullet.x <= GAME_WIDTH + 50 &&
          bullet.y >= -50 &&
          bullet.y <= GAME_HEIGHT + 50
        );
      });
  }

  private checkBulletCollisions(): void {
    const now = performance.now();
    const BULLET_RADIUS = 4;
    const ENEMY_WIDTH = 80;
    const ENEMY_HEIGHT = 80;

    for (let i = this.state.bullets.length - 1; i >= 0; i--) {
      const bullet = this.state.bullets[i];

      for (let j = this.state.enemies.length - 1; j >= 0; j--) {
        const enemy = this.state.enemies[j];

        const enemyLeft = enemy.x;
        const enemyRight = enemy.x + ENEMY_WIDTH;
        const enemyTop = enemy.y;
        const enemyBottom = enemy.y + ENEMY_HEIGHT;

        if (
          bullet.x >= enemyLeft &&
          bullet.x <= enemyRight &&
          bullet.y >= enemyTop &&
          bullet.y <= enemyBottom
        ) {
          this.state.bullets.splice(i, 1);
          this.state.score += 10;
          this.spawnParticles(enemy.x + ENEMY_WIDTH / 2, enemy.y + ENEMY_HEIGHT / 2, now);
          this.state.enemies[j] = { ...enemy, removedAt: now };
          break;
        }
      }
    }
  }
}
