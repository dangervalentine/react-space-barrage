export interface EnemyState {
  id: number;
  x: number;
  y: number;
  imageIndex: number;
  startTime: number;
  duration: number;
  hasScored?: boolean;
  removedAt?: number;
}

export interface ShieldState {
  id: number;
  x: number;
  y: number;
  startTime: number;
  duration: number;
}

export interface ParticleState {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  createdAt: number;
  lifetime: number;
}

export interface BulletState {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  createdAt: number;
}

export interface GameState {
  score: number;
  highScore: number;
  lives: number;
  shipX: number;
  shipY: number;
  velocityX: number;
  velocityY: number;
  isShipHit: boolean;
  lastHitTime: number;
  enemies: EnemyState[];
  shields: ShieldState[];
  particles: ParticleState[];
  bullets: BulletState[];
}

export const ENEMY_COUNT = 15;
export const ENEMY_START_Y = -100;
export const ENEMY_END_Y = 950;
export const GAME_WIDTH = 1080;
export const GAME_HEIGHT = 800;

export const KEYS = {
  SPACE: 32,
  LEFT: 37,
  UP: 38,
  RIGHT: 39,
  DOWN: 40,
  A: 65,
  D: 68,
  W: 87,
  S: 83,
} as const;

export const randomUpTo = (upperLimit: number): number =>
  Math.floor(Math.random() * upperLimit);

export interface EnemySpawnEvent {
  columnIndex: number;
  delayMs: number;
  patternId: string;
}

export interface PatternCycle {
  patternType: "wall" | "diagonal" | "gaps" | "random";
  spawns: EnemySpawnEvent[];
  durationMs: number;
  scoreRange: [number, number];
  metadata?: {
    direction?: "ltr" | "rtl";
    alternating?: boolean;
  };
}

export interface DifficultyTier {
  scoreStart: number;
  scoreEnd: number;
  maxEnemies: number;
  enemyTraverseDurationMs: number;
  patternType: string;
}

export const GRID_CONFIG = {
  NUM_COLUMNS: 10,
  PADDING_PERCENT: 0.1,
  getColumnWidth: (gameWidth: number) => gameWidth / GRID_CONFIG.NUM_COLUMNS,
  getPadding: (columnWidth: number) => columnWidth * GRID_CONFIG.PADDING_PERCENT,
  getEnemySize: (columnWidth: number) => columnWidth - (2 * GRID_CONFIG.getPadding(columnWidth)),
  getVerticalSpacing: (columnWidth: number) => columnWidth,
} as const;
