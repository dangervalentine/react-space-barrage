import { PatternCycle, EnemySpawnEvent } from './types';
import { ColumnManager } from './ColumnManager';

/**
 * Generates enemy spawn patterns (wall, diagonal, gaps, random) using ColumnManager.
 * These patterns are used by PatternGenerator to coordinate enemy spawning based on difficulty tiers.
 * Each pattern type creates a different visual and gameplay effect.
 */
export class PatternFactory {
  private columnManager: ColumnManager;

  /**
   * Creates a PatternFactory instance.
   * @param columnManager - ColumnManager instance for gap enforcement and column selection
   */
  constructor(columnManager: ColumnManager) {
    this.columnManager = columnManager;
  }

  /**
   * Generates a wall pattern.
   * All enemies spawn simultaneously across the width of the screen.
   * Uses ColumnManager's gap enforcement to ensure minimum spacing between columns.
   * @param patternStartTime - Score value when this pattern starts
   * @param maxEnemies - Maximum number of enemies to spawn in this pattern
   * @returns PatternCycle describing the wall spawn pattern
   */
  generateWallPattern(patternStartTime: number, maxEnemies: number): PatternCycle {
    const scoreRange: [number, number] = [patternStartTime, patternStartTime + 35];
    const columns = this.columnManager.selectColumnsWithGaps(maxEnemies, 1);

    const spawns: EnemySpawnEvent[] = columns.map((col, idx) => ({
      columnIndex: col,
      delayMs: 0,
      patternId: `wall_${patternStartTime}`,
    }));

    return {
      patternType: 'wall',
      spawns,
      durationMs: 3000,
      scoreRange,
    };
  }

  /**
   * Generates a diagonal pattern where enemies spawn in a diagonal line across the screen.
   * Enemies stagger with 100ms delays to create a visual slash effect (left-to-right or right-to-left).
   * @param patternStartTime - Score value when this pattern starts
   * @param maxEnemies - Maximum number of enemies to spawn (capped by number of columns)
   * @param direction - Diagonal direction: 'ltr' for left-to-right, 'rtl' for right-to-left
   * @returns PatternCycle describing the diagonal spawn pattern
   */
  generateDiagonalPattern(
    patternStartTime: number,
    maxEnemies: number,
    direction: 'ltr' | 'rtl'
  ): PatternCycle {
    const scoreRange: [number, number] = [patternStartTime, patternStartTime + 35];
    const numColumns = this.columnManager.getNumColumns();
    const columns = direction === 'ltr'
      ? Array.from({ length: numColumns }, (_, i) => i)
      : Array.from({ length: numColumns }, (_, i) => numColumns - 1 - i);

    const spawns: EnemySpawnEvent[] = columns.slice(0, maxEnemies).map((col, idx) => ({
      columnIndex: col,
      delayMs: 0,
      patternId: `diagonal_${direction}_${patternStartTime}`,
    }));

    return {
      patternType: 'diagonal',
      spawns,
      durationMs: 3000,
      scoreRange,
      metadata: { direction },
    };
  }

  /**
   * Generates a gaps pattern where enemies spawn in alternating columns (odd or even).
   * Creates vertical stripes of enemies with gaps between them.
   * All enemies spawn at the same time (no stagger).
   * @param patternStartTime - Score value when this pattern starts
   * @param maxEnemies - Maximum number of enemies to spawn
   * @param alternating - Whether to start on odd (true) or even (false) columns
   * @returns PatternCycle describing the gaps spawn pattern
   */
  generateGapsPattern(
    patternStartTime: number,
    maxEnemies: number,
    alternating: boolean
  ): PatternCycle {
    const scoreRange: [number, number] = [patternStartTime, patternStartTime + 35];
    const numColumns = this.columnManager.getNumColumns();
    const offset = alternating ? 1 : 0;

    const columns: number[] = [];
    for (let i = offset; i < numColumns; i += 2) {
      columns.push(i);
    }

    const spawns: EnemySpawnEvent[] = columns.slice(0, maxEnemies).map((col) => ({
      columnIndex: col,
      delayMs: 0,
      patternId: `gaps_${patternStartTime}`,
    }));

    return {
      patternType: 'gaps',
      spawns,
      durationMs: 3000,
      scoreRange,
      metadata: { alternating },
    };
  }

  /**
   * Generates a random pattern where 1 to maxEnemies spawn at random columns.
   * Creates unpredictable spawn behavior from 1 to maxEnemies at random columns, all spawning simultaneously.
   * @param patternStartTime - Score value when this pattern starts
   * @param maxEnemies - Maximum number of enemies to spawn
   * @param durationMs - Total duration of the pattern in milliseconds (default 3000)
   * @returns PatternCycle describing the random spawn pattern
   */
  generateRandomPattern(
    patternStartTime: number,
    maxEnemies: number,
    durationMs: number = 3000
  ): PatternCycle {
    const scoreRange: [number, number] = [patternStartTime, patternStartTime + 35];
    const numSpawns = Math.max(1, Math.floor(Math.random() * maxEnemies));
    const spawns: EnemySpawnEvent[] = [];

    for (let i = 0; i < numSpawns; i++) {
      const col = Math.floor(Math.random() * this.columnManager.getNumColumns());
      spawns.push({
        columnIndex: col,
        delayMs: 0,
        patternId: `random_${patternStartTime}_${i}`,
      });
    }

    return {
      patternType: 'random',
      spawns,
      durationMs,
      scoreRange,
    };
  }
}
