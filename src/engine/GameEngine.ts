import {
  GameState,
  EnemyState,
  KEYS,
  ENEMY_COUNT,
  ENEMY_START_Y,
  ENEMY_END_Y,
  GAME_WIDTH,
  randomUpTo,
} from './types';

export class GameEngine {
  private state: GameState;
  private rafId: number | null = null;
  private lastTime = 0;
  private onUpdate: (state: GameState) => void;
  private startTime: number = 0;
  private pressedKeys: Set<number> = new Set();

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
    if (keyCode === KEYS.SPACE) {
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

  private tick = (timestamp: number): void => {
    const delta = Math.min(timestamp - this.lastTime, 16.67 * 3);
    this.lastTime = timestamp;

    if (!this.state.isShipHit) {
      this.updateShip(delta);
      this.updateEnemies(timestamp);
    }

    this.onUpdate({ ...this.state });
    this.rafId = requestAnimationFrame(this.tick);
  };

  private updateShip(delta: number): void {
    const MAX_VELOCITY = 500;
    const ACCELERATION = 1500;

    const { shipX, velocity } = this.state;
    let newVelocity = velocity;

    const isMovingLeft = this.pressedKeys.has(KEYS.LEFT) || this.pressedKeys.has(KEYS.A);
    const isMovingRight = this.pressedKeys.has(KEYS.RIGHT) || this.pressedKeys.has(KEYS.D);

    if (isMovingLeft && !isMovingRight) {
      newVelocity = Math.max(newVelocity - ACCELERATION * (delta / 1000), -MAX_VELOCITY);
    } else if (isMovingRight && !isMovingLeft) {
      newVelocity = Math.min(newVelocity + ACCELERATION * (delta / 1000), MAX_VELOCITY);
    } else {
      newVelocity *= Math.pow(0.5, delta / 1000);
      if (Math.abs(newVelocity) < 10) newVelocity = 0;
    }

    this.state.velocity = newVelocity;

    const maxX = GAME_WIDTH - 60;
    const minX = -40;
    const newX = shipX + newVelocity * (delta / 1000);

    if (newX <= maxX && newX >= minX) {
      this.state.shipX = newX;
    } else if (newX > maxX) {
      this.state.shipX = minX;
    } else {
      this.state.shipX = maxX;
    }
  }

  private updateEnemies(timestamp: number): void {
    const shipX = this.state.shipX;

    this.state.enemies = this.state.enemies.map((enemy, idx) => {
      const y = this.getEnemyY(enemy, timestamp);
      const updatedEnemy = { ...enemy, y };

      if (idx === 0) {
        console.log(
          `Enemy 0: startTime=${enemy.startTime}, now=${timestamp}, duration=${enemy.duration}, progress=${(timestamp - enemy.startTime) / enemy.duration}, y=${y}`
        );
      }

      if (this.checkCollision(shipX, y, enemy.x)) {
        this.state.isShipHit = true;
      }

      if (y >= 825) {
        this.state.score += 1;
        return this.createNewEnemy(enemy.id, timestamp);
      }

      return updatedEnemy;
    });
  }

  private checkCollision(shipX: number, enemyY: number, enemyX: number): boolean {
    const SHIP_WIDTH = 80;
    const SHIP_HEIGHT = 80;
    const SHIP_Y = 720;
    const ENEMY_WIDTH = 80;
    const ENEMY_HEIGHT = 80;
    const PADDING = 20;

    const shipLeft = shipX - SHIP_WIDTH / 2 + PADDING;
    const shipRight = shipX + SHIP_WIDTH / 2 - PADDING;
    const shipTop = SHIP_Y + PADDING;
    const shipBottom = SHIP_Y + SHIP_HEIGHT - PADDING;

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

  private getAvailableXPosition(): number {
    const occupiedXPositions = new Set(this.state.enemies.map(e => e.x));
    const allXPositions = Array.from({ length: 11 }, (_, i) => i * 100);
    const availablePositions = allXPositions.filter(x => !occupiedXPositions.has(x));

    if (availablePositions.length > 0) {
      return availablePositions[Math.floor(Math.random() * availablePositions.length)];
    }
    return randomUpTo(11) * 100;
  }

  private createNewEnemy(id: number, timestamp: number): EnemyState {
    return {
      id,
      x: this.getAvailableXPosition(),
      y: ENEMY_START_Y,
      imageIndex: randomUpTo(3),
      startTime: timestamp,
      duration: randomUpTo(5000) + 3000,
    };
  }

  private makeInitialState(timestamp: number): GameState {
    const SPAWN_STAGGER_MS = 350;

    return {
      score: 0,
      shipX: 490,
      velocity: 0,
      isShipHit: false,
      enemies: Array.from({ length: ENEMY_COUNT }, (_, i) => ({
        id: i,
        x: (i % 11) * 100,
        y: ENEMY_START_Y,
        imageIndex: randomUpTo(3),
        startTime: timestamp + i * SPAWN_STAGGER_MS,
        duration: randomUpTo(5000) + 3000,
      })),
    };
  }
}
