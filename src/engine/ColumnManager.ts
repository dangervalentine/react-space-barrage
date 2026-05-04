import { GRID_CONFIG } from './types';

interface ColumnOccupancy {
  startTime: number;
  endTime: number;
  yStart?: number;
  yEnd?: number;
}

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

  getNumColumns(): number {
    return this.numColumns;
  }

  getColumnWidth(): number {
    return this.columnWidth;
  }

  getEnemySize(): number {
    return GRID_CONFIG.getEnemySize(this.columnWidth);
  }

  getVerticalSpacing(): number {
    return this.verticalSpacing;
  }

  getColumnCenterX(columnIndex: number): number {
    return (columnIndex + 0.5) * this.columnWidth;
  }

  isColumnFree(columnIndex: number, atTime: number): boolean {
    if (columnIndex < 0 || columnIndex >= this.numColumns) return false;
    const occupants = this.occupancy.get(columnIndex) || [];
    return !occupants.some(occ => atTime >= occ.startTime && atTime < occ.endTime);
  }

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

  reset(): void {
    for (let i = 0; i < this.numColumns; i++) {
      this.occupancy.set(i, []);
    }
  }
}
