// import { ColumnManager } from './ColumnManager';

// describe('ColumnManager', () => {
//   let manager: ColumnManager;

//   beforeEach(() => {
//     manager = new ColumnManager(1080, 800);
//   });

//   test('should initialize with correct column count', () => {
//     expect(manager.getNumColumns()).toBe(10);
//   });

//   test('should calculate correct column width', () => {
//     const columnWidth = manager.getColumnWidth();
//     expect(columnWidth).toBe(108); // 1080 / 10
//   });

//   test('should calculate correct enemy size', () => {
//     const enemySize = manager.getEnemySize();
//     expect(enemySize).toBeCloseTo(86.4, 1); // 108 - (2 * 10.8)
//   });

//   test('should return column center X position', () => {
//     const centerX = manager.getColumnCenterX(0);
//     expect(centerX).toBe(54); // (0 + 0.5) * 108
//   });

//   test('should identify free columns', () => {
//     expect(manager.isColumnFree(0, 0)).toBe(true);
//     expect(manager.isColumnFree(0, 100)).toBe(true);
//   });

//   test('should occupy column at specific time and duration', () => {
//     manager.occupyColumn(0, 0, 1000);
//     expect(manager.isColumnFree(0, 500)).toBe(false);
//     expect(manager.isColumnFree(0, 1001)).toBe(true);
//   });

//   test('should respect vertical spacing in same column', () => {
//     const verticalSpacing = manager.getVerticalSpacing();
//     const enemySize = manager.getEnemySize();
//     manager.occupyColumn(0, 0, 500, 0, enemySize);
//     // Enemy at column 0, y=0 occupies vertical space
//     // Next enemy in same column must be at least verticalSpacing apart
//     expect(manager.isColumnFreeAtY(0, 0, enemySize)).toBe(false);
//     expect(manager.isColumnFreeAtY(0, verticalSpacing + enemySize, enemySize)).toBe(true);
//   });

//   test('should select random available columns with gap enforcement', () => {
//     const selected = manager.selectColumnsWithGaps(5, 1);
//     expect(selected.length).toBe(5);
//     // Verify gaps: no two consecutive columns
//     for (let i = 0; i < selected.length - 1; i++) {
//       expect(Math.abs(selected[i] - selected[i + 1])).toBeGreaterThan(1);
//     }
//   });

//   test('should reset state', () => {
//     manager.occupyColumn(0, 0, 1000);
//     manager.reset();
//     expect(manager.isColumnFree(0, 0)).toBe(true);
//   });
// });
