import { PatternCycle, EnemySpawnEvent, DifficultyTier } from './types';
import { PatternFactory } from './PatternFactory';
import { ColumnManager } from './ColumnManager';
import { DifficultyScaler } from './DifficultyScaler';

/**
 * Orchestrates pattern generation using PatternFactory and DifficultyScaler.
 * Manages pattern cycling based on score and automatically generates new patterns
 * when the current pattern expires.
 */
export class PatternGenerator {
  private factory: PatternFactory;
  private scaler: DifficultyScaler;
  private currentScore: number = 0;
  private currentPatternCycle: PatternCycle | null = null;
  private patternStartTime: number = 0;

  constructor(gameWidth: number, gameHeight: number) {
    const columnManager = new ColumnManager(gameWidth, gameHeight);
    this.factory = new PatternFactory(columnManager);
    this.scaler = new DifficultyScaler();
  }

  /**
   * Updates current score for difficulty determination.
   * Called by GameEngine with the current game score.
   *
   * @param score The current game score
   */
  updateScore(score: number): void {
    this.currentScore = score;
  }

  /**
   * Returns pattern for current timestamp, generates new if needed.
   * Automatically transitions to the next pattern when the current one expires.
   *
   * @param timestamp Current game timestamp in milliseconds
   * @returns Current pattern or null if no pattern available
   */
  getNextPattern(timestamp: number): PatternCycle | null {
    const tier = this.scaler.getTierForScore(this.currentScore);

    // Check if we need a new pattern
    if (!this.currentPatternCycle || timestamp >= this.patternStartTime + this.currentPatternCycle.durationMs) {
      this.currentPatternCycle = this.generatePatternForTier(tier, timestamp);
      this.patternStartTime = timestamp;
    }

    return this.currentPatternCycle;
  }

  /**
   * Generates pattern based on tier type.
   * Randomizes diagonal direction and gaps alternation for variety.
   *
   * @param tier Difficulty tier with pattern type and constraints
   * @param timestamp Current timestamp
   * @returns Generated pattern for the tier
   */
  private generatePatternForTier(tier: DifficultyTier, timestamp: number): PatternCycle {
    const score = this.currentScore;
    const scoreInTier = score % 50;
    const scaleFactor = Math.floor(score / 300);

    switch (tier.patternType) {
      case 'wall':
        const wallPattern = this.factory.generateWallPattern(scoreInTier, tier.maxEnemies);
        return this.convertPatternCycleToPattern(wallPattern);

      case 'diagonal': {
        const direction = Math.random() < 0.5 ? 'ltr' : 'rtl';
        const diagonalPattern = this.factory.generateDiagonalPattern(scoreInTier, tier.maxEnemies, direction as 'ltr' | 'rtl');
        return this.convertPatternCycleToPattern(diagonalPattern);
      }

      case 'gaps': {
        const alternating = Math.random() < 0.5;
        const gapsPattern = this.factory.generateGapsPattern(scoreInTier, tier.maxEnemies, alternating);
        return this.convertPatternCycleToPattern(gapsPattern);
      }

      case 'random':
      default: {
        const randomPattern = this.factory.generateRandomPattern(scoreInTier, tier.maxEnemies);
        return this.convertPatternCycleToPattern(randomPattern);
      }
    }
  }

  /**
   * Returns the PatternCycle as-is for use by GameEngine.
   * The PatternCycle interface already contains all necessary spawn information.
   *
   * @param cycle Internal pattern cycle object from PatternFactory
   * @returns PatternCycle ready for GameEngine consumption
   */
  private convertPatternCycleToPattern(cycle: PatternCycle): PatternCycle {
    return cycle;
  }
}
