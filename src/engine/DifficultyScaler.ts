import { DifficultyTier } from './types';

/**
 * Maps player score to difficulty tiers, progressively increasing challenge
 * through pattern changes, increased speed, and more enemies.
 *
 * Difficulty increases in 50-point intervals:
 * - Pattern type cycles every 300 points
 * - Speed increases by ~600ms per 300-point cycle
 * - Max enemies increases by 1 per cycle
 */
export class DifficultyScaler {
  /**
   * Base tier definitions that repeat in cycles.
   * Each tier represents one 50-point interval.
   */
  private baseTiers: Omit<DifficultyTier, 'scoreStart' | 'scoreEnd'>[] = [
    { maxEnemies: 7, enemyTraverseDurationMs: 2000, patternType: 'wall' },
    { maxEnemies: 8, enemyTraverseDurationMs: 1900, patternType: 'random' },
    { maxEnemies: 9, enemyTraverseDurationMs: 1800, patternType: 'diagonal' },
    { maxEnemies: 10, enemyTraverseDurationMs: 1700, patternType: 'random' },
    { maxEnemies: 11, enemyTraverseDurationMs: 1600, patternType: 'gaps' },
    { maxEnemies: 12, enemyTraverseDurationMs: 1500, patternType: 'random' },
  ];

  /** Points per complete difficulty cycle */
  private cycleLength = 200;

  /** Points per tier interval */
  private tierDuration = 35;

  /**
   * Maps a score to its corresponding difficulty tier.
   *
   * Calculates the appropriate tier based on:
   * - Current position in the 300-point cycle (determines pattern type)
   * - Number of completed cycles (determines speed and enemy count increases)
   *
   * Speed scales down (duration decreases) by 600ms per completed cycle.
   * Enemy count increases by 1 per completed cycle.
   *
   * @param score - The player's current score
   * @returns A DifficultyTier with bounds, pattern, speed, and enemy count
   */
  getTierForScore(score: number): DifficultyTier {
    const cyclePosition = score % this.cycleLength;
    const tierIndex = Math.floor(cyclePosition / this.tierDuration);
    const cycleCount = Math.floor(score / this.cycleLength);

    const baseTier = this.baseTiers[tierIndex % this.baseTiers.length];

    // Speed increases per cycle: -600ms per cycle
    const speedIncrease = cycleCount * 600;
    const duration = Math.max(1000, baseTier.enemyTraverseDurationMs - speedIncrease);

    // Enemy count increases per tier, resets per cycle
    const maxEnemies = baseTier.maxEnemies + cycleCount;

    const cycleStart = cycleCount * this.cycleLength;
    const scoreStart = cycleStart + (tierIndex * this.tierDuration);
    const scoreEnd = scoreStart + this.tierDuration;

    return {
      scoreStart,
      scoreEnd,
      maxEnemies,
      enemyTraverseDurationMs: duration,
      patternType: baseTier.patternType,
    };
  }

  /**
   * Returns all difficulty tiers in a single 300-point cycle.
   *
   * Useful for displaying progression information or pre-calculating
   * the pattern of difficulty changes.
   *
   * @returns Array of 6 DifficultyTier objects covering scores 0-300
   */
  getAllTiers(): DifficultyTier[] {
    const tiers: DifficultyTier[] = [];
    for (let score = 0; score < this.cycleLength; score += this.tierDuration) {
      tiers.push(this.getTierForScore(score));
    }
    return tiers;
  }

  /**
   * Returns the wave spawn delay in milliseconds based on difficulty tier.
   *
   * Delay decreases as difficulty increases, making the game faster:
   * - Tier 0 (score 0-50, 300-350, etc): 1000ms between patterns
   * - Tier 1 (score 50-100, 350-400, etc): 800ms
   * - Tier 2 (score 100-150, 400-450, etc): 600ms
   * - Tier 3+ (score 150-300, 450+, etc): 400ms
   *
   * Correctly handles cycle wrapping to map absolute score to relative tier position.
   *
   * @param tier - The difficulty tier
   * @returns Delay in milliseconds between pattern spawns
   */
  waveDelayMs(tier: DifficultyTier): number {
    const cyclePosition = tier.scoreStart % this.cycleLength;
    const tierIndex = Math.floor(cyclePosition / this.tierDuration);

    switch (Math.min(tierIndex, 3)) {
      case 0:
        return 1000;
      case 1:
        return 800;
      case 2:
        return 600;
      default:
        return 400;
    }
  }
}
