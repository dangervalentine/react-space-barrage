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

  handleKey(keyCode: number): void {
    if (keyCode === KEYS.SPACE) {
      this.startTime = performance.now();
      this.state = this.makeInitialState(this.startTime);
      this.lastTime = this.startTime;
      this.onUpdate(this.state);
      return;
    }

    const { rVelocity, lVelocity } = this.state;

    if (keyCode === KEYS.RIGHT || keyCode === KEYS.D) {
      this.state.rVelocity = rVelocity < 20 ? rVelocity + 2 : 20;
    }

    if (keyCode === KEYS.LEFT || keyCode === KEYS.A) {
      this.state.lVelocity = lVelocity > -20 ? lVelocity - 2 : -20;
    }
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
    const deltaFactor = delta / 50;
    const { rVelocity, lVelocity, shipX } = this.state;

    this.state.lVelocity = lVelocity < 0 ? lVelocity + 1 : 0;
    this.state.rVelocity = rVelocity > 0 ? rVelocity - 1 : 0;

    const newVelocity = this.state.lVelocity + this.state.rVelocity;
    const maxX = GAME_WIDTH - 60;
    const minX = -40;

    if (newVelocity >= 0) {
      this.state.shipX = shipX <= maxX ? shipX + newVelocity * deltaFactor : minX;
    } else if (newVelocity <= 0) {
      this.state.shipX = shipX >= minX ? shipX + newVelocity * deltaFactor : maxX;
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
    const SHIP_WIDTH = 60;
    const SHIP_HEIGHT = 60;
    const SHIP_Y = 720;
    const ENEMY_WIDTH = 80;
    const ENEMY_HEIGHT = 80;

    const shipLeft = shipX - SHIP_WIDTH / 2;
    const shipRight = shipX + SHIP_WIDTH / 2;
    const shipTop = SHIP_Y;
    const shipBottom = SHIP_Y + SHIP_HEIGHT;

    const enemyLeft = enemyX - ENEMY_WIDTH / 2;
    const enemyRight = enemyX + ENEMY_WIDTH / 2;
    const enemyTop = enemyY;
    const enemyBottom = enemyY + ENEMY_HEIGHT;

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

  private createNewEnemy(id: number, timestamp: number): EnemyState {
    return {
      id,
      x: randomUpTo(11) * 100,
      y: ENEMY_START_Y,
      imageIndex: randomUpTo(3),
      startTime: timestamp,
      duration: randomUpTo(5000) + 3000,
    };
  }

  private makeInitialState(timestamp: number): GameState {
    return {
      score: 0,
      shipX: 490,
      rVelocity: 0,
      lVelocity: 0,
      isShipHit: false,
      enemies: Array.from({ length: ENEMY_COUNT }, (_, i) =>
        this.createNewEnemy(i, timestamp)
      ),
    };
  }
}
