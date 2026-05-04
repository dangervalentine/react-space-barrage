import { GRID_CONFIG } from './types';

/**
 * Represents a period during which a grid column is occupied by an entity.
 * Occupancy can be time-based (startTime/endTime) or position-based (yStart/yEnd), or both.
 * Used to prevent multiple enemies from spawning too close together in the same column.
 */
interface ColumnOccupancy {
  startTime: number;
  endTime: number;
  yStart?: number;
  yEnd?: number;
}

/**
 * Manages the grid-based enemy spawning system.
 * Divides game width into 10 fixed columns with responsive sizing.
 * Tracks column occupancy to prevent collisions and enforce gap patterns.
 */
export class ColumnManager {
  private gameWidth: number;
  private gameHeight: number;
  private numColumns: number;
  private columnWidth: number;
  private verticalSpacing: number;
  private occupancy: Map<number, ColumnOccupancy[]> = new Map();

  constructor(gameWidth: number, gameHeight: number) {
    this.gameWidth = gameWidth;
    this.gameHeight = gameHeight;
    this.numColumns = GRID_CONFIG.NUM_COLUMNS;
    this.columnWidth = GRID_CONFIG.getColumnWidth(gameWidth);
    this.verticalSpacing = GRID_CONFIG.getVerticalSpacing(this.columnWidth);

    for (let i = 0; i < this.numColumns; i++) {
      this.occupancy.set(i, []);
    }
  }

  /**
   * Get the total number of columns in the grid.
   * @returns Number of columns (always 10)
   */
  getNumColumns(): number {
    return this.numColumns;
  }

  /**
   * Get the width of a single column in pixels.
   * @returns Column width calculated as gameWidth / numColumns
   */
  getColumnWidth(): number {
    return this.columnWidth;
  }

  /**
   * Get the responsive enemy size for the current column width.
   * @returns Enemy size in pixels, scaled based on column width
   */
  getEnemySize(): number {
    return GRID_CONFIG.getEnemySize(this.columnWidth);
  }

  getVerticalSpacing(): number {
    return this.verticalSpacing;
  }

  /**
   * Calculate the center X position of a column.
   * @param columnIndex - Column index (0-9)
   * @returns X coordinate of column center in pixels
   */
  getColumnCenterX(columnIndex: number): number {
    return (columnIndex + 0.5) * this.columnWidth;
  }

  /**
   * Check if a column is free (unoccupied) at a specific time.
   * @param columnIndex - Column index (0-9)
   * @param atTime - Time in milliseconds to check
   * @returns true if column is unoccupied at the given time, false otherwise or if index is invalid
   */
  isColumnFree(columnIndex: number, atTime: number): boolean {
    if (columnIndex < 0 || columnIndex >= this.numColumns) return false;
    const occupants = this.occupancy.get(columnIndex) || [];
    return !occupants.some(occ => atTime >= occ.startTime && atTime < occ.endTime);
  }

  /**
   * Check if a column is free at a specific Y position with vertical spacing.
   * Respects the gap between occupied regions to prevent visual overlap.
   * Edge case: Enemies with undefined yStart/yEnd are ignored (time-based only occupancy).
   * @param columnIndex - Column index (0-9)
   * @param yPosition - Y coordinate of the proposed enemy
   * @param enemySize - Height of the enemy in pixels
   * @returns true if column is free at the given Y position with proper spacing, false otherwise
   */
  isColumnFreeAtY(columnIndex: number, yPosition: number, enemySize: number): boolean {
    if (columnIndex < 0 || columnIndex >= this.numColumns) return false;
    const occupants = this.occupancy.get(columnIndex) || [];
    const yEnd = yPosition + enemySize;
    return !occupants.some(occ => {
      if (occ.yStart === undefined || occ.yEnd === undefined) return false;
      const gap = this.verticalSpacing;
      // Collision if: new enemy overlaps with occupied region including gap
      return !(yEnd + gap <= occ.yStart || yPosition - gap >= occ.yEnd);
    });
  }

  /**
   * Mark a column as occupied during a time period.
   * Optionally specify Y-position boundaries for vertical spacing validation.
   * @param columnIndex - Column index (0-9)
   * @param startTime - Start time in milliseconds
   * @param durationMs - Duration in milliseconds
   * @param yStart - Optional Y position start for collision detection
   * @param yEnd - Optional Y position end for collision detection
   */
  occupyColumn(columnIndex: number, startTime: number, durationMs: number, yStart?: number, yEnd?: number): void {
    if (columnIndex < 0 || columnIndex >= this.numColumns) return;
    const occupants = this.occupancy.get(columnIndex) || [];
    occupants.push({
      startTime,
      endTime: startTime + durationMs,
      yStart,
      yEnd,
    });
  }

  /**
   * Select random columns with gap enforcement.
   * Ensures minimum gap between selected columns (used for wall patterns).
   * Edge case: If not enough columns available with the gap requirement, returns fewer than requested.
   * @param count - Number of columns to select
   * @param minGap - Minimum gap between selected columns (default 1)
   * @returns Array of selected column indices, sorted ascending, or fewer if insufficient available
   */
  selectColumnsWithGaps(count: number, minGap: number = 1): number[] {
    const available = Array.from({ length: this.numColumns }, (_, i) => i);
    const selected: number[] = [];

    while (selected.length < count && available.length > 0) {
      const randomIdx = Math.floor(Math.random() * available.length);
      const column = available[randomIdx];

      const isValid = !selected.some(
        col => Math.abs(col - column) <= minGap
      );

      if (isValid) {
        selected.push(column);
      }

      available.splice(randomIdx, 1);
    }

    return selected.sort((a, b) => a - b);
  }

  /**
   * Clear all occupancy data, resetting the grid to an empty state.
   * Efficiently clears existing arrays rather than creating new ones.
   */
  reset(): void {
    this.occupancy.forEach(arr => arr.length = 0);
  }
}
