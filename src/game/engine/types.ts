export interface EnemyState {
  id: number;
  x: number;
  y: number;
  imageIndex: number;
  startTime: number;
  duration: number;
  health: number;
  hasScored?: boolean;
  removedAt?: number;
  lastHitAt?: number;
  // Squid stalker (imageIndex === 1) fields. Unset for normal grunts.
  phase?: 'hunt' | 'dive';
  huntY?: number;
  lockOnAt?: number;
  diveStartTime?: number;
  diveStartY?: number;
  divePxPerMs?: number;
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
  color?: string;
  size?: number;
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
  deathAt?: number;
  enemies: EnemyState[];
  shields: ShieldState[];
  particles: ParticleState[];
  bullets: BulletState[];
}

export const ENEMY_COUNT = 15;
export const ENEMY_START_Y = -100;
export const ENEMY_END_Y = 950;
// Re-exported from the shared arcade design-size constants so every cabinet
// (space-barrage, asteroids, future games) renders in the same virtual
// coordinate space. Don't change these here — change them in
// `web/app/_arcade/designSize.ts`.
export {
  ARCADE_DESIGN_WIDTH as GAME_WIDTH,
  ARCADE_DESIGN_HEIGHT as GAME_HEIGHT,
} from '@arcade';

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

/**
 * Difficulty tier mapped to score ranges (every 100 points).
 * Defines max enemies and spawn speed for a tier.
 */
export interface DifficultyTier {
  /** Starting score for this difficulty tier */
  scoreStart: number;
  /** Ending score for this difficulty tier */
  scoreEnd: number;
  /** Maximum number of enemies allowed simultaneously */
  maxEnemies: number;
  /** Time in milliseconds for an enemy to traverse the screen */
  enemyTraverseDurationMs: number;
}

/**
 * Responsive grid configuration for enemy spawning.
 * Maintains fixed 10-column layout with scaling based on screen width.
 */
export const GRID_CONFIG = {
  NUM_COLUMNS: 10,
  PADDING_PERCENT: 0,
  /**
   * Calculate column width based on game width.
   * Always produces 10 equal columns regardless of screen size.
   * @param gameWidth - The total game width in pixels
   * @returns Column width in pixels
   */
  getColumnWidth: (gameWidth: number) => gameWidth / GRID_CONFIG.NUM_COLUMNS,
  /**
   * Calculate padding in pixels for a column.
   * Padding = 10% of column width on each side.
   * @param columnWidth - The width of a single column in pixels
   * @returns Padding in pixels
   */
  getPadding: (columnWidth: number) => columnWidth * GRID_CONFIG.PADDING_PERCENT,
  /**
   * Calculate enemy size based on column width.
   * Enemy size = column width - 2×padding (one on each side).
   * Inline calculation avoids circular reference.
   * @param columnWidth - The width of a single column in pixels
   * @returns Enemy size in pixels
   */
  getEnemySize: (columnWidth: number) => columnWidth - (columnWidth * GRID_CONFIG.PADDING_PERCENT * 2),
  /**
   * Calculate vertical spacing between enemies in same column.
   * Equals column width to maintain square grid (1:1 aspect ratio).
   * @param columnWidth - The width of a single column in pixels
   * @returns Vertical spacing in pixels
   */
  getVerticalSpacing: (columnWidth: number) => columnWidth,
} as const;
