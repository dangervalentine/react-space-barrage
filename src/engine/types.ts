export interface EnemyState {
  id: number;
  x: number;
  y: number;
  imageIndex: number;
  startTime: number;
  duration: number;
}

export interface GameState {
  score: number;
  shipX: number;
  rVelocity: number;
  lVelocity: number;
  isShipHit: boolean;
  enemies: EnemyState[];
}

export const ENEMY_COUNT = 15;
export const ENEMY_START_Y = -100;
export const ENEMY_END_Y = 950;
export const GAME_WIDTH = 1080;
export const GAME_HEIGHT = 800;

export const KEYS = {
  SPACE: 32,
  LEFT: 37,
  RIGHT: 39,
  A: 65,
  D: 68,
} as const;

export const randomUpTo = (upperLimit: number): number =>
  Math.floor(Math.random() * upperLimit);
