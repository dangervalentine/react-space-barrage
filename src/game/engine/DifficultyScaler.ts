import { DifficultyTier } from './types';

/**
 * Maps player score to difficulty tiers, progressively increasing challenge
 * through pattern changes, increased speed, and more enemies.
 *
 * Difficulty increases in 100-point intervals:
 * - Pattern type cycles every 600 points
 * - Speed increases by ~300ms per 600-point cycle
 * - Max enemies increases by 1 per cycle
 */
export class DifficultyScaler {
  /**
   * Base tier definitions that repeat in cycles.
   * Each tier represents one 100-point interval.
   */
  private baseTiers: Omit<DifficultyTier, 'scoreStart' | 'scoreEnd'>[] = [
    { maxEnemies: 5, enemyTraverseDurationMs: 2500 },
    { maxEnemies: 5, enemyTraverseDurationMs: 2400 },
    { maxEnemies: 5, enemyTraverseDurationMs: 2300 },
    { maxEnemies: 5, enemyTraverseDurationMs: 2200 },
    { maxEnemies: 6, enemyTraverseDurationMs: 2100 },
    { maxEnemies: 7, enemyTraverseDurationMs: 2000 },
  ];

  /** Points per complete difficulty cycle (6 tiers × tierDuration) */
  private cycleLength = 600;

  /** Points per tier interval */
  private tierDuration = 100;

  /**
   * Maps a score to its corresponding difficulty tier.
   *
   * Calculates the appropriate tier based on:
   * - Current position in the 200-point cycle (determines pattern type)
   * - Number of completed cycles (determines speed and enemy count increases)
   *
   * Speed scales down (duration decreases) by 300ms per completed cycle.
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

    // Speed increases per cycle: -300ms per cycle
    const speedIncrease = cycleCount * 300;
    const duration = Math.max(500, baseTier.enemyTraverseDurationMs - speedIncrease);

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
    };
  }

  /**
   * Returns all difficulty tiers in a single 200-point cycle.
   *
   * Useful for displaying progression information or pre-calculating
   * the pattern of difficulty changes.
   *
   * @returns Array of 6 DifficultyTier objects covering scores 0-210
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
   * Delay decreases by 40ms per tier within a cycle, then resets at each
   * new cycle:
   * - Tier 0: 900ms between waves
   * - Tier 1: 860ms
   * - Tier 2: 820ms
   * - Tier 3: 780ms
   * - Tier 4: 740ms
   * - Tier 5: 700ms
   * Floored at 500ms.
   *
   * Correctly handles cycle wrapping to map absolute score to relative tier position.
   *
   * @param tier - The difficulty tier
   * @returns Delay in milliseconds between pattern spawns
   */
  waveDelayMs(tier: DifficultyTier): number {
    const cyclePosition = tier.scoreStart % this.cycleLength;
    const tierIndex = Math.floor(cyclePosition / this.tierDuration);

    const baseDelay = 900;
    const decrementPerTier = 40;
    const minimumDelay = 500;

    const delay = baseDelay - (tierIndex * decrementPerTier);
    return Math.max(delay, minimumDelay);
  }
}
